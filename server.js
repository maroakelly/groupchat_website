const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  socket.on("chat message", (data) => {
    if (!data || typeof data.name !== "string" || typeof data.text !== "string") return;

    const name = data.name.trim().slice(0, 30);
    const text = data.text.trim().slice(0, 500);
    if (!name || !text) return;

    io.emit("chat message", {
      name,
      text,
      time: new Date().toLocaleTimeString()
    });
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Group Chat website running on port ${PORT}`);
});
