import express from "express";
import cors from "cors";

export const app = express();

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:8000', 'http://127.0.0.1:5173'],
    credentials: true
  }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
