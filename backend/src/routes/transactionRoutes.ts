import { Router } from "express";
import {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getSummary,
} from "../controllers/transactionController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.use(protect); // all transaction routes require auth

router.get("/summary", getSummary);
router.get("/", getTransactions);
router.get("/:id", getTransaction);
router.post("/", createTransaction);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);

export default router;
