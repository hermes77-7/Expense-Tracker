import { Router } from "express";
import {
  getGoals,
  getGoal,
  createGoal,
  updateGoal,
  deleteGoal,
  contributeToGoal,
} from "../controllers/goalsController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.use(protect);

router.get("/", getGoals);
router.get("/:id", getGoal);
router.post("/", createGoal);
router.put("/:id", updateGoal);
router.delete("/:id", deleteGoal);
router.post("/:id/contribute", contributeToGoal);

export default router;
