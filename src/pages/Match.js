import React, { useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Match.css';

const Match = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedPartner = location.state?.partner;

  const myData = JSON.parse(sessionStorage.getItem('currentUser')) || {
      skillsToTeach: [],
      skillsToLearn: []
  };

  useEffect(() => {
    if (!selectedPartner) {
      navigate('/home', { replace: true });
    }
  }, [selectedPartner, navigate]);

  // --- THE DYNAMIC MATCH ALGORITHM ---
  const matchDetails = useMemo(() => {
    if (!selectedPartner) return { score: 0, reasons: ["No partner selected"] };

    let score = 20; // Base score for being in the same community
    let reasons = [];

    // 1. Does Partner teach what I want?
    const partnerTeachesWhatIWant = myData.skillsToLearn?.some(skill =>
      selectedPartner.teach?.toLowerCase().includes(skill.toLowerCase())
    );

    // 2. Do I teach what Partner wants?
    const iTeachWhatPartnerWants = (myData.skillsToTeach || []).some(skill =>
      selectedPartner.learn?.toLowerCase().includes(skill.toLowerCase())
    );

    if (partnerTeachesWhatIWant && iTeachWhatPartnerWants) {
      score = 98;
      reasons = ["Perfect Mutual Match", "High Compatibility", "Dual Exchange"];
    } else if (partnerTeachesWhatIWant) {
      score = 65;
      reasons = ["They have what you need", "One-way Match"];
    } else if (iTeachWhatPartnerWants) {
      score = 45;
      reasons = ["You have what they need", "Potential Mentorship"];
    } else {
      score = 10; // Reduced to 10 to demonstrate the "Disabled" state
      reasons = ["Low Skill Overlap", "Explore other partners"];
    }

    return { score, reasons };
  }, [selectedPartner, myData.skillsToLearn, myData.skillsToTeach]);

  // Fallback for UI display
  const partner = selectedPartner || { name: "Guest", teach: "N/A", learn: "N/A", bio: "" };

  return (
    <div className="match-wrapper">
      <div className="agreement-card">
        <header className="agreement-header">
          <span className="badge">Trade Compatibility Analysis</span>
          <h1>{matchDetails.score >= 98 ? "It's a Match!" : "Trade Review"}</h1>
        </header>

        <div className="comparison-table">
          {/* User Side */}
          <div className="user-column">
            <div className="user-info">
              <div className="avatar">{myData.name?.charAt(0) || "Y"}</div>
              <h3>You</h3>
            </div>
            <div className="expertise-tag">Teaches: {myData.skillsToTeach?.[0] || "None"}</div>
            <div className="goal-box">
              <small>YOUR GOAL</small>
              <p>Learn {myData.skillsToLearn?.[0] || "Anything"}</p>
            </div>
          </div>

          <div className="trade-divider">
            <div className="line"></div>
            <div className="swap-icon">⇄</div>
            <div className="line"></div>
          </div>

          {/* Partner Side */}
          <div className="user-column">
            <div className="user-info">
              <div className="avatar partner-av">{partner.name?.charAt(0)}</div>
              <h3>{partner.name}</h3>
            </div>
            <div className="expertise-tag">Teaches: {partner.teach}</div>
            <div className="goal-box">
              <small>{partner.name.toUpperCase()}'S GOAL</small>
              <p>Learn {partner.learn}</p>
            </div>
          </div>
        </div>

        {/* Dynamic Match Score UI */}
        <div className="match-score-container" style={{
          borderColor: matchDetails.score >= 98 ? '#10b981' : '#e0d7ff',
          background: matchDetails.score >= 98 ? '#f0fff4' : '#fcfaff'
        }}>
          <div className="score-circle">
            <svg viewBox="0 0 36 36" className="circular-chart">
              <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path
                className="circle"
                strokeDasharray={`${matchDetails.score}, 100`}
                stroke={matchDetails.score >= 98 ? "#10b981" : "#6366f1"}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <text x="18" y="20.35" className="percentage">{matchDetails.score}%</text>
            </svg>
          </div>
          <div className="score-info">
            <h4>Compatibility Score</h4>
            <div className="reason-tags">
              {matchDetails.reasons.map(reason => (
                <span key={reason} className="reason-pill">✦ {reason}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="agreement-actions">
          <button className="reject-btn" onClick={() => navigate('/home')}>Go Back</button>
          
          {/* LOGIC: Disable if < 15, Only "Start Exchange" if >= 98 */}
          <button
            className={`accept-btn ${matchDetails.score < 15 ? 'disabled-style' : ''}`}
            onClick={() => navigate('/chat', { state: { partner: partner } })}
            disabled={matchDetails.score < 15}
            style={{
              cursor: matchDetails.score < 15 ? 'not-allowed' : 'pointer',
              opacity: matchDetails.score < 15 ? 0.5 : 1,
              backgroundColor: matchDetails.score < 15 ? '#cbd5e1' : (matchDetails.score >= 98 ? '#10b981' : '#6366f1')
            }}
          >
            {matchDetails.score >= 98 ? "Start Exchange" : 
             matchDetails.score < 15 ? "Chat Disabled" : "Message Anyway"}
          </button>
        </div>

        {matchDetails.score < 15 && (
          <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '10px', textAlign: 'center' }}>
            Match score too low to initiate contact.
          </p>
        )}
      </div>
    </div>
  );
};

export default Match;