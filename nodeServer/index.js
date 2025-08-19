// Node server which will handle socket IO connection
// yahan hamara node server kuch events ko handle karega

const io = require("socket.io")(8000, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  }
});

const dbconnect = require("./dbconfig");

dbconnect(); // <-- This ensures the connection message appears on server start

console.log("Server listening on port 8000");

const users = {};

io.on("connection", async (socket) => {
  // User connected (socket ID not logged)

  // READ operation - Show old messages when user joins
  try {
    let db = await dbconnect();
    let collection = db.collection("messages");
    let oldMessages = await collection.find({}).limit(10).toArray();

    oldMessages.forEach((msg) => {
      socket.emit("receive", {
        name: msg.name,
        message: msg.message,
        id: msg._id,
      });
    });
  } catch (err) {
    console.log("Error loading messages");
  }

  //if any new user joined, let other users connected to the server know
  socket.on("new-user-joined", (name) => {
    if(name && name.trim() !== "") {
      console.log("New user", name);
      users[socket.id] = name;
      socket.broadcast.emit("user-joined", name);
    }
  });

  //if someone sends a message, broadcast it to other people AND save to database
  socket.on("send", async (message) => {
    let userName = users[socket.id];

    if(userName && message && message.trim() !== "") {
      // CREATE operation - Save message to database
      try {
        let db = await dbconnect();
        let collection = db.collection("messages");

        let result = await collection.insertOne({
          name: userName,
          message: message,
          time: new Date(),
        });

        if (result.acknowledged === true) {
          console.log("Message saved!");
        } else {
          console.log("Message not saved");
        }

        let messageId = result.insertedId;

        socket.broadcast.emit("receive", {
          message: message,
          name: userName,
          id: messageId,
        });

        // Send the message back to sender with ID for delete functionality
        socket.emit("message-sent", {
          message: message,
          id: messageId,
        });
      } catch (err) {
        console.log("Error saving message");
      }
    }
  });

  // DELETE operation - Delete specific message
  socket.on("delete-message", async (messageId) => {
    try {
      let db = await dbconnect();
      let collection = db.collection("messages");

      const ObjectId = require('mongodb').ObjectId;
      let result = await collection.deleteOne({ _id: new ObjectId(messageId) });

      if (result.deletedCount > 0) {
        console.log("Message deleted!");
        io.emit("message-deleted", { id: messageId });
      } else {
        console.log("Message not deleted");
      }
    } catch (err) {
      console.log("Error deleting message", err);
    }
  });

  //if someone leaves the chat, let others know
  socket.on("disconnect", () => {
    if (users[socket.id]) {
      socket.broadcast.emit("left", users[socket.id]);
      delete users[socket.id];
    }
  });
});