import { useAuth } from "../hooks/useAuth";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav>
      <h2>Expense Tracker</h2>

      <div>
        <span>{user?.name}</span>

        <button onClick={logout}>Logout</button>
      </div>
    </nav>
  );
}
