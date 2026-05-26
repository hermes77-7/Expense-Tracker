import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { loginUser } from "../services/authService";
import { useAuth } from "../hooks/useAuth";

import "../styles/auth.css";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      const data = await loginUser({
        email,
        password,
      });

      login(data.token, data.user);
      navigate("/dashboard");
    } catch {
      setError("Invalid email or password");
    }
  };

  const handleForgotPassword = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    alert("Password reset is not implemented yet.");
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <a
                href="/"
                className="forgot-link"
                onClick={handleForgotPassword}
              >
                Forgot password?
              </a>
            </div>

            <button type="submit" className="btnA">
              Sign in
            </button>

            {error && <p className="error-note">{error}</p>}
          </form>

          <div className="auth-footer">
            Don’t have an account? <Link to="/register">Create account</Link>
          </div>

          <div className="demo-note">
            <i className="fas fa-info-circle" /> Use your registered account to
            sign in.
          </div>
        </div>
      </div>
    </div>
  );
}
