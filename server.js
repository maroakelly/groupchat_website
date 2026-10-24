```javascript
const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true
  }
});

const PORT = process.env.PORT || 3000;

// Serve the website files from the public folder.
app.use(express.static(path.join(__dirname, "public")));

// Handle incoming chat connections.
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Receive and broadcast chat messages.
  socket.on("chat message", (data) => {
    // Validate incoming data.
    if (
      !data ||
      typeof data.name !== "string" ||
      typeof data.text !== "string"
    ) {
      return;
    }

    // Clean and limit message content.
    const name = data.name.trim().slice(0, 30);
    const text = data.text.trim().slice(0, 500);

    // Ignore empty messages.
    if (!name || !text) {
      return;
    }

    // Send the message to everyone connected, including the sender.
    io.emit("chat message", {
      name,
      text,
      time: new Date().toLocaleTimeString()
    });

    console.log(`${name}: ${text}`);
  });

  // Handle disconnections.
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Start the server.
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Group Chat website running on port ${PORT}`);
});
```
