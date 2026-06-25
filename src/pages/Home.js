import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { scanItems } from '../awsConfig';
import { getCanonicalId } from '../utils/idUtils';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [partners, setPartners] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        
        // Query Users table from DynamoDB
        const allUsers = await scanItems('Users');
        
        // Filter out current user and map to partner format
        const otherUsers = allUsers.filter(u => u.email !== currentUser?.email && u.userId !== currentUser?.userId);
        const mappedPartners = otherUsers.map(u => ({
          id: getCanonicalId(u),
          userId: u.userId,
          email: u.email,
          name: u.name,
          rating: u.ratingAverage ?? u.reputation ?? "New",
          ratingCount: u.ratingCount ?? u.swaps ?? 0,
          swaps: u.swaps ?? u.ratingCount ?? 0,
          teach: u.skillsToTeach?.length > 0 ? u.skillsToTeach.join(", ") : "Skills coming soon",
          learn: u.skillsToLearn?.length > 0 ? u.skillsToLearn.join(", ") : "Knowledge seeker",
          bio: u.bio,
          isNew: true
        }));

        // Demo cards as fallback
        const demoCards = [
          { id: 1, name: "Sarah Chen", rating: 4.9, teach: "Digital Illustration", learn: "React JS", bio: "Pro artist looking to dive into web dev." },
          { id: 2, name: "Marcus Vane", rating: 4.7, teach: "French", learn: "Cooking", bio: "Native speaker. Want to learn Italian pasta secrets." }
        ];

        setPartners([...mappedPartners, ...demoCards]);
      } catch (error) {
        console.error('Failed to load users:', error);
        // Fallback to demo cards on error
        const demoCards = [
          { id: 1, name: "Sarah Chen", rating: 4.9, teach: "Digital Illustration", learn: "React JS", bio: "Pro artist looking to dive into web dev." },
          { id: 2, name: "Marcus Vane", rating: 4.7, teach: "French", learn: "Cooking", bio: "Native speaker. Want to learn Italian pasta secrets." }
        ];
        setPartners(demoCards);
      }
    };

    loadUsers();
  }, []);

  const filteredPartners = partners.filter(partner =>
    partner.teach.toLowerCase().includes(searchQuery.toLowerCase()) ||
    partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    partner.learn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="home-container">
      <nav className="home-nav">
        <h1 className="logo">TradeSkill</h1>

        <div className="nav-actions">
          {/* --- NOTIFICATION BELL REMOVED FROM HERE --- */}

          <button className="nav-link" onClick={() => navigate('/profile')}>My Profile</button>
          <button className="logout-btn-small" onClick={() => {
            sessionStorage.removeItem('currentUser');
            navigate('/login');
          }}>Logout</button>
        </div>
      </nav>

      <header className="hero">
        <h2>Find your perfect skill match</h2>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by skill or name..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="search-btn">Search</button>
        </div>
      </header>

      <main className="feed">
        <div className="feed-header">
          <h3>Potential Matches</h3>
        </div>

        <div className="partner-grid">
          {filteredPartners.map(partner => (
            <div key={partner.id} className="partner-card">
              <div className="partner-info">
                <div className="avatar-sm">{partner.name.charAt(0).toUpperCase()}</div>
                <div>
                  <h4>{partner.name}</h4>
                  <div className="partner-meta">
                    <span className="rating">⭐ {typeof partner.rating === 'number' ? partner.rating.toFixed(1) : partner.rating}</span>
                    {partner.swaps !== undefined && (
                      <span className="swap-count">· {partner.swaps} swaps</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="trade-tags">
                <div className="tag-group">
                  <small>TEACHES:</small>
                  <span className="tag teach-tag">{partner.teach}</span>
                </div>
              </div>
              <p className="partner-bio">{partner.bio}</p>
              <button
                className="propose-btn"
                onClick={() => navigate('/match', { state: { partner: partner } })}
              >
                Propose Trade
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Home;