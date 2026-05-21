import { useEffect, useState } from "react";

import BalanceCard from "../components/BalanceCard";
import Navbar from "../components/Navbar";

import { getTransactions } from "../services/transactionService";

import type { Transaction } from "../types/transaction";

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getTransactions();

        setTransactions(data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();
  }, []);

  const totalIncome = transactions
    .filter((transaction) => transaction.transaction_type === "income")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const totalExpenses = transactions
    .filter((transaction) => transaction.transaction_type === "expense")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  const balance = totalIncome - totalExpenses;

   return (
     <div
       style={{
         padding: "40px",
         backgroundColor: "#f8f9fa",
         minHeight: "100vh",
         fontFamily: "'Inter', sans-serif",
       }}
     >
       <header style={{ marginBottom: "30px" }}>
        <Navbar></Navbar>
        <br />
         <h1 style={{ color: "#2d3436", fontSize: "2.5rem", margin: 0 }}>
           Financial Overview
         </h1>
         <p style={{ color: "#636e72", marginTop: "5px" }}>
           Track your spending and savings in real-time.
         </p>
       </header>

       <div
         style={{
           display: "flex",
           gap: "25px",
           flexWrap: "wrap",
         }}
       >
         <BalanceCard title="Current Balance" amount={balance} />
         <BalanceCard title="Income" amount={totalIncome} />
         <BalanceCard title="Expenses" amount={totalExpenses} />
       </div>
     </div>
   );
}
