import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    const saved = sessionStorage.getItem('currentUser');
    const parsed = saved ? JSON.parse(saved) : null;
    return {
      name: parsed?.name || "User",
      level: parsed?.level || "New Member",
      bio: parsed?.bio || "Tell us about yourself!",
      skillsToTeach: parsed?.skillsToTeach || [],
      skillsToLearn: parsed?.skillsToLearn || [],
      reputation: parsed?.reputation || 0,
      swaps: parsed?.swaps || 0,
      email: parsed?.email || ""
    };
  });

  const [inbox, setInbox] = useState([]);

  // EFFECT 1: Pull fresh data
  useEffect(() => {
    const sessionUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const allUsers = JSON.parse(localStorage.getItem('allUsers')) || [];
    const freshData = allUsers.find(u => u.email === sessionUser?.email);
    if (freshData) {
      setUser({
        ...freshData,
        reputation: freshData.reputation || 0,
        swaps: freshData.swaps || 0
      });
      sessionStorage.setItem('currentUser', JSON.stringify(freshData));
    }
  }, []);

  // EFFECT 2: Fetch Inbox
  useEffect(() => {
    const fetchInbox = () => {
      const allInbox = JSON.parse(localStorage.getItem('inbox_heads')) || {};
      const myName = user.name;

      const myChats = Object.entries(allInbox)
        .filter(([id, data]) => data.senderName === myName || data.receiverName === myName)
        .map(([id, data]) => ({
          id,
          partnerName: data.senderName === myName ? data.receiverName : data.senderName,
          lastMsg: data.lastMessage,
          isUnread: data.unread && data.receiverName === myName,
          senderData: data.senderData,
          time: data.time
        }))
        .sort((a, b) => b.time - a.time);

      setInbox(myChats);
    };

    fetchInbox();
    window.addEventListener('storage', fetchInbox);
    return () => window.removeEventListener('storage', fetchInbox);
  }, [user.name]);

  const [modalType, setModalType] = useState(null);
  const [tempData, setTempData] = useState({});
  const [newItem, setNewItem] = useState("");

  const syncUserUpdates = (updatedUser) => {
    setUser(updatedUser);
    sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
    const allUsers = JSON.parse(localStorage.getItem('allUsers')) || [];
    const userIndex = allUsers.findIndex(u => u.email === updatedUser.email);
    if (userIndex > -1) {
      allUsers[userIndex] = updatedUser;
      localStorage.setItem('allUsers', JSON.stringify(allUsers));
    }
  };

  const openProfileEdit = () => {
    setTempData({ name: user.name, bio: user.bio, level: user.level });
    setModalType('profile');
  };

  const openAddModal = (type) => {
    setNewItem("");
    setModalType(type);
  };

  const handleSaveProfile = () => {
    const updatedUser = { ...user, ...tempData };
    syncUserUpdates(updatedUser);
    setModalType(null);
  };

  const handleAddItem = () => {
    if (!newItem) return;
    let updatedUser;
    if (modalType === 'skill') {
      updatedUser = { ...user, skillsToTeach: [...(user.skillsToTeach || []), newItem] };
    } else {
      updatedUser = { ...user, skillsToLearn: [...(user.skillsToLearn || []), newItem] };
    }
    syncUserUpdates(updatedUser);
    setModalType(null);
  };

  return (
    <div className="dashboard-container">
      {modalType && (
        <div className="modal-overlay">
          <div className="modal-content">
            {modalType === 'profile' ? (
              <>
                <h3>Edit Profile</h3>
                <input
                  type="text"
                  placeholder="Name"
                  value={tempData.name}
                  onChange={e => setTempData({...tempData, name: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Designation"
                  value={tempData.level}
                  onChange={e => setTempData({...tempData, level: e.target.value})}
                />
                <textarea
                  placeholder="Bio"
                  value={tempData.bio}
                  onChange={e => setTempData({...tempData, bio: e.target.value})}
                />
                <div className="modal-btns">
                  <button className="save-btn" onClick={handleSaveProfile}>Save Changes</button>
                  <button className="cancel-btn" onClick={() => setModalType(null)}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <h3>Add {modalType === 'skill' ? 'Teaching Skill' : 'Learning Request'}</h3>
                <input
                  type="text"
                  placeholder="e.g. React..."
                  value={newItem}
                  onChange={e => setNewItem(e.target.value)}
                  autoFocus
                />
                <div className="modal-btns">
                  <button className="save-btn" onClick={handleAddItem}>Add Item</button>
                  <button className="cancel-btn" onClick={() => setModalType(null)}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <aside className="profile-sidebar">
        <div className="profile-image">
          {user.name ? user.name.charAt(0).toUpperCase() : "U"}
        </div>
        <button className="edit-profile-btn" onClick={openProfileEdit}>Edit Profile</button>
        <h2 className="user-name">{user.name}</h2>
        <span className="user-badge">{user.level}</span>
        <button className="search-nav-btn" onClick={() => navigate('/home')}>
          🔍 Search Skills
        </button>

        <div className="user-stats">
          <div className="stat-item">
            <p className="stat-num">{Math.round((user.reputation || 0) * 20)}%</p>
            <p className="stat-label">Reputation</p>
          </div>
          <div className="stat-item">
            <p className="stat-num">{user.swaps}</p>
            <p className="stat-label">Swaps</p>
          </div>
        </div>

        <p className="user-bio">{user.bio}</p>

        <button className="logout-btn" onClick={() => {
          sessionStorage.removeItem('currentUser');
          navigate('/login');
        }}>
          Logout
        </button>
      </aside>

      <main className="profile-main">
        <section className="trade-section">
          <h3 className="section-title">My Trade Desk</h3>
          <div className="trade-cards">
            <div className="trade-card offer-card">
              <div className="card-header">I AM TEACHING</div>
              <ul>
                {(user.skillsToTeach || []).length > 0
                  ? user.skillsToTeach.map((s, i) => (
                      <li key={i}><span>✔</span> {s}</li>
                    ))
                  : <li className="empty-msg">No skills added yet</li>
                }
              </ul>
              <button className="edit-mini" onClick={() => openAddModal('skill')}>
                + Add Skill
              </button>
            </div>
            <div className="trade-card seek-card">
              <div className="card-header">I WANT TO LEARN</div>
              <ul>
                {(user.skillsToLearn || []).length > 0
                  ? user.skillsToLearn.map((s, i) => (
                      <li key={i}><span>★</span> {s}</li>
                    ))
                  : <li className="empty-msg">No requests added yet</li>
                }
              </ul>
              <button className="edit-mini" onClick={() => openAddModal('request')}>
                + Add Request
              </button>
            </div>
          </div>
        </section>

        <section className="inbox-section">
          <h3 className="section-title">Active Conversations</h3>
          <div className="inbox-list">
            {inbox.length > 0 ? inbox.map((chat) => (
              <div
                key={chat.id}
                className={`inbox-card ${chat.isUnread ? 'has-reply' : ''}`}
                onClick={() => navigate('/chat', {
                  state: {
                    partner: {
                      name: chat.partnerName,
                      teach: chat.senderData?.teach || "Skills",
                      learn: chat.senderData?.learn || "Knowledge",
                      skillsToTeach: chat.senderData?.skillsToTeach || [],
                      skillsToLearn: chat.senderData?.skillsToLearn || []
                    }
                  }
                })}
              >
                <div className="inbox-avatar">{chat.partnerName.charAt(0)}</div>
                <div className="inbox-info">
                  <div className="inbox-row">
                    <strong>{chat.partnerName}</strong>
                    {chat.isUnread && (
                      <span className="replied-status-tag">Replied</span>
                    )}
                  </div>
                  <p className="last-msg-preview">
                    {chat.isUnread ? <b>{chat.lastMsg}</b> : chat.lastMsg}
                  </p>
                </div>
              </div>
            )) : (
              <p className="empty-msg">No messages yet.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Profile;