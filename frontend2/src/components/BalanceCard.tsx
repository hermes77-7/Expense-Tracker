interface BalanceCardProps {
  title: string;
  amount: number;
}

export default function BalanceCard({ title, amount }: BalanceCardProps) {
  // Determine color theme based on title
  const isExpense = title.toLowerCase() === "expenses";
  const isIncome = title.toLowerCase() === "income";

  const accentColor = isExpense ? "#ff4757" : isIncome ? "#2ed573" : "#ffa502";

  return (
    <div
      style={{
        background: "#ffffff",
        padding: "24px",
        borderRadius: "16px",
        width: "240px",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        borderLeft: `6px solid ${accentColor}`,
        transition: "transform 0.2s ease-in-out",
        cursor: "default",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.transform = "translateY(-5px)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
    >
      <h3
        style={{
          margin: 0,
          color: "#7f8c8d",
          fontSize: "0.9rem",
          textTransform: "uppercase",
          letterSpacing: "1px",
        }}
      >
        {title}
      </h3>
      <h2
        style={{
          margin: "10px 0 0 0",
          color: "#2d3436",
          fontSize: "2rem",
          fontWeight: "700",
        }}
      >
        ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </h2>
    </div>
  );
}
