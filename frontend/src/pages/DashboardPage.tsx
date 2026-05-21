import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import "../styles/dashboard.css";

const API = "http://localhost:8000";

type Transaction = {
  id: number;
  title: string;
  transactionType: "income" | "expense";
  category: string;
  description: string | null;
  amount: number;
  createdAt: string;
};

type Goal = {
  id: number;
  name: string;
  savedAmount: number;
  targetAmount: number;
  deadline: string | null;
  status: string;
};

type TransactionForm = {
  title: string;
  amount: string;
  transactionType: string;
  category: string;
  description: string;
};

type GoalForm = {
  name: string;
  targetAmount: string;
  deadline: string;
};

type ContributeState = {
  amount: string;
  note: string;
  open: boolean;
};

const defaultTransactionForm: TransactionForm = {
  title: "",
  amount: "",
  transactionType: "expense",
  category: "",
  description: "",
};

const defaultGoalForm: GoalForm = {
  name: "",
  targetAmount: "",
  deadline: "",
};

function authHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// ─── GoalsTab (outside DashboardPage) ────────────────────────────────────────

function GoalsTab({
  goals,
  onDelete,
  onContribute,
  onNewGoal,
}: {
  goals: Goal[];
  onDelete: (id: number) => void;
  onContribute: (
    e: React.FormEvent,
    goalId: number,
    amount: string,
    note: string,
  ) => void;
  onNewGoal: () => void;
}) {
  const [contributeStates, setContributeStates] = useState<
    Record<number, ContributeState>
  >({});

  function toggleContribute(id: number) {
    setContributeStates((prev) => ({
      ...prev,
      [id]: { amount: "", note: "", open: !prev[id]?.open },
    }));
  }

  function updateField(id: number, field: "amount" | "note", value: string) {
    setContributeStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  }

  return (
    <div className="section_2">
      <div className="section-header">
        <h2>Savings Goals</h2>
        <button className="btn btn-primary btn-sm" onClick={onNewGoal}>
          + New Goal
        </button>
      </div>

      {goals.length === 0 && (
        <p style={{ color: "var(--text-muted, #888)" }}>No goals yet.</p>
      )}

      <div className="goals-grid">
        {goals.map((goal) => {
          const percent = Math.min(
            (goal.savedAmount / goal.targetAmount) * 100,
            100,
          );
          const remaining = goal.targetAmount - goal.savedAmount;
          const state: ContributeState = contributeStates[goal.id] || {
            amount: "",
            note: "",
            open: false,
          };

          return (
            <div className="goal-card" key={goal.id}>
              <div className="goal-header">
                <span className="goal-name">{goal.name}</span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span className="goal-status">{goal.status}</span>
                  <button
                    onClick={() => onDelete(goal.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      fontSize: "1.1rem",
                      lineHeight: 1,
                    }}
                    title="Delete goal"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div className="goal-stats">
                <span>${goal.savedAmount.toFixed(2)} saved</span>
                <span>${goal.targetAmount.toFixed(2)} target</span>
              </div>

              <div
                className="meta"
                style={{ marginTop: "0.4rem", fontSize: "0.8rem" }}
              >
                {percent.toFixed(0)}% complete · ${remaining.toFixed(2)}{" "}
                remaining
                {goal.deadline && (
                  <> · Due {new Date(goal.deadline).toLocaleDateString()}</>
                )}
              </div>

              {goal.status !== "completed" && (
                <>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ marginTop: "0.75rem", width: "100%" }}
                    onClick={() => toggleContribute(goal.id)}
                  >
                    {state.open ? "Cancel" : "+ Add Contribution"}
                  </button>

                  {state.open && (
                    <form
                      onSubmit={(e) => {
                        onContribute(e, goal.id, state.amount, state.note);
                        toggleContribute(goal.id);
                      }}
                      style={{
                        marginTop: "0.75rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                    >
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="Amount"
                        value={state.amount}
                        onChange={(e) =>
                          updateField(goal.id, "amount", e.target.value)
                        }
                        required
                        style={{
                          padding: "0.4rem 0.75rem",
                          borderRadius: "6px",
                          border: "1px solid var(--border, #333)",
                          background: "var(--card, #1e1e2e)",
                          color: "inherit",
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Note (optional)"
                        value={state.note}
                        onChange={(e) =>
                          updateField(goal.id, "note", e.target.value)
                        }
                        style={{
                          padding: "0.4rem 0.75rem",
                          borderRadius: "6px",
                          border: "1px solid var(--border, #333)",
                          background: "var(--card, #1e1e2e)",
                          color: "inherit",
                        }}
                      />
                      <button type="submit" className="btn btn-primary btn-sm">
                        Confirm
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── TxRow (outside DashboardPage) ───────────────────────────────────────────

function TxRow({
  tx,
  onEdit,
  onDelete,
}: {
  tx: Transaction;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="txn-row">
      <div className="txn-left">
        <div className={`txn-icon ${tx.transactionType}`}>
          {tx.transactionType === "income" ? "↑" : "↓"}
        </div>
        <div className="txn-info">
          <h4>{tx.title}</h4>
          <div className="meta">
            {tx.category} · {new Date(tx.createdAt).toLocaleDateString()}
          </div>
          {tx.description && <div className="meta">{tx.description}</div>}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div className={`txn-amount ${tx.transactionType}`}>
          {tx.transactionType === "income" ? "+" : "-"}${tx.amount.toFixed(2)}
        </div>
        <button
          onClick={() => onEdit(tx)}
          style={{
            background: "none",
            border: "none",
            color: "#60a5fa",
            cursor: "pointer",
            fontSize: "0.85rem",
            padding: "2px 6px",
          }}
          title="Edit"
        >
          ✎
        </button>
        <button
          onClick={() => onDelete(tx.id)}
          style={{
            background: "none",
            border: "none",
            color: "#ef4444",
            cursor: "pointer",
            fontSize: "1.1rem",
          }}
          title="Delete"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// ─── DashboardPage ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { logout } = useAuth();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionForm, setTransactionForm] = useState<TransactionForm>(
    defaultTransactionForm,
  );
  const [txError, setTxError] = useState("");
  const [txLoading, setTxLoading] = useState(false);

  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState<TransactionForm>(
    defaultTransactionForm,
  );
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalForm, setGoalForm] = useState<GoalForm>(defaultGoalForm);
  const [goalError, setGoalError] = useState("");
  const [goalLoading, setGoalLoading] = useState(false);

  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // ─── Fetch ─────────────────────────────────────────────────────────────────

  async function fetchTransactions() {
    try {
      const res = await fetch(`${API}/api/transactions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch {
      setTransactions([]);
    }
  }

  async function fetchGoals() {
    try {
      const res = await fetch(`${API}/api/goals`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      setGoals(Array.isArray(data) ? data : []);
    } catch {
      setGoals([]);
    }
  }

  useEffect(() => {
    fetchTransactions();
    fetchGoals();
  }, []);

  // ─── Transactions ───────────────────────────────────────────────────────────

  async function createTransaction(e: React.FormEvent) {
    e.preventDefault();
    setTxError("");
    const category = transactionForm.category.trim();
    if (!category) {
      setTxError("Please enter a category.");
      return;
    }
    setTxLoading(true);
    try {
      const res = await fetch(`${API}/api/transactions`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          title: transactionForm.title,
          amount: Number(transactionForm.amount),
          transactionType: transactionForm.transactionType,
          category,
          description: transactionForm.description || null,
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to create transaction");
      await fetchTransactions();
      setShowTransactionModal(false);
      setTransactionForm(defaultTransactionForm);
    } catch (err: any) {
      setTxError(err.message);
    } finally {
      setTxLoading(false);
    }
  }

  async function deleteTransaction(id: number) {
    if (!confirm("Delete this transaction?")) return;
    try {
      const res = await fetch(`${API}/api/transactions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchTransactions();
    } catch (err) {
      console.error(err);
    }
  }

  function openEditModal(tx: Transaction) {
    setEditingTx(tx);
    setEditForm({
      title: tx.title,
      amount: String(tx.amount),
      transactionType: tx.transactionType,
      category: tx.category,
      description: tx.description || "",
    });
    setEditError("");
  }

  async function updateTransaction(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTx) return;
    setEditError("");
    const category = editForm.category.trim();
    if (!category) {
      setEditError("Please enter a category.");
      return;
    }
    setEditLoading(true);
    try {
      const res = await fetch(`${API}/api/transactions/${editingTx.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          title: editForm.title,
          amount: Number(editForm.amount),
          transactionType: editForm.transactionType,
          category,
          description: editForm.description || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      await fetchTransactions();
      setEditingTx(null);
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  }

  // ─── Goals ──────────────────────────────────────────────────────────────────

  async function createGoal(e: React.FormEvent) {
    e.preventDefault();
    setGoalError("");
    setGoalLoading(true);
    try {
      const res = await fetch(`${API}/api/goals`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          name: goalForm.name,
          targetAmount: Number(goalForm.targetAmount),
          deadline: goalForm.deadline || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create goal");
      await fetchGoals();
      setShowGoalModal(false);
      setGoalForm(defaultGoalForm);
    } catch (err: any) {
      setGoalError(err.message);
    } finally {
      setGoalLoading(false);
    }
  }

  async function deleteGoal(id: number) {
    if (!confirm("Delete this goal?")) return;
    try {
      const res = await fetch(`${API}/api/goals/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Failed to delete goal");
      await fetchGoals();
    } catch (err) {
      console.error(err);
    }
  }

  async function contributeToGoal(
    e: React.FormEvent,
    goalId: number,
    amount: string,
    note: string,
  ) {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/api/goals/${goalId}/contribute`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ amount: Number(amount), note: note || null }),
      });
      if (!res.ok) throw new Error("Failed to contribute");
      await fetchGoals();
    } catch (err) {
      console.error(err);
    }
  }

  // ─── Derived data ───────────────────────────────────────────────────────────

  const totalIncome = transactions
    .filter((tx) => tx.transactionType === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpenses = transactions
    .filter((tx) => tx.transactionType === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const balance = totalIncome - totalExpenses;
  const recentTransactions = transactions.slice(0, 5);
  const allCategories = Array.from(
    new Set(transactions.map((tx) => tx.category)),
  );

  const filteredTransactions = transactions.filter((tx) => {
    const matchType = filterType === "all" || tx.transactionType === filterType;
    const matchCat = filterCategory === "all" || tx.category === filterCategory;
    const matchSearch =
      !searchQuery ||
      tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchCat && matchSearch;
  });

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="header">
        <div className="logo">
          <h1>
            <span className="piggy">
              <i className="fas fa-piggy-bank" />
            </span>{" "}
            FinBalance
          </h1>
          <p>Track · Save · Achieve</p>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => {
              setTransactionForm(defaultTransactionForm);
              setTxError("");
              setShowTransactionModal(true);
            }}
          >
            + Add Transaction
          </button>
          <button className="btn btn-outline" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {/* TABS */}
      <div className="nav-tabs">
        {["dashboard", "transactions", "goals", "reports"].map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "goals"
              ? "Savings Goals"
              : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ── DASHBOARD ── */}
      {activeTab === "dashboard" && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Current Balance</div>
              <div className="stat-number">${balance.toFixed(2)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Income</div>
              <div className="stat-number income">
                ${totalIncome.toFixed(2)}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Expenses</div>
              <div className="stat-number expense">
                ${totalExpenses.toFixed(2)}
              </div>
            </div>
          </div>

          <section className="section_2">
            <div className="section-header">
              <h2>Top Goal Progress</h2>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setActiveTab("goals")}
              >
                Manage Goals
              </button>
            </div>

            {goals.length === 0 && (
              <p
                style={{ color: "var(--text-muted, #888)", padding: "1rem 0" }}
              >
                No goals yet.{" "}
                <span
                  style={{
                    color: "var(--primary, #60a5fa)",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setGoalForm(defaultGoalForm);
                    setGoalError("");
                    setShowGoalModal(true);
                  }}
                >
                  Create one
                </span>
              </p>
            )}

            {goals.slice(0, 3).map((goal) => {
              const percent = Math.min(
                (goal.savedAmount / goal.targetAmount) * 100,
                100,
              );
              return (
                <div className="goal-card" key={goal.id}>
                  <div className="goal-header">
                    <span className="goal-name">{goal.name}</span>
                    <span className="goal-status">{goal.status}</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="goal-stats">
                    <span>${goal.savedAmount.toFixed(2)} saved</span>
                    <span>
                      {percent.toFixed(0)}% · ${goal.targetAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="section_2">
            <div className="section-header">
              <h2>Recent Transactions</h2>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setActiveTab("transactions")}
              >
                View All
              </button>
            </div>

            {recentTransactions.length === 0 && (
              <p
                style={{ color: "var(--text-muted, #888)", padding: "1rem 0" }}
              >
                No transactions yet.
              </p>
            )}

            {recentTransactions.map((tx) => (
              <TxRow
                key={tx.id}
                tx={tx}
                onEdit={openEditModal}
                onDelete={deleteTransaction}
              />
            ))}
          </section>

          <section className="section_2">
            <div className="section-header">
              <h2>Quick Actions</h2>
            </div>
            <div className="quick-actions">
              <button
                className="btn btn-primary"
                onClick={() => {
                  setTransactionForm({
                    ...defaultTransactionForm,
                    transactionType: "income",
                  });
                  setTxError("");
                  setShowTransactionModal(true);
                }}
              >
                <i className="fas fa-plus-circle" /> Add Income
              </button>
              <button
                className="btn btn-outline"
                onClick={() => {
                  setTransactionForm({
                    ...defaultTransactionForm,
                    transactionType: "expense",
                  });
                  setTxError("");
                  setShowTransactionModal(true);
                }}
              >
                <i className="fas fa-minus-circle" /> Add Expense
              </button>
              <button
                className="btn btn-outline"
                onClick={() => {
                  setGoalForm(defaultGoalForm);
                  setGoalError("");
                  setShowGoalModal(true);
                }}
              >
                <i className="fas fa-flag-checkered" /> New Goal
              </button>
            </div>
          </section>
        </>
      )}

      {/* ── TRANSACTIONS ── */}
      {activeTab === "transactions" && (
        <div className="section_2">
          <div className="section-header">
            <h2>All Transactions</h2>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setTransactionForm(defaultTransactionForm);
                setTxError("");
                setShowTransactionModal(true);
              }}
            >
              + New
            </button>
          </div>

          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap",
              marginBottom: "1rem",
            }}
          >
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: "0.4rem 0.75rem",
                borderRadius: "6px",
                border: "1px solid var(--border, #333)",
                background: "var(--card, #1e1e2e)",
                color: "inherit",
                flex: 1,
                minWidth: "140px",
              }}
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                padding: "0.4rem 0.75rem",
                borderRadius: "6px",
                border: "1px solid var(--border, #333)",
                background: "var(--card, #1e1e2e)",
                color: "inherit",
              }}
            >
              <option value="all">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              style={{
                padding: "0.4rem 0.75rem",
                borderRadius: "6px",
                border: "1px solid var(--border, #333)",
                background: "var(--card, #1e1e2e)",
                color: "inherit",
              }}
            >
              <option value="all">All categories</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {filteredTransactions.length === 0 && (
            <p style={{ color: "var(--text-muted, #888)" }}>
              No transactions found.
            </p>
          )}

          {filteredTransactions.map((tx) => (
            <TxRow
              key={tx.id}
              tx={tx}
              onEdit={openEditModal}
              onDelete={deleteTransaction}
            />
          ))}
        </div>
      )}

      {/* ── GOALS ── */}
      {activeTab === "goals" && (
        <GoalsTab
          goals={goals}
          onDelete={deleteGoal}
          onContribute={contributeToGoal}
          onNewGoal={() => {
            setGoalForm(defaultGoalForm);
            setGoalError("");
            setShowGoalModal(true);
          }}
        />
      )}

      {/* ── REPORTS ── */}
      {activeTab === "reports" && (
        <div className="section">
          <div className="section-header">
            <h2>Reports</h2>
          </div>
          <p>Charts coming soon.</p>
        </div>
      )}

      {/* ── ADD TRANSACTION MODAL ── */}
      {showTransactionModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowTransactionModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Transaction</h2>
              <button
                className="close-btn"
                onClick={() => setShowTransactionModal(false)}
              >
                ×
              </button>
            </div>
            {txError && (
              <p
                style={{
                  color: "#ef4444",
                  marginBottom: "0.75rem",
                  fontSize: "0.9rem",
                }}
              >
                {txError}
              </p>
            )}
            <form onSubmit={createTransaction}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={transactionForm.title}
                  onChange={(e) =>
                    setTransactionForm({
                      ...transactionForm,
                      title: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={transactionForm.amount}
                  onChange={(e) =>
                    setTransactionForm({
                      ...transactionForm,
                      amount: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select
                  value={transactionForm.transactionType}
                  onChange={(e) =>
                    setTransactionForm({
                      ...transactionForm,
                      transactionType: e.target.value,
                    })
                  }
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  value={transactionForm.category}
                  onChange={(e) =>
                    setTransactionForm({
                      ...transactionForm,
                      category: e.target.value,
                    })
                  }
                  required
                  placeholder="e.g. Food, Rent, Salary..."
                />
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <textarea
                  value={transactionForm.description}
                  onChange={(e) =>
                    setTransactionForm({
                      ...transactionForm,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary modal-submit"
                disabled={txLoading}
              >
                {txLoading ? "Saving..." : "Save Transaction"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT TRANSACTION MODAL ── */}
      {editingTx && (
        <div className="modal-overlay" onClick={() => setEditingTx(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Transaction</h2>
              <button className="close-btn" onClick={() => setEditingTx(null)}>
                ×
              </button>
            </div>
            {editError && (
              <p
                style={{
                  color: "#ef4444",
                  marginBottom: "0.75rem",
                  fontSize: "0.9rem",
                }}
              >
                {editError}
              </p>
            )}
            <form onSubmit={updateTransaction}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={editForm.amount}
                  onChange={(e) =>
                    setEditForm({ ...editForm, amount: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select
                  value={editForm.transactionType}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      transactionType: e.target.value,
                    })
                  }
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  value={editForm.category}
                  onChange={(e) =>
                    setEditForm({ ...editForm, category: e.target.value })
                  }
                  required
                  placeholder="e.g. Food, Rent, Salary..."
                />
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary modal-submit"
                disabled={editLoading}
              >
                {editLoading ? "Saving..." : "Update Transaction"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── NEW GOAL MODAL ── */}
      {showGoalModal && (
        <div className="modal-overlay" onClick={() => setShowGoalModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Savings Goal</h2>
              <button
                className="close-btn"
                onClick={() => setShowGoalModal(false)}
              >
                ×
              </button>
            </div>
            {goalError && (
              <p
                style={{
                  color: "#ef4444",
                  marginBottom: "0.75rem",
                  fontSize: "0.9rem",
                }}
              >
                {goalError}
              </p>
            )}
            <form onSubmit={createGoal}>
              <div className="form-group">
                <label>Goal Name</label>
                <input
                  type="text"
                  value={goalForm.name}
                  onChange={(e) =>
                    setGoalForm({ ...goalForm, name: e.target.value })
                  }
                  required
                  placeholder="e.g. Buy a laptop"
                />
              </div>
              <div className="form-group">
                <label>Target Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={goalForm.targetAmount}
                  onChange={(e) =>
                    setGoalForm({ ...goalForm, targetAmount: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Deadline (optional)</label>
                <input
                  type="date"
                  value={goalForm.deadline}
                  onChange={(e) =>
                    setGoalForm({ ...goalForm, deadline: e.target.value })
                  }
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary modal-submit"
                disabled={goalLoading}
              >
                {goalLoading ? "Creating..." : "Create Goal"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
