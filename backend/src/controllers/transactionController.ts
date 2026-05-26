import { Request, Response } from "express";
import prisma from "../utils/prisma";

// GET /api/transactions
export const getTransactions = async (req: Request, res: Response) => {
  try {
    const { type, category, startDate, endDate } = req.query;

    const where: any = { userId: req.userId };

    if (type) where.transactionType = type;
    if (category) where.category = category;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

// GET /api/transactions/:id
export const getTransaction = async (req: Request, res: Response) => {
  try {
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: Number(req.params.id),
        userId: req.userId,
      },
    });

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch transaction" });
  }
};

// POST /api/transactions
export const createTransaction = async (req: Request, res: Response) => {
  try {
    const { title, amount, transactionType, category, description } = req.body;

    if (!title || !amount || !transactionType || !category) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!["income", "expense"].includes(transactionType)) {
      return res
        .status(400)
        .json({ error: "transactionType must be income or expense" });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    const transaction = await prisma.transaction.create({
      data: {
        title,
        amount: Number(amount),
        transactionType,
        category,
        description: description || null,
        userId: req.userId!,
      },
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create transaction" });
  }
};

// PUT /api/transactions/:id
export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.transaction.findFirst({
      where: {
        id: Number(req.params.id),
        userId: req.userId,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const { title, amount, transactionType, category, description } = req.body;

    if (transactionType && !["income", "expense"].includes(transactionType)) {
      return res
        .status(400)
        .json({ error: "transactionType must be income or expense" });
    }

    if (amount !== undefined && Number(amount) <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    const updated = await prisma.transaction.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(title && { title }),
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(transactionType && { transactionType }),
        ...(category && { category }),
        ...(description !== undefined && { description }),
      },
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update transaction" });
  }
};

// DELETE /api/transactions/:id
export const deleteTransaction = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.transaction.findFirst({
      where: {
        id: Number(req.params.id),
        userId: req.userId,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    await prisma.transaction.delete({
      where: { id: Number(req.params.id) },
    });

    res.json({ message: "Transaction deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete transaction" });
  }
};

// GET /api/transactions/summary
export const getSummary = async (req: Request, res: Response) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.userId },
    });

    const totalIncome = transactions
      .filter((t) => t.transactionType === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter((t) => t.transactionType === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpenses;

    // spending by category
    const byCategory: Record<string, number> = {};
    transactions
      .filter((t) => t.transactionType === "expense")
      .forEach((t) => {
        byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
      });

    res.json({ totalIncome, totalExpenses, balance, byCategory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch summary" });
  }
};
