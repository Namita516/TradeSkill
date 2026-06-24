import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Workspace.css';

const Workspace = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);

  const partner = location.state?.partner || {};
  const partnerName = partner.name || "Partner";
  const partnerId = partner.id || partner.email || partnerName;
  const myData = JSON.parse(sessionStorage.getItem('currentUser')) || {};
  const myName = myData.name || "User";
  const myId = myData.id || myName;

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

  const handleEndSession = () => {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || {};
    const allUsers = JSON.parse(localStorage.getItem('allUsers')) || [];

    const updatedMyData = {
      ...currentUser,
      swaps: (currentUser.swaps || 0) + 1,
    };

    const updatedGlobalUsers = allUsers.map(user => {
      if (user.email === currentUser.email || user.id === currentUser.id) {
        return updatedMyData;
      }
      if (user.id === partnerId || user.email === partnerId) {
        const oldRep = user.reputation || 0;
        const newRepValue = oldRep === 0
          ? rating
          : (parseFloat(oldRep) + rating) / 2;
        return {
          ...user,
          reputation: parseFloat(newRepValue.toFixed(1)),
          swaps: (user.swaps || 0) + 1
        };
      }
      return user;
    });

    localStorage.setItem('allUsers', JSON.stringify(updatedGlobalUsers));
    sessionStorage.setItem('currentUser', JSON.stringify(updatedMyData));

    alert(`Session ended! You gave ${partnerName} a ${rating} star rating.`);
    navigate('/profile');
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
            onClick={() => setRole(role === 'teaching' ? 'learning' : 'teaching')}
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