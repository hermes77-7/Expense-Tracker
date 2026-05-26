import { Link } from "react-router-dom";
import "../styles/welcome.css";

export default function WelcomePage() {
  return (
    <div className="welcome-page">

      {/* NAV */}
      <nav className="welcome-nav">
        <div className="welcome-nav-logo">
          <i className="fas fa-piggy-bank" />
          FinBalance
        </div>
        <div className="welcome-nav-links">
          <Link to="/login" className="btn-welcome-outline">Sign in</Link>
          <Link to="/register" className="btn-welcome-primary">Get started</Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="welcome-hero">
        <div className="welcome-badge">Personal Finance Tracker</div>

        <h1>
          Take control of your <span>money</span>
        </h1>

        <p>
          Track income and expenses, set savings goals, and get a clear
          picture of your finances � all in one simple place.
        </p>

        <div className="welcome-actions">
          <Link to="/register" className="btn-welcome-primary">
            Create free account
          </Link>
          <Link to="/login" className="btn-welcome-outline">
            Sign in
          </Link>
        </div>
      </section>

      {/* FEATURES */}
      <section className="welcome-features">
        <div className="feature-card">
          <div className="feature-icon">??</div>
          <h3>Track Transactions</h3>
          <p>Log income and expenses with categories and descriptions.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">??</div>
          <h3>Savings Goals</h3>
          <p>Set targets and track your progress toward every goal.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">??</div>
          <h3>Live Dashboard</h3>
          <p>See your balance, income and expenses update in real time.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">??</div>
          <h3>Secure & Private</h3>
          <p>Your data is protected with encrypted passwords and JWT auth.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="welcome-footer">
        � 2026 FinBalance � Built with React & Node.js
      </footer>

    </div>
  );
}