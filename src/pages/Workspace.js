import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { putItem, getItem, scanItems } from '../awsConfig';
import { getCanonicalId } from '../utils/idUtils';
import './Workspace.css';

const Workspace = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);

  const partner = location.state?.partner || {};
  const partnerName = partner.name || "Partner";
  const partnerId = getCanonicalId(partner);
  const myData = JSON.parse(sessionStorage.getItem('currentUser')) || {};
  const myName = myData.name || "User";
  const myId = getCanonicalId(myData);
  const sessionId = String(location.state?.sessionId || `sess_${Date.now()}`);

  const participants = [myId, partnerId].sort();
  const roomName = `TradeSkill-${participants[0]}-${participants[1]}`.replace(/\s/g, '');
  const sessionLink = `https://meet.jit.si/${roomName}`;

  const copySessionLink = () => {
    navigator.clipboard.writeText(sessionLink);
    alert(`Session link copied! Share with ${partnerName} to join.`);
  };

  const [role, setRole] = useState('teaching');
  const [teachingTime, setTeachingTime] = useState(0);
  const [learningTime, setLearningTime] = useState(0);
  const [sessionNotes, setSessionNotes] = useState('');
  const [rating, setRating] = useState(0);
  const [callEnded, setCallEnded] = useState(false);

  const [uploadedFiles, setUploadedFiles] = useState([
    { name: "Session_Agenda.pdf", url: "#" }
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      role === 'teaching'
        ? setTeachingTime(t => t + 1)
        : setLearningTime(t => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [role]);

  // Load session record if available
  useEffect(() => {
    const loadSession = async () => {
      try {
        const sess = await getItem('VideoSessions', { sessionId });
        if (sess) {
          setSessionNotes(sess.notes || '');
          if (Array.isArray(sess.uploadedFiles)) setUploadedFiles(sess.uploadedFiles);
          if (sess.finalRole) setRole(sess.finalRole);
        }
      } catch (err) {
        console.error('Failed to load session record:', err);
      }
    };
    loadSession();
  }, [sessionId]);

  // Save session helper
  const saveSessionRecord = async (overrides = {}) => {
    try {
      const record = {
        sessionId,
        chatId: `chat_${[myId, partnerId].sort().join('_')}`,
        roomName,
        sessionLink,
        hostUserId: myId,
        partnerUserId: partnerId,
        status: 'active',
        notes: sessionNotes,
        uploadedFiles: uploadedFiles.map(f => ({ name: f.name, url: f.url })),
        finalRole: role,
        teachingMinutes: Math.floor(teachingTime / 60),
        learningMinutes: Math.floor(learningTime / 60),
        updatedAt: Date.now(),
        ...overrides
      };
      await putItem('VideoSessions', record);
    } catch (error) {
      console.error('Failed to save session record:', error);
    }
  };

  const format = (s) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFiles([...uploadedFiles, {
        name: file.name,
        url: URL.createObjectURL(file)
      }]);
      alert(`${file.name} uploaded to session vault!`);
    }
  };

  // Persist files when uploaded
  useEffect(() => {
    if (uploadedFiles && uploadedFiles.length > 0) {
      saveSessionRecord();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedFiles]);

  // Persist notes when they change
  useEffect(() => {
    const t = setTimeout(() => {
      if (sessionNotes !== undefined) saveSessionRecord();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionNotes]);

  const handleEndSession = async () => {
  const currentUser =
    JSON.parse(sessionStorage.getItem("currentUser")) || {};

  if (rating === 0) {
    alert("Please rate your partner before ending session.");
    return;
  }

  try {
    // End session record
    await saveSessionRecord({
      status: "ended",
      endedAt: Date.now(),
      finalRole: role
    });

    // Save rating history
    await putItem("Ratings", {
      ratingId: `rating_${Date.now()}`,
      sessionId,
      raterUserId: currentUser.userId,
      raterEmail: currentUser.email,
      ratedUserId: partner.userId,
      ratedUserEmail: partner.email,
      ratedUserName: partnerName,
      rating,
      createdAt: new Date().toISOString(),
      timestamp: Date.now()
    });

    // Load all users
    const allUsers = await scanItems("Users");

    const me = allUsers.find(
      u =>
        String(u.userId) === String(currentUser.userId) ||
        String(u.email).toLowerCase() ===
          String(currentUser.email).toLowerCase()
    );

    const partnerUser = allUsers.find(
      u =>
        String(u.userId) === String(partner.userId) ||
        String(u.email).toLowerCase() ===
          String(partner.email).toLowerCase()
    );

    // -----------------------------
    // UPDATE PARTNER REPUTATION
    // -----------------------------
    if (partnerUser) {
      const oldCount = Number(partnerUser.ratingCount || 0);
      const oldAverage = Number(partnerUser.ratingAverage || 0);

      const newCount = oldCount + 1;

      const newAverage =
        ((oldAverage * oldCount) + rating) /
        newCount;

      const reputationPercentage =
        Math.round((newAverage / 5) * 100);

      await putItem("Users", {
        ...partnerUser,
        ratingAverage: Number(newAverage.toFixed(2)),
        ratingCount: newCount,
        reputation: reputationPercentage,
        swaps: Number(partnerUser.swaps || 0) + 1,
        updatedAt: Date.now()
      });
    }

    // -----------------------------
    // UPDATE CURRENT USER SWAPS
    // -----------------------------
    if (me) {
      const updatedMe = {
        ...me,
        swaps: Number(me.swaps || 0) + 1,
        updatedAt: Date.now()
      };

      await putItem("Users", updatedMe);

      sessionStorage.setItem(
        "currentUser",
        JSON.stringify(updatedMe)
      );
    }

    alert(
      `Session completed!\n\nYou rated ${partnerName} ${rating} stars.`
    );

    navigate("/profile");

  } catch (error) {
    console.error(error);
    alert("Failed to complete session.");
  }
};

  return (
    <div className="workspace-wrapper">

      {/* LEFT: VIDEO SECTION */}
      <section className="presence-column">
        <div className="video-viewport">
          <div className="zoom-mount">

           
            {/* Video or Call Ended Screen */}
            {callEnded ? (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#111',
                borderRadius: '12px',
                gap: '16px',
                padding: '30px',
                minHeight: '300px'
              }}>
                <div style={{ fontSize: '60px' }}>✅</div>
                <h2 style={{ color: '#fff', margin: 0 }}>Call Ended</h2>
                <p style={{ color: '#666', margin: 0, textAlign: 'center' }}>
                  Rate {partnerName}'s session on the right and click End Session
                </p>
                <button
                  onClick={() => setCallEnded(false)}
                  style={{
                    background: '#6366f1',
                    color: 'white',
                    border: 'none',
                    padding: '10px 28px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: '14px'
                  }}
                >
                  🔄 Rejoin Call
                </button>
              </div>
            ) : (
              <iframe
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                src={`https://meet.jit.si/${roomName}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.disableDeepLinking=true&config.enableWelcomePage=false&userInfo.displayName=${myName}`}
                style={{
                  flex: 1,
                  width: '100%',
                  border: '0',
                  borderRadius: '12px',
                  minHeight: '300px'
                }}
                title="Video Call"
              />
            )}

          </div>
        </div>

        {/* Timer Dashboard */}
        <div className="timer-dashboard">
          <div className={`time-card ${role === 'teaching' ? 'active-t' : ''}`}>
            <span className="label">Teaching</span>
            <span className="value">{format(teachingTime)}</span>
          </div>
          <button
            className="p-btn accent swap-main-btn"
            onClick={() => {
              const next = role === 'teaching' ? 'learning' : 'teaching';
              setRole(next);
              // record role change in session
              saveSessionRecord({
                roleHistory: (uploadedFiles && Array.isArray(uploadedFiles)) ? undefined : undefined
              });
            }}
          >
            Swap Role ⇌
          </button>
          <div className={`time-card ${role === 'learning' ? 'active-l' : ''}`}>
            <span className="label">Learning</span>
            <span className="value">{format(learningTime)}</span>
          </div>
        </div>
      </section>

      {/* RIGHT: ACTION PANEL */}
      <aside className="action-column">
        <div className="action-scroll">

          <div className="widget-card">
            <label className="widget-label">Session Notes</label>
            <textarea
              className="notes-box"
              placeholder="Write shared concepts here..."
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
            />
          </div>

          <div className="widget-card">
            <label className="widget-label">Resource Vault</label>
            <div className="vault-list">
              {uploadedFiles.map((f, i) => (
                <div key={i} className="vault-item">📄 {f.name}</div>
              ))}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <button
                className="add-vault-btn"
                onClick={() => fileInputRef.current.click()}
              >
                + Upload New
              </button>
            </div>
          </div>

          <div className="widget-card rating-card">
            <label className="widget-label">
              Rate {partnerName}'s performance
            </label>
            <div className="star-group">
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  className={`star ${rating >= s ? 'filled' : ''}`}
                  onClick={() => setRating(s)}
                >★</span>
              ))}
            </div>
          </div>

        </div>

        {/* Footer with Copy Link + End Session */}
        <footer className="action-footer">
          <button
            onClick={copySessionLink}
            style={{
              width: '100%',
              background: 'transparent',
              color: '#6366f1',
              border: '1px solid #6366f1',
              padding: '12px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: '700',
              fontSize: '13px',
              marginBottom: '10px'
            }}
          >
            📋 Copy Session Link for {partnerName}
          </button>
          <button className="btn-finish" onClick={handleEndSession}>
            End Session & Sync Stats
          </button>
           {/* End Call Button only on top */}
            <div style={{ marginTop: '10px' }}>
              <button
                onClick={() => setCallEnded(true)}
                style={{
                  width: '100%',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '13px'
                }}
              >
                📵 End Call
              </button>
            </div>

        </footer>
      </aside>

    </div>
  );
};

export default Workspace;