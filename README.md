# 🎮 ColorGrid – A Real-Time 2-Player Conquest Game

Welcome to **ColorGrid**, a fast-paced, turn-based multiplayer web game where two players battle on a 5×5 grid to conquer the largest connected island of their color! 🟥🟦  
Built with the **MERN stack** and **Socket.IO** for real-time communication, this game brings logic, speed, and fun together in a seamless experience.

---

## ⚙️ Tech Stack

- 🌐 **Frontend**: React + Vite  
- 🔌 **Backend**: Node.js + Express  
- 📡 **WebSockets**: Socket.IO  
- 🗃️ **Database**: MongoDB

---

## 🚀 Getting Started

> ❗️**Important**: You must install packages in **both** the `client/` and `server/` directories before starting the project.

### 1. 📁 Navigate to the Client Directory and Install Packages
```bash
cd client
npm install
```

### 2. 📁 Navigate to the Server Directory and Install Packages
```bash
cd ../server
npm install
```

### 3. ⚙️ Environment Variables

Create a file named `config.env` inside the `server/` directory (or open it if it already exists), and **make sure to insert your correct MongoDB connection string here**:
```env
PORT=8000
MONGO_URI=your_correct_mongodb_connection_string_here
```

---

## ▶️ Running the Project

Open **two terminal windows**:

### 🖥️ Terminal 1 – Start the Backend
```bash
cd server
npm run dev
```

### 🌐 Terminal 2 – Start the Frontend
```bash
cd client
npm run dev
```

The app will be live at:  
**http://localhost:5173**

---

## 🕹️ Game Overview

- 2 players compete on a 5×5 grid 🎯  
- Real-time updates via Socket.IO 🔄  
- Victory depends on the **largest connected island** of color 🏆  
- Coins, profile management, leaderboard, and more! 💰👤

---

## 📂 Folder Structure

```
📁 client/    # React + Vite frontend  
📁 server/    # Express + Socket.IO backend  
📁 design/    # Starter HTML/CSS files  
```

---

## 💡 Tips

- Use the starter design files to build React components 🧩  
- Use `useState`, `useEffect`, and React Router effectively 🚦  
- Real-time gameplay = no page reloads! 🚫🔄  
- Matchmaking, move sync, and game end handled via sockets 🎯

---

## 📜 License

This project was developed as part of an **Advanced Programming** course assignment. Feel free to modify and enhance it for personal or educational use.
