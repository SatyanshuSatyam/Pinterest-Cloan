import express from "express";
import { getUserBoards, getCurrentUserBoards } from "../controllers/board.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

router.get("/", verifyToken, getCurrentUserBoards);
router.get("/:userId", getUserBoards);

export default router;