import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-wrapper">
      <nav className="landing-nav">
        <h1 className="landing-logo">TradeSkill</h1>
        <div>
          <button className="btn-outline" onClick={() => navigate('/login')}>Login</button>
          <button className="btn-primary" onClick={() => navigate('/login')}>Get Started Free</button>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-badge">🚀 The Future of Learning is Free</div>
        <h1 className="hero-title">
          Teach What You Know.<br />
          Learn What You Want.<br />
          <span className="highlight">For Free.</span>
        </h1>
        <p className="hero-sub">
          TradeSkill matches you with someone who wants to learn what you know —
          and teaches what you want to learn. No money. Just skills.
        </p>
        <button className="btn-hero" onClick={() => navigate('/login')}>
          Start Trading Skills →
        </button>
      </section>

      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-num">1</div>
            <h3>Add Your Skills</h3>
            <p>Tell us what you can teach and what you want to learn</p>
          </div>
          <div className="step-card">
            <div className="step-num">2</div>
            <h3>Get Matched</h3>
            <p>Our algorithm finds your perfect skill exchange partner</p>
          </div>
          <div className="step-card">
            <div className="step-num">3</div>
            <h3>Start Learning</h3>
            <p>Chat, video call, and teach each other. Both grow together.</p>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="stat-box">
          <h2>Free</h2>
          <p>Always and forever</p>
        </div>
        <div className="stat-box">
          <h2>2-Way</h2>
          <p>Both teach and learn</p>
        </div>
        <div className="stat-box">
          <h2>Live</h2>
          <p>Real time video sessions</p>
        </div>
        <div className="stat-box">
          <h2>Rated</h2>
          <p>Quality guaranteed</p>
        </div>
      </section>

      <section className="cta-section">
        <h2>Ready to start learning for free?</h2>
        <button className="btn-hero" onClick={() => navigate('/login')}>
          Join TradeSkill Today →
        </button>
      </section>

      <footer className="landing-footer">
        <p>Built with ❤️ for learners everywhere · Powered by AWS DynamoDB + Vercel</p>
      </footer>
    </div>
  );
};

export default Landing;