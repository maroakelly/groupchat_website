
const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const { MongoClient } = require("mongodb");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(express.static(path.join(__dirname, "public")));

let messagesCollection;

io.on("connection", async (socket) => {
  console.log("User connected: " + socket.id);

  try {
    const history = await messagesCollection
      .find(
        {},
        {
          projection: {
            _id: 0,
            name: 1,
            text: 1,
            time: 1
          }
        }
      )
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    socket.emit("chat history", history.reverse());
  } catch (error) {
    console.error("Could not load history:", error.message);
  }

  socket.on("chat message", async (data) => {
    if (
      !data ||
      typeof data.name !== "string" ||
      typeof data.text !== "string"
    ) {
      return;
    }

    const name = data.name.trim().slice(0, 30);
    const text = data.text.trim().slice(0, 500);

    if (!name || !text) return;

    const message = {
      name,
      text,
      time: new Date().toLocaleTimeString(),
      createdAt: new Date()
    };

    try {
      await messagesCollection.insertOne(message);

      io.emit("chat message", {
        name: message.name,
        text: message.text,
        time: message.time
      });

      console.log(name + ": " + text);
    } catch (error) {
      console.error("Could not save message:", error.message);

      socket.emit("chat error", {
        message: "Message could not be saved. Please try again."
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected: " + socket.id);
  });
});

async function startServer() {
  if (!MONGODB_URI) {
    console.error("Missing MONGODB_URI environment variable.");
    process.exit(1);
  }

  const mongoClient = new MongoClient(MONGODB_URI);

  try {
    await mongoClient.connect();

    const database = mongoClient.db("groupchat");
    messagesCollection = database.collection("messages");

    await messagesCollection.createIndex({ createdAt: -1 });

    console.log("Connected to MongoDB successfully.");

    server.listen(PORT, "0.0.0.0", () => {
      console.log("Group Chat website running on port " + PORT);
    });
  } catch (error) {
    console.error("Could not connect to MongoDB:", error.message);
    process.exit(1);
  }
}

startServer();
