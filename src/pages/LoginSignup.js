import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginSignup.css';

const LoginSignup = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const hashText = async (text) => {
    if (!window.crypto?.subtle) return text;
    const encoded = new TextEncoder().encode(text);
    const buffer = await window.crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const generateId = () => window.crypto?.randomUUID?.() || `user_${Date.now()}`;

  // State for showing custom notifications
  const [msg, setMsg] = useState({ text: '', type: '' });
  const navigate = useNavigate();

  const showNotification = (text, type) => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Fetch the global "Database" list
    const allUsers = JSON.parse(localStorage.getItem('allUsers')) || [];
    const hashedPassword = await hashText(formData.password);

    if (!isLogin) {
      // --- SIGN UP LOGIC ---
      if (formData.password.length < 8) {
        showNotification("Password must be at least 8 characters!", "error");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        showNotification("Passwords do not match!", "error");
        return;
      }

      // 2. Check if email already exists in the list
      if (allUsers.some(u => u.email === formData.email)) {
        showNotification("Email already registered!", "error");
        return;
      }

      // 3. Create a full user object to store in the list
      const newUser = {
        id: generateId(),
        email: formData.email,
        password: hashedPassword,
        name: formData.email.split('@')[0], // Sets name to Sunil if email is sunil@mail.com
        level: "New Member",
        bio: "Skill swapper!",
        skillsToTeach: [],
        skillsToLearn: [],
        reputation: 0,
        swaps: 0
      };

      // 4. Save to the global list
      allUsers.push(newUser);
      localStorage.setItem('allUsers', JSON.stringify(allUsers));

      showNotification("Signup successful! Redirecting to login...", "success");

      // Redirect to login after 2 seconds
      setTimeout(() => {
        setIsLogin(true);
        setFormData({ email: '', password: '', confirmPassword: '' });
      }, 2000);

    } else {
      // --- LOGIN LOGIC ---
      // 5. Look for user in the global list
      const userAccount = allUsers.find(u =>
        u.email === formData.email && u.password === hashedPassword
      );

      if (userAccount) {
        if (!userAccount.id) {
          userAccount.id = generateId();
          const updatedUsers = allUsers.map(u => u.email === userAccount.email ? userAccount : u);
          localStorage.setItem('allUsers', JSON.stringify(updatedUsers));
        }

        // 6. Set the active session (Who is logged in right now?)
        sessionStorage.setItem('currentUser', JSON.stringify(userAccount));

        showNotification("Login successful! Welcome.", "success");
        setTimeout(() => navigate('/profile'), 1500);
      } else {
        showNotification("Incorrect email or password!", "error");
      }
    }
  };

  return (
    <div className="container">
      {/* Notification Popup */}
      {msg.text && (
        <div className={`notification-toast ${msg.type}`}>
          {msg.text}
        </div>
      )}

      <div className="form-box">
        <div className="header">
          <h1>{isLogin ? "Login" : "Sign Up"}</h1>
          <p>{isLogin ? "Welcome back! Please enter your details." : "Create an account to get started."}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-field">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="input-field">
            <input
              type="password"
              name="password"
              placeholder="Password (Min. 8 chars)"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>

          {!isLogin && (
            <div className="input-field">
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              />
            </div>
          )}

          <button type="submit" className="submit-btn">
            {isLogin ? "Sign In" : "Register"}
          </button>
        </form>

        <div className="footer">
          <span>{isLogin ? "Don't have an account?" : "Already have an account?"}</span>
          <button onClick={() => {
            setIsLogin(!isLogin);
            setMsg({ text: '', type: '' }); // Clear messages on toggle
          }} className="toggle-btn">
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginSignup;