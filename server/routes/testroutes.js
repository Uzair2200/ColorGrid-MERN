import express from "express";
const router = express.Router();
import { createPlayer, findPlayer, updatePlayer } from "../controllers/testcontroller.js";
import { getGameHistory, getGameDetails, getLeaderboard } from "../controllers/gameController.js";
import { updatePlayerName } from "../controllers/userController.js";

// Authentication routes
router.post("/login", findPlayer);
router.post("/signup", createPlayer);
router.patch("/users/:id", updatePlayer);

// User profile routes
router.put("/users/:userId/update-name", updatePlayerName);

// Game history routes
router.get("/games/history/:userId", getGameHistory);
router.get("/games/:gameId", getGameDetails);

// Leaderboard route
router.get("/leaderboard", getLeaderboard);

export { router };
