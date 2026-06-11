export interface Transaction {
  id: number;
  title: string;
  amount: number;
  transaction_type: "income" | "expense";
  category: string;
  description?: string;
  date: string;
  created_at: string;
}

export interface CreateTransactionData {
  title: string;
  amount: number;
  transaction_type: "income" | "expense";
  category: string;
  description?: string;
}
