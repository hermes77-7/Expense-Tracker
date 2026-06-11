import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import "../styles/dashboard.css";

const API = "http://localhost:8000";
const USD_TO_XAF_RATE = 600;

type CurrencyMode = "USD" | "XAF";

type Transaction = {
  id: number;
  title: string;
  transactionType: "income" | "expense";
  category: string;
  description: string | null;
  amount: number; // stored in USD internally
  createdAt: string;
};

type Goal = {
  id: number;
  name: string;
  savedAmount: number; // stored in USD internally
  targetAmount: number; // stored in USD internally
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

function convertUsdToDisplay(amountUsd: number, currency: CurrencyMode) {
  return currency === "USD" ? amountUsd : amountUsd * USD_TO_XAF_RATE;
}

function convertDisplayToUsd(amount: string, currency: CurrencyMode) {
  const numeric = Number(amount);
  if (Number.isNaN(numeric)) return 0;
  return currency === "USD" ? numeric : numeric / USD_TO_XAF_RATE;
}

function formatMoney(amountUsd: number, currency: CurrencyMode) {
  const displayValue = convertUsdToDisplay(amountUsd, currency);

  if (currency === "USD") {
    return `$${displayValue.toFixed(2)}`;
  }

  return `${Math.round(displayValue).toLocaleString("en-US")} XAF`;
}

function formatMoneyNoSymbol(amountUsd: number, currency: CurrencyMode) {
  const displayValue = convertUsdToDisplay(amountUsd, currency);

  if (currency === "USD") {
    return displayValue.toFixed(2);
  }

  return Math.round(displayValue).toLocaleString("en-US");
}

// ─── GoalsTab (outside DashboardPage) ────────────────────────────────────────

function GoalsTab({
  goals,
  onDelete,
  onContribute,
  onNewGoal,
  currency,
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
  currency: CurrencyMode;
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
          const percent =
            goal.targetAmount > 0
              ? Math.min((goal.savedAmount / goal.targetAmount) * 100, 100)
              : 0;

          const remaining = Math.max(goal.targetAmount - goal.savedAmount, 0);

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
                <span>{formatMoney(goal.savedAmount, currency)} saved</span>
                <span>{formatMoney(goal.targetAmount, currency)} target</span>
              </div>

              <div
                className="meta"
                style={{ marginTop: "0.4rem", fontSize: "0.8rem" }}
              >
                {percent.toFixed(0)}% complete ·{" "}
                {formatMoney(remaining, currency)} remaining
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
                        placeholder={`Amount (${currency})`}
                        value={state.amount}
                        onChange={(e) =>
                          updateField(goal.id, "amount", e.target.value)
                        }
                        required
                        style={{
                          padding: "0.4rem 0.75rem",
                          borderRadius: "6px",
                          border: "1px solid var(--border, #333)",
                          background: "var(--card, #ffffff)",
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
                          background: "var(--card, #ffffff)",
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
  currency,
}: {
  tx: Transaction;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: number) => void;
  currency: CurrencyMode;
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
          {tx.transactionType === "income" ? "+" : "-"}
          {formatMoney(tx.amount, currency)}
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

function ReportsTab({
  transactions,
  goals,
  currency,
  setCurrency,
}: {
  transactions: Transaction[];
  goals: Goal[];
  currency: CurrencyMode;
  setCurrency: (currency: CurrencyMode) => void;
}) {
  const monthlyData = useMemo(() => {
    const map: Record<
      string,
      { month: string; income: number; expense: number }
    > = {};

    transactions.forEach((tx) => {
      const date = new Date(tx.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = date.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });

      if (!map[key]) map[key] = { month: label, income: 0, expense: 0 };

      if (tx.transactionType === "income") map[key].income += tx.amount;
      else map[key].expense += tx.amount;
    });

    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => ({
        month: v.month,
        income: convertUsdToDisplay(v.income, currency),
        expense: convertUsdToDisplay(v.expense, currency),
      }))
      .slice(-6);
  }, [transactions, currency]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};

    transactions
      .filter((tx) => tx.transactionType === "expense")
      .forEach((tx) => {
        map[tx.category] = (map[tx.category] || 0) + tx.amount;
      });

    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([category, amount]) => ({
        category,
        amount: convertUsdToDisplay(amount, currency),
      }));
  }, [transactions, currency]);

  const totalIncome = transactions
    .filter((tx) => tx.transactionType === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpenses = transactions
    .filter((tx) => tx.transactionType === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalSaved = goals.reduce((sum, g) => sum + g.savedAmount, 0);
  const totalTargeted = goals.reduce((sum, g) => sum + g.targetAmount, 0);

  const totalIncomeDisplay = convertUsdToDisplay(totalIncome, currency);
  const totalExpensesDisplay = convertUsdToDisplay(totalExpenses, currency);
  const netBalanceDisplay = convertUsdToDisplay(
    totalIncome - totalExpenses,
    currency,
  );
  const totalSavedDisplay = convertUsdToDisplay(totalSaved, currency);
  const totalTargetedDisplay = convertUsdToDisplay(totalTargeted, currency);

  const maxMonthlyValue = Math.max(
    ...monthlyData.flatMap((m) => [m.income, m.expense]),
    1,
  );

  const maxCategoryValue = Math.max(...categoryData.map((c) => c.amount), 1);

  const CATEGORY_COLORS = [
    "#60a5fa",
    "#34d399",
    "#f87171",
    "#fbbf24",
    "#a78bfa",
    "#fb923c",
    "#38bdf8",
    "#4ade80",
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        padding: "0 0 2rem",
      }}
    >
      <div className="section_2">
        <div className="section-header">
          <h2>Reports</h2>

          <button
            type="button"
            onClick={() => setCurrency(currency === "USD" ? "XAF" : "USD")}
            aria-pressed={currency === "XAF"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.6rem",
              border: "1px solid var(--border, #333)",
              background: "var(--card, #ffffff)",
              color: "inherit",
              padding: "0.45rem 0.75rem",
              borderRadius: "999px",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
              minWidth: "120px",
              justifyContent: "space-between",
            }}
            title="Switch currency display"
          >
            <span>{currency === "USD" ? "USD" : "XAF"}</span>
            <span
              style={{
                width: "42px",
                height: "24px",
                borderRadius: "999px",
                background: currency === "XAF" ? "#60a5fa" : "#6b7280",
                position: "relative",
                flexShrink: 0,
                transition: "background 0.2s ease",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: "2px",
                  left: currency === "XAF" ? "20px" : "2px",
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left 0.2s ease",
                }}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Financial Summary */}

      {(() => {
        const netBalance = totalIncome - totalExpenses;

        const totalSavedInActiveGoals = goals
          .filter((goal) => goal.status !== "completed")
          .reduce((sum, goal) => sum + goal.savedAmount, 0);

        const spendableAmount = netBalance - totalSavedInActiveGoals;

        return (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Net Balance</div>
              <div
                className={`stat-number ${
                  netBalance >= 0 ? "income" : "expense"
                }`}
              >
                {formatMoney(netBalance, currency)}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Total Saved</div>
              <div className="stat-number income">
                {formatMoney(totalSavedInActiveGoals, currency)}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Spendable Amount</div>
              <div
                className={`stat-number ${
                  spendableAmount >= 0 ? "income" : "expense"
                }`}
              >
                {formatMoney(spendableAmount, currency)}
              </div>
            </div>
          </div>
        );
      })()}

      <div className="section_2">
        <div className="section-header">
          <h2>Monthly Overview</h2>
          <span className="meta" style={{ fontSize: "0.8rem" }}>
            Last 6 months
          </span>
        </div>

        {monthlyData.length === 0 ? (
          <p style={{ color: "var(--text-muted, #888)" }}>No data yet.</p>
        ) : (
          <>
            <div
              style={{ display: "flex", gap: "1.25rem", marginBottom: "1rem" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontSize: "0.85rem",
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 2,
                    background: "#34d399",
                  }}
                />
                Income
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontSize: "0.85rem",
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 2,
                    background: "#f87171",
                  }}
                />
                Expenses
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: "0.75rem",
                height: 180,
              }}
            >
              {monthlyData.map((m) => (
                <div
                  key={m.month}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.3rem",
                    height: "100%",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "flex-end",
                      gap: "4px",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        position: "relative",
                        height: "100%",
                        display: "flex",
                        alignItems: "flex-end",
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: `${(m.income / maxMonthlyValue) * 100}%`,
                          background: "#34d399",
                          borderRadius: "4px 4px 0 0",
                          minHeight: m.income > 0 ? 4 : 0,
                          transition: "height 0.3s ease",
                        }}
                        title={`Income: ${formatMoney(m.income, currency)}`}
                      />
                    </div>

                    <div
                      style={{
                        flex: 1,
                        position: "relative",
                        height: "100%",
                        display: "flex",
                        alignItems: "flex-end",
                      }}
                    >
                      <div
                        style={{
                          width: "100%",
                          height: `${(m.expense / maxMonthlyValue) * 100}%`,
                          background: "#f87171",
                          borderRadius: "4px 4px 0 0",
                          minHeight: m.expense > 0 ? 4 : 0,
                          transition: "height 0.3s ease",
                        }}
                        title={`Expenses: ${formatMoney(m.expense, currency)}`}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "var(--text-muted, #888)",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {m.month}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="section_2">
        <div className="section-header">
          <h2>Spending by Category</h2>
        </div>

        {categoryData.length === 0 ? (
          <p style={{ color: "var(--text-muted, #888)" }}>
            No expense data yet.
          </p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            {categoryData.map((c, i) => {
              const pct = (c.amount / maxCategoryValue) * 100;
              const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
              const totalExpensesForPct = categoryData.reduce(
                (s, x) => s + x.amount,
                0,
              );
              const sharePct = ((c.amount / totalExpensesForPct) * 100).toFixed(
                1,
              );

              return (
                <div key={c.category}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.3rem",
                      fontSize: "0.88rem",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: color,
                          display: "inline-block",
                        }}
                      />
                      {c.category}
                    </span>
                    <span style={{ color: "var(--text-muted, #888)" }}>
                      {formatMoney(c.amount, currency)}{" "}
                      <span style={{ fontSize: "0.78rem" }}>({sharePct}%)</span>
                    </span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      borderRadius: 4,
                      background: "var(--border, #2a2a3d)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: color,
                        borderRadius: 4,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="section_2">
        <div className="section-header">
          <h2>Savings Goals Progress</h2>
          {totalTargeted > 0 && (
            <span
              style={{ fontSize: "0.85rem", color: "var(--text-muted, #888)" }}
            >
              {formatMoney(totalSaved, currency)} /{" "}
              {formatMoney(totalTargeted, currency)}
            </span>
          )}
        </div>

        {goals.length === 0 ? (
          <p style={{ color: "var(--text-muted, #888)" }}>No goals yet.</p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {goals.map((goal) => {
              const pct =
                goal.targetAmount > 0
                  ? Math.min((goal.savedAmount / goal.targetAmount) * 100, 100)
                  : 0;

              const remaining = Math.max(
                goal.targetAmount - goal.savedAmount,
                0,
              );
              const isComplete = goal.status === "completed";

              return (
                <div key={goal.id}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "0.35rem",
                      fontSize: "0.88rem",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      {goal.name}
                      {isComplete && (
                        <span
                          style={{
                            fontSize: "0.75rem",
                            background: "#34d39922",
                            color: "#34d399",
                            padding: "1px 6px",
                            borderRadius: 4,
                          }}
                        >
                          ✓ Complete
                        </span>
                      )}
                    </span>
                    <span style={{ color: "var(--text-muted, #888)" }}>
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: 10,
                      borderRadius: 5,
                      background: "var(--border, #2a2a3d)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: isComplete ? "#34d399" : "#60a5fa",
                        borderRadius: 5,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: "0.3rem",
                      fontSize: "0.78rem",
                      color: "var(--text-muted, #888)",
                    }}
                  >
                    <span>{formatMoney(goal.savedAmount, currency)} saved</span>
                    {!isComplete && (
                      <span>{formatMoney(remaining, currency)} remaining</span>
                    )}
                    {goal.deadline && (
                      <span>
                        Due {new Date(goal.deadline).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="section_2">
        <div className="section-header">
          <h2>Income vs Expenses</h2>
        </div>

        {totalIncome === 0 && totalExpenses === 0 ? (
          <p style={{ color: "var(--text-muted, #888)" }}>No data yet.</p>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "2rem",
              flexWrap: "wrap",
            }}
          >
            <DonutChart income={totalIncome} expenses={totalExpenses} />

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    background: "#34d399",
                  }}
                />
                <div>
                  <div style={{ fontSize: "0.85rem" }}>Income</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                    {formatMoney(totalIncome, currency)}
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    background: "#f87171",
                  }}
                />
                <div>
                  <div style={{ fontSize: "0.85rem" }}>Expenses</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                    {formatMoney(totalExpenses, currency)}
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    background: "#60a5fa",
                  }}
                />
                <div>
                  <div style={{ fontSize: "0.85rem" }}>Savings Rate</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: 600 }}>
                    {totalIncome > 0
                      ? `${(((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(1)}%`
                      : "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DonutChart ───────────────────────────────────────────────────────────────

function DonutChart({
  income,
  expenses,
}: {
  income: number;
  expenses: number;
}) {
  const total = income + expenses;
  const incomeShare = total > 0 ? income / total : 0;

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const incomeArc = incomeShare * circumference;
  const expenseArc = circumference - incomeArc;

  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      <circle
        cx="80"
        cy="80"
        r={radius}
        fill="none"
        stroke="#f87171"
        strokeWidth="22"
        strokeDasharray={`${expenseArc} ${incomeArc}`}
        strokeDashoffset={0}
        transform="rotate(-90 80 80)"
      />
      <circle
        cx="80"
        cy="80"
        r={radius}
        fill="none"
        stroke="#34d399"
        strokeWidth="22"
        strokeDasharray={`${incomeArc} ${expenseArc}`}
        strokeDashoffset={0}
        transform="rotate(-90 80 80)"
      />
      <text
        x="80"
        y="75"
        textAnchor="middle"
        fontSize="13"
        fill="currentColor"
        opacity="0.6"
      >
        saved
      </text>
      <text
        x="80"
        y="94"
        textAnchor="middle"
        fontSize="14"
        fontWeight="bold"
        fill="currentColor"
      >
        {income > 0
          ? `${(((income - expenses) / income) * 100).toFixed(0)}%`
          : "—"}
      </text>
    </svg>
  );
}

// ─── DashboardPage ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { logout } = useAuth();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [currency, setCurrency] = useState<CurrencyMode>("USD");

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
          amount: convertDisplayToUsd(transactionForm.amount, currency),
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
      amount: formatMoneyNoSymbol(tx.amount, currency),
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
          amount: convertDisplayToUsd(editForm.amount, currency),
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
          targetAmount: convertDisplayToUsd(goalForm.targetAmount, currency),
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
        body: JSON.stringify({
          amount: convertDisplayToUsd(amount, currency),
          note: note || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to contribute");
      await fetchGoals();
    } catch (err) {
      console.error(err);
    }
  }

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

  return (
    <div className="app-container">
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

      {activeTab === "dashboard" && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Current Balance</div>
              <div className="stat-number">
                {formatMoney(balance, currency)}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Income</div>
              <div className="stat-number income">
                {formatMoney(totalIncome, currency)}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Expenses</div>
              <div className="stat-number expense">
                {formatMoney(totalExpenses, currency)}
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
              const percent =
                goal.targetAmount > 0
                  ? Math.min((goal.savedAmount / goal.targetAmount) * 100, 100)
                  : 0;

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
                    <span>{formatMoney(goal.savedAmount, currency)} saved</span>
                    <span>
                      {percent.toFixed(0)}% ·{" "}
                      {formatMoney(goal.targetAmount, currency)}
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
                currency={currency}
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
                background: "var(--card, #ffffff)",
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
                background: "var(--card, #ffffff)",
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
                background: "var(--card, #ffffff)",
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
              currency={currency}
            />
          ))}
        </div>
      )}

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
          currency={currency}
        />
      )}

      {activeTab === "reports" && (
        <ReportsTab
          transactions={transactions}
          goals={goals}
          currency={currency}
          setCurrency={setCurrency}
        />
      )}

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
                <label>Amount ({currency})</label>
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
                <label>Amount ({currency})</label>
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
                <label>Target Amount ({currency})</label>
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
