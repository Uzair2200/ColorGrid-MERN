import { Server } from "socket.io";
import http from "http";
import { app } from "./app.js";
import { config } from "dotenv";
import express from "express";
import { router } from "./routes/testroutes.js";
import mongoose from "mongoose";
import { initializeGameLogic } from "./gameLogic.js";

// Load environment variables
config({
  path: "./config.env",
});

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH"],
    credentials: false,
  },
});

// Export io for use in other modules
export { io };

// Initialize game logic
initializeGameLogic(io);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    server.listen(process.env.PORT, () => {
      console.log(`Server is running on port: ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("MongoDB connection error:", error);
  });

// Middleware
app.use(express.json());
app.use((req, _, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api", router);
