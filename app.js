const express = require("express");
const socket = require("socket.io");
const http = require("http");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socket(server);

let players = {};
let currentPlayer = "a";
let board = [
  [
    { type: "Pawn1", player: 1 },
    { type: "Pawn2", player: 1 },
    { type: "Pawn3", player: 1 },
    { type: "Hero1", player: 1 },
    { type: "Hero2", player: 1 },
  ],
  [null, null, null, null, null],
  [null, null, null, null, null],
  [null, null, null, null, null],
  [
    { type: "Pawn1", player: 2 },
    { type: "Pawn2", player: 2 },
    { type: "Pawn3", player: 2 },
    { type: "Hero1", player: 2 },
    { type: "Hero2", player: 2 },
  ],
];

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index", { title: "Custom Chess Game" });
});

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  if (Object.keys(players).length < 2) {
    const playerRole = Object.keys(players).length === 0 ? 1 : 2;
    players[socket.id] = playerRole;
    socket.emit("playerRole", playerRole);
  } else {
    socket.emit("spectatorRole");
  }

  // Handle chat messages
  socket.on("chatMessage", (message) => {
    io.emit("chatMessage", message);
  });

  socket.on("move", (move) => {
    // Validate and apply the move
    const { from, to } = move;
    const sourcePiece = board[from.row][from.col];
    if (isValidMove(sourcePiece, from, to)) {
      board[to.row][to.col] = sourcePiece;
      board[from.row][from.col] = null;
      io.emit("boardState", board);
    }
  });

  socket.on("disconnect", () => {
    delete players[socket.id];
    console.log("Player disconnected:", socket.id);
  });
});

const isValidMove = (piece, from, to) => {
  const rowDiff = Math.abs(to.row - from.row);
  const colDiff = Math.abs(to.col - from.col);

  switch (piece.type) {
    case "Pawn":
      return rowDiff <= 1 && colDiff <= 1;
    case "Hero1":
      return (
        (rowDiff === 2 && colDiff === 0) || (rowDiff === 0 && colDiff === 2)
      );
    case "Hero2":
      return rowDiff === 2 && colDiff === 2;
    default:
      return false;
  }
};

server.listen(3000, () => {
  console.log("Server listening on port 3000");
});
