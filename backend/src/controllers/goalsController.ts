import { Request, Response } from "express";
import prisma from "../utils/prisma";

// GET /api/goals
export const getGoals = async (req: Request, res: Response) => {
  try {
    const goals = await prisma.savingsGoal.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
      include: { contributions: true },
    });

    res.json(goals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch goals" });
  }
};

// GET /api/goals/:id
export const getGoal = async (req: Request, res: Response) => {
  try {
    const goal = await prisma.savingsGoal.findFirst({
      where: {
        id: Number(req.params.id),
        userId: req.userId,
      },
      include: { contributions: { orderBy: { createdAt: "desc" } } },
    });

    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    res.json(goal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch goal" });
  }
};

// POST /api/goals
export const createGoal = async (req: Request, res: Response) => {
  try {
    const { name, targetAmount, deadline } = req.body;

    if (!name || !targetAmount) {
      return res
        .status(400)
        .json({ error: "Name and target amount are required" });
    }

    if (Number(targetAmount) <= 0) {
      return res
        .status(400)
        .json({ error: "Target amount must be greater than 0" });
    }

    const goal = await prisma.savingsGoal.create({
      data: {
        name,
        targetAmount: Number(targetAmount),
        savedAmount: 0,
        deadline: deadline ? new Date(deadline) : null,
        status: "active",
        userId: req.userId!,
      },
    });

    res.status(201).json(goal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create goal" });
  }
};

// PUT /api/goals/:id
export const updateGoal = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.savingsGoal.findFirst({
      where: {
        id: Number(req.params.id),
        userId: req.userId,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Goal not found" });
    }

    const { name, targetAmount, deadline, status } = req.body;

    if (targetAmount !== undefined && Number(targetAmount) <= 0) {
      return res
        .status(400)
        .json({ error: "Target amount must be greater than 0" });
    }

    if (status && !["active", "completed", "paused"].includes(status)) {
      return res
        .status(400)
        .json({ error: "Status must be active, completed, or paused" });
    }

    const updated = await prisma.savingsGoal.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(name && { name }),
        ...(targetAmount !== undefined && {
          targetAmount: Number(targetAmount),
        }),
        ...(deadline !== undefined && {
          deadline: deadline ? new Date(deadline) : null,
        }),
        ...(status && { status }),
      },
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update goal" });
  }
};

// DELETE /api/goals/:id
export const deleteGoal = async (req: Request, res: Response) => {
  try {
    const existing = await prisma.savingsGoal.findFirst({
      where: {
        id: Number(req.params.id),
        userId: req.userId,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Goal not found" });
    }

    await prisma.savingsGoal.delete({
      where: { id: Number(req.params.id) },
    });

    res.json({ message: "Goal deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete goal" });
  }
};

// POST /api/goals/:id/contribute
export const contributeToGoal = async (req: Request, res: Response) => {
  try {
    const goal = await prisma.savingsGoal.findFirst({
      where: {
        id: Number(req.params.id),
        userId: req.userId,
      },
    });

    if (!goal) {
      return res.status(404).json({ error: "Goal not found" });
    }

    if (goal.status === "completed") {
      return res
        .status(400)
        .json({ error: "Cannot contribute to a completed goal" });
    }

    const { amount, note } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    const newSavedAmount = goal.savedAmount + Number(amount);
    const isNowComplete = newSavedAmount >= goal.targetAmount;

    // create contribution and update savedAmount in one transaction
    const [contribution, updatedGoal] = await prisma.$transaction([
      prisma.goalContribution.create({
        data: {
          amount: Number(amount),
          note: note || null,
          goalId: goal.id,
        },
      }),
      prisma.savingsGoal.update({
        where: { id: goal.id },
        data: {
          savedAmount: newSavedAmount,
          status: isNowComplete ? "completed" : goal.status,
        },
      }),
    ]);

    res.status(201).json({ contribution, goal: updatedGoal });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add contribution" });
  }
};
