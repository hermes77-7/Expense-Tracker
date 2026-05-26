import { useState } from "react";

import { createTransaction } from "../services/transactionService";

import type { CreateTransactionData } from "../types/transaction";

export default function AddTransaction() {
  const [formData, setFormData] = useState<CreateTransactionData>({
    title: "",
    amount: 0,
    transaction_type: "expense",
    category: "other",
    description: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "amount" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createTransaction(formData);

      alert("Transaction added!");

      setFormData({
        title: "",
        amount: 0,
        transaction_type: "expense",
        category: "other",
        description: "",
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      <h1>Add Transaction</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="title"
          placeholder="Title"
          value={formData.title}
          onChange={handleChange}
          required
        />

        <br />
        <br />

        <input
          type="number"
          name="amount"
          placeholder="Amount"
          value={formData.amount}
          onChange={handleChange}
          required
        />

        <br />
        <br />

        <select
          name="transaction_type"
          value={formData.transaction_type}
          onChange={handleChange}
        >
          <option value="income">Income</option>

          <option value="expense">Expense</option>
        </select>

        <br />
        <br />

        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
        >
          <option value="food">Food</option>
          <option value="transport">Transport</option>
          <option value="rent">Rent</option>
          <option value="salary">Salary</option>
          <option value="entertainment">Entertainment</option>
          <option value="health">Health</option>
          <option value="other">Other</option>
        </select>

        <br />
        <br />

        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
        />

        <br />
        <br />

        <button type="submit">Add Transaction</button>
      </form>
    </div>
  );
}
