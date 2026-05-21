import api from "./api";

import type { Transaction, CreateTransactionData } from "../types/transaction";

export const getTransactions = async (): Promise<Transaction[]> => {
  const response = await api.get<Transaction[]>("/transactions/");

  return response.data;
};

export const createTransaction = async (
  data: CreateTransactionData,
): Promise<Transaction> => {
  const response = await api.post<Transaction>("/transactions/", data);

  return response.data;
};

export const deleteTransaction = async (id: number): Promise<void> => {
  await api.delete(`/transactions/${id}/`);
};
