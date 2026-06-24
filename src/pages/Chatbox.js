import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Chatbox.css';

const Chatbox = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const scrollRef = useRef(null);

  const partner = location.state?.partner;
  const myData = JSON.parse(sessionStorage.getItem('currentUser')) || { name: "Guest" };
  const myName = myData.name;
  const myId = myData.id || myName;
  const partnerId = partner?.id || partner?.email || partner?.name || 'unknown';

  const participants = [myId, partnerId].map(String).sort();
  const chatKey = `chat_${participants[0]}_${participants[1]}`.replace(/\s/g, '');
  const roomName = `TradeSkill-${participants[0]}-${participants[1]}`.replace(/\s/g, '');
  const sessionLink = `https://meet.jit.si/${roomName}`;

  useEffect(() => {
    if (!myData?.email || !partner?.name) {
      navigate('/home', { replace: true });
    }
  }, [myData, partner, navigate]);

  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState(() => {
    const saved = localStorage.getItem(chatKey);
    return saved ? JSON.parse(saved) : [];
  });

  // Poll every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const saved = localStorage.getItem(chatKey);
      if (saved) setChatHistory(JSON.parse(saved));
    }, 2000);
    return () => clearInterval(interval);
  }, [chatKey]);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === chatKey) {
        setChatHistory(e.newValue ? JSON.parse(e.newValue) : []);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [chatKey]);

  // Mark as read
  useEffect(() => {
    const inboxHeads = JSON.parse(localStorage.getItem('inbox_heads')) || {};
    if (inboxHeads[chatKey] && inboxHeads[chatKey].receiverName === myName) {
      inboxHeads[chatKey].unread = false;
      localStorage.setItem('inbox_heads', JSON.stringify(inboxHeads));
    }
  }, [chatKey, myName]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const newMessage = {
      id: Date.now(),
      sender: myName,
      text: message,
      time: new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      isInvite: false
    };

    const currentSaved = JSON.parse(localStorage.getItem(chatKey)) || [];
    const updatedHistory = [...currentSaved, newMessage];
    setChatHistory(updatedHistory);
    localStorage.setItem(chatKey, JSON.stringify(updatedHistory));

    // Save inbox — store PARTNER's data so receiver can navigate back correctly
    const inboxHeads = JSON.parse(localStorage.getItem('inbox_heads')) || {};
    inboxHeads[chatKey] = {
      lastMessage: message,
      senderId: myId,
      receiverId: partnerId,
      senderName: myName,
      receiverName: partner.name,
      time: new Date().getTime(),
      unread: true,
      // Store sender info so receiver knows who to chat with
      senderData: {
        id: myId,
        name: myName,
        email: myData.email,
        teach: myData.skillsToTeach?.[0] || "Skills",
        learn: myData.skillsToLearn?.[0] || "Knowledge",
        skillsToTeach: myData.skillsToTeach,
        skillsToLearn: myData.skillsToLearn
      }
    };
    localStorage.setItem('inbox_heads', JSON.stringify(inboxHeads));
    setMessage("");
  };

  const handleEnterSession = () => {
    const inviteMessage = {
      id: Date.now(),
      sender: myName,
      text: `🚀 ${myName} started a session! Click to Join.`,
      time: new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      isInvite: true,
      sessionLink: sessionLink
    };

    const currentSaved = JSON.parse(localStorage.getItem(chatKey)) || [];
    const updated = [...currentSaved, inviteMessage];
    localStorage.setItem(chatKey, JSON.stringify(updated));
    setChatHistory(updated);

    const inboxHeads = JSON.parse(localStorage.getItem('inbox_heads')) || {};
    inboxHeads[chatKey] = {
      lastMessage: `🚀 ${myName} started a session!`,
      senderId: myId,
      receiverId: partnerId,
      senderName: myName,
      receiverName: partner.name,
      time: new Date().getTime(),
      unread: true,
      senderData: {
        id: myId,
        name: myName,
        email: myData.email,
        teach: myData.skillsToTeach?.[0] || "Skills",
        learn: myData.skillsToLearn?.[0] || "Knowledge",
        skillsToTeach: myData.skillsToTeach,
        skillsToLearn: myData.skillsToLearn
      }
    };
    localStorage.setItem('inbox_heads', JSON.stringify(inboxHeads));
    navigate('/workspace', { state: { partner: partner } });
  };

  return (
    <div className="chatbox-master">
      <nav className="chat-nav">
        <div className="nav-top" onClick={() => navigate('/home')}>
          <div className="back-icon">✕</div>
        </div>
        <div className="active-swaps">
          <div className="swap-thumb active">{partner.name.charAt(0)}</div>
        </div>
      </nav>

      <main className="chat-main">
        <header className="chat-info-bar">
          <div className="partner-profile">
            <div className="avatar-med">{partner.name.charAt(0)}</div>
            <div className="partner-details">
              <h3>{partner.name}</h3>
              <p>
                Teaching{' '}
                <span>{partner.teach || partner.skillsToTeach?.[0] || "Skills"}</span>
                {' '}for{' '}
                <span>{partner.learn || partner.skillsToLearn?.[0] || "Knowledge"}</span>
              </p>
            </div>
          </div>
          <div className="header-tools">
            <button className="start-workspace-btn" onClick={handleEnterSession}>
              Enter Session 🚀
            </button>
          </div>
        </header>

        <div className="chat-feed" ref={scrollRef}>
          {chatHistory.length === 0 && (
            <div className="date-divider">
              Start of your journey with {partner.name}
            </div>
          )}
          {chatHistory.map((msg) => (
            <div
              key={msg.id}
              className={`msg-bubble-wrapper ${msg.sender === myName ? 'sent' : 'received'}`}
            >
              <div className="msg-bubble">
                {msg.isInvite ? (
                  <p>
                    🚀 {msg.sender} started a session!{' '}
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
              placeholder={`Message ${partner.name}...`}
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