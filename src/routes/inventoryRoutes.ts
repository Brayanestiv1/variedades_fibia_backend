import { Router } from "express";
import { registerExit } from "../controllers/inventoryController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// All inventory routes require authentication
router.use(authenticateToken);

router.post("/products/:id/exit", registerExit);

export default router;

