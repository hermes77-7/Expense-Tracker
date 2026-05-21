import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { registerUser } from "../services/authService";
import { useAuth } from "../hooks/useAuth";

import "../styles/auth.css";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      const data = await registerUser({
        name,
        email,
        password,
      });

      login(data.token, data.user);
      navigate("/dashboard");
    } catch {
      setError("Registration failed. Try another email.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="logo-area">
          <h1>
            <i className="fas fa-piggy-bank" /> FinBalance
          </h1>
          <p>Track · Save · Achieve</p>
        </div>

        <div className="auth-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full name</label>
              <div className="input-icon">
                <i className="fas fa-user" />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Alex Johnson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email address</label>
              <div className="input-icon">
                <i className="fas fa-envelope" />
                <input
                  type="email"
                  className="form-control"
                  placeholder="hello@finbalance.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-icon">
                <i className="fas fa-lock" />
                <input
                  type="password"
                  className="form-control"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Confirm password</label>
              <div className="input-icon">
                <i className="fas fa-check-circle" />
                <input
                  type="password"
                  className="form-control"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btnA">
              Create account
            </button>

            {error && <p className="error-note">{error}</p>}

            <p className="password-hint">
              Password should be at least 6 characters.
            </p>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>

          <div className="demo-note">
            <i className="fas fa-shield-alt" /> Your account will be created and
            used for your saved data.
          </div>
        </div>
      </div>
    </div>
  );
}
