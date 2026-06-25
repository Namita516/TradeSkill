import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { putItem, queryItems, scanItems } from '../awsConfig';
import { getCanonicalId } from '../utils/idUtils';
import './Chatbox.css';

const Chatbox = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRef = useRef(null);

  const partner = location.state?.partner;

  // Wrapped in useMemo to prevent unnecessary dependency changes on re-renders
  const myData = useMemo(() => {
    return JSON.parse(sessionStorage.getItem('currentUser')) || { name: "Guest" };
  }, []);

  const myName = myData.name;

  // Prefer stable `userId` first, then email — keeps chat keys consistent across clients
  const myIdentifier = getCanonicalId(myData);
  const partnerIdentifier = getCanonicalId(partner);

  const partners = [myIdentifier, partnerIdentifier].sort();
  const chatId = `chat_${partners[0]}_${partners[1]}`.replace(/\s/g, '');
  const roomName = `TradeSkill-${partners[0]}-${partners[1]}`.replace(/\s/g, '');
  const sessionLink = `https://meet.jit.si/${roomName}`;

  useEffect(() => {
    if (!myData?.email || !partner?.name) {
      navigate('/home', { replace: true });
    }
  }, [navigate, myData, partner]);

  useEffect(() => {
    console.debug('[Chatbox] mount', { currentUser: myData, partner });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);

  // Load messages from DynamoDB
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const messages = await queryItems('Messages', 
          'chatId = :chatId',
          { ':chatId': chatId }
        );
        setChatHistory(messages.sort((a, b) => a.timestamp - b.timestamp));
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };
    loadMessages();
    
    // Poll every 3 seconds for new messages
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [chatId]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const messageId = `msg_${Date.now()}`;
    const newMessage = {
      messageId: messageId,
      chatId: chatId,
      senderEmail: myData.email,
      senderName: myName,
      text: message,
      timestamp: Date.now(),
      time: new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      isInvite: false
    };

    try {
      console.debug('[Chatbox] send debug', {
        myIdentifier,
        partnerIdentifier,
        chatId,
        message
      });
      // Save message to Messages table
      await putItem('Messages', newMessage);
      
      // Add to local state
      setChatHistory(prev => [...prev, newMessage]);

      // Resolve recipient userId (prefer userId, fallback to email) so InboxHeads partition key matches recipient
      let recipientUserId = partner?.userId || partner?.id || null;
      if (!recipientUserId && partner?.email) {
        try {
          const users = await scanItems('Users');
          const found = users.find(u => (u.email || '').toLowerCase() === (partner.email || '').toLowerCase());
          if (found) recipientUserId = found.userId || found.id || found.email;
        } catch (err) {
          console.error('Failed to resolve recipient userId:', err);
        }
      }
      const inboxUserId = String(recipientUserId || partner.email || partnerIdentifier || 'unknown');
      console.debug('[Chatbox] resolved inboxUserId', { recipientUserId, inboxUserId });

      // Save to InboxHeads table using resolved inboxUserId as PK
      const inboxRes = await putItem('InboxHeads', {
        userId: inboxUserId,
        chatId: String(chatId),
        lastMessage: message,
        senderId: String(myIdentifier),
        senderEmail: myData.email,
        senderName: myName,
        receiverName: partner.name,
        timestamp: Date.now(),
        unread: true,
        senderData: {
          userId: myData.userId || String(myIdentifier),
          id: String(myIdentifier),
          name: myName,
          email: myData.email,
          teach: myData.skillsToTeach?.[0] || "Skills",
          learn: myData.skillsToLearn?.[0] || "Knowledge",
          skillsToTeach: myData.skillsToTeach,
          skillsToLearn: myData.skillsToLearn
        }
      });
      console.debug('[Chatbox] InboxHeads put result', inboxRes);

      setMessage("");
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleEnterSession = async () => {
    const messageId = `msg_${Date.now()}`;
    const sessionId = `sess_${Date.now()}`;
    const inviteMessage = {
      messageId: messageId,
      chatId: chatId,
      senderEmail: myData.email,
      senderName: myName,
      text: `🚀 ${myName} started a session! Click to Join.`,
      timestamp: Date.now(),
      time: new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      isInvite: true,
      sessionLink: sessionLink
    };

    try {
      // Save invite message to Messages table
      const msgRes = await putItem('Messages', inviteMessage);
      console.debug('[Chatbox] Messages put result', msgRes);
      setChatHistory(prev => [...prev, inviteMessage]);

      // Create a VideoSessions record for live session state
      const sessionRecord = {
        sessionId: sessionId,
        chatId: chatId,
        roomName: roomName,
        sessionLink: sessionLink,
        hostUserId: String(myIdentifier),
        hostEmail: myData.email,
        partnerUserId: String(partnerIdentifier),
        status: 'active',
        startedAt: Date.now(),
        notes: '',
        uploadedFiles: [],
        roleHistory: [{ userId: String(myIdentifier), role: 'teaching', at: Date.now() }]
      };

      const sessRes = await putItem('VideoSessions', sessionRecord);
      console.debug('[Chatbox] VideoSessions put result', sessRes);

      // Resolve recipient id for InboxHeads
      let recipientUserId = partner?.userId || partner?.id || null;
      if (!recipientUserId && partner?.email) {
        try {
          const users = await scanItems('Users');
          const found = users.find(u => (u.email || '').toLowerCase() === (partner.email || '').toLowerCase());
          if (found) recipientUserId = found.userId || found.id || found.email;
        } catch (err) {
          console.error('Failed to resolve recipient userId for invite:', err);
        }
      }
      const inboxUserId = String(recipientUserId || partner.email || partnerIdentifier || 'unknown');
      console.debug('[Chatbox] invite resolved inboxUserId', { recipientUserId, inboxUserId });

      // Update InboxHeads
      const inboxRes = await putItem('InboxHeads', {
        userId: inboxUserId,
        chatId: String(chatId),
        lastMessage: `🚀 ${myName} started a session!`,
        senderId: String(myIdentifier),
        senderEmail: myData.email,
        senderName: myName,
        receiverName: partner.name,
        timestamp: Date.now(),
        unread: true,
        senderData: {
          userId: myData.userId || String(myIdentifier),
          id: String(myIdentifier),
          name: myName,
          email: myData.email,
          teach: myData.skillsToTeach?.[0] || "Skills",
          learn: myData.skillsToLearn?.[0] || "Knowledge",
          skillsToTeach: myData.skillsToTeach,
          skillsToLearn: myData.skillsToLearn
        }
      });
      console.debug('[Chatbox] InboxHeads put result (invite)', inboxRes);

      navigate('/workspace', { state: { partner: partner, sessionId } });
    } catch (error) {
      console.error('Failed to create session invite:', error);
    }
  };

  return (
    <div className="chatbox-master">
      <nav className="chat-nav">
        <div className="nav-top" onClick={() => navigate('/home')}>
          <div className="back-icon">✕</div>
        </div>
        <div className="active-swaps">
          <div className="swap-thumb active">{partner?.name?.charAt(0) || "?"}</div>
        </div>
      </nav>

      <main className="chat-main">
        <header className="chat-info-bar">
          {/* Mobile specific back option wrapper */}
          <div className="mobile-back-wrapper" onClick={() => navigate('/home')}>
            <span className="back-icon">←</span> 
          </div>

          <div className="partner-profile">
            <div className="status-ring">
              <div className="avatar-med">{partner?.name?.charAt(0) || "?"}</div>
              <div className="online-pulse"></div>
            </div>
            <div className="partner-details">
              <h3>{partner?.name || "User"}</h3>
              <p>
                Teaching{' '}
                <span>{partner?.teach || partner?.skillsToTeach?.[0] || "Skills"}</span>
                {' '}for{' '}
                <span>{partner?.learn || partner?.skillsToLearn?.[0] || "Knowledge"}</span>
              </p>
            </div>
          </div>
          
          <button className="start-workspace-btn" onClick={handleEnterSession}>
            🚀 <span>Enter Session</span>
          </button>
        </header>

        <div className="chat-feed" ref={scrollRef}>
          {chatHistory.length === 0 && (
            <div className="date-divider">
              Start of your journey with {partner?.name || "User"}
            </div>
          )}
          {chatHistory.map((msg) => (
            <div
              key={msg.messageId || msg.id || msg.timestamp}
              className={`msg-bubble-wrapper ${msg.senderName === myName ? 'sent' : 'received'}`}
            >
              <div className="msg-bubble">
                {msg.isInvite ? (
                  <p>
                    🚀 {msg.senderName} started a session!{' '}
                    <span
                      onClick={() => navigate('/workspace', { state: { partner: partner } })}
                      style={{
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        fontWeight: '700',
                        color: msg.sender === myName ? '#fff' : '#6366f1'
                      }}
                    >
                      Click to Join ➜
                    </span>
                  </p>
                ) : (
                  <p>{msg.text}</p>
                )}
                <span className="msg-time">{msg.time}</span>
              </div>
            </div>
          ))}
        </div>

        <footer className="chat-input-container">
          <form className="chat-form" onSubmit={handleSend}>
            <input
              type="text"
              placeholder={`Message ${partner?.name || "User"}...`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button type="submit" className="send-action-btn">Send</button>
          </form>
        </footer>
      </main>
    </div>
  );
};

export default Chatbox;