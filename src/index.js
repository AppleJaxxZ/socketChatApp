const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const Filter = require("bad-words");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;

const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));

//server (emit) ==> client (receiver) - countUpdated
//client (emit) ==> server (receiver) - increment
//On listens for a specific call name.
//Emit send out a call name for the other to listen for.

//starts a new socket conection from the Server Side.
// 'connection and disconnect are bot built in and dont need to be emitted.
//calling the socket argument sends to the current connected sockets, io sends to everyone.
io.on("connection", (socket) => {
  console.log("new websocket connection");

  socket.emit("message", "Welcome To The Chat!");
  socket.broadcast.emit("message", "A new user has joined the chat");

  socket.on("sendMessage", (message, callback) => {
    const filter = new Filter();

    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed!");
    }

    io.emit("message", message);
    callback();
  });
  socket.on("sendLocation", (coords, acknowledged) => {
    io.emit(
      "message",
      `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
    );
    acknowledged();
  });
  socket.on("disconnect", () => {
    io.emit("message", "A user has left the chat.");
  });
});

server.listen(port, () => {
  console.log(`Express server started at ${port}`);
});
