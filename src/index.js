const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const Filter = require("bad-words");
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages");
const {
  addUser,
  removeUser,
  getUsersInRoom,
  getUser,
} = require("./utils/users");

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

  socket.on("join", (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options });

    if (error) {
      return callback(error);
    }

    socket.join(user.room);
    socket.emit("message", generateMessage("Admin", "Welcome to the chat"));
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        generateMessage(`${user.username} has joined the room!`)
      );
    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });
    callback();
    //socket.event (sends event tp specific client), io.emit (sends event to every connected client), socket.broadcast.emit (sends event to every client except this one.) io.to.emit(sends an event to specific rooms) socket.broadcast.to.emit(sends event to all clients except this specific client in a specific chatroom. )
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);

    const filter = new Filter();

    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed!");
    }

    io.to(user.room).emit("message", generateMessage(user.username, message));
    callback();
  });
  socket.on("sendLocation", (coords, acknowledged) => {
    const user = getUser(socket.id);
    io.to(user.room).emit(
      "LocationMessage",
      generateLocationMessage(
        user.username,
        `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
      )
    );
    acknowledged();
  });
  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage("Admin", `${user.username} has left the room!`)
      );
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

server.listen(port, () => {
  console.log(`Express server started at ${port}`);
});
