const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve the website
app.use(express.static(path.join(__dirname, "public")));

// Handle chat connections
io.on("connection", (socket) => {
  console.log("User connected: " + socket.id);

  socket.on("chat message", (data) => {
    if (
      !data ||
      typeof data.name !== "string" ||
      typeof data.text !== "string"
    ) {
      return;
    }

    const name = data.name.trim().slice(0, 30);
    const text = data.text.trim().slice(0, 500);

    if (!name || !text) {
      return;
    }

    // Broadcast the message to everyone
    io.emit("chat message", {
      name: name,
      text: text,
      time: new Date().toLocaleTimeString()
    });

    console.log(name + ": " + text);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected: " + socket.id);
  });
});

// Start server
server.listen(PORT, "0.0.0.0", () => {
  console.log("Group Chat website running on port " + PORT);
});
