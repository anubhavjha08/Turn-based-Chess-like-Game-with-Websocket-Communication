const socket = io();
const boardElement = document.querySelector(".chessboard");
const messagesElement = document.getElementById("messages");
const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const board = [
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

// Function to render the chessboard
const renderBoard = () => {
  boardElement.innerHTML = "";

  if (playerRole === 2) {
    boardElement.classList.add("rotate-board");
  } else {
    boardElement.classList.remove("rotate-board");
  }

  board.forEach((row, rowIndex) => {
    row.forEach((square, colIndex) => {
      const squareElement = document.createElement("div");
      squareElement.classList.add(
        "square",
        (rowIndex + colIndex) % 2 === 0 ? "light" : "dark"
      );

      squareElement.dataset.row = rowIndex;
      squareElement.dataset.col = colIndex;

      if (square) {
        const pieceElement = document.createElement("div");
        pieceElement.classList.add(
          "piece",
          square.player === 1 ? "player1" : "player2",
          square.type.toLowerCase()
        );
        pieceElement.innerText = getPieceUnicode(square);
        pieceElement.draggable = playerRole === square.player;

        pieceElement.addEventListener("dragstart", (e) => {
          draggedPiece = pieceElement;
          sourceSquare = { row: rowIndex, col: colIndex };
          e.dataTransfer.setData("text/plain", "");
        });

        pieceElement.addEventListener("dragend", () => {
          draggedPiece = null;
          sourceSquare = null;
        });

        squareElement.appendChild(pieceElement);
      }

      squareElement.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      squareElement.addEventListener("drop", (e) => {
        e.preventDefault();
        const destRow = parseInt(e.target.dataset.row);
        const destCol = parseInt(e.target.dataset.col);

        if (isValidMove(sourceSquare, { row: destRow, col: destCol })) {
          // Update the board array
          board[destRow][destCol] = board[sourceSquare.row][sourceSquare.col];
          board[sourceSquare.row][sourceSquare.col] = null;
          renderBoard();
        }

        draggedPiece = null;
        sourceSquare = null;
      });

      boardElement.appendChild(squareElement);
    });
  });

  document.querySelectorAll(".piece").forEach((piece) => {
    if (playerRole === 2) {
      piece.classList.add("rotate-piece");
    } else {
      piece.classList.remove("rotate-piece");
    }
  });
};

// Event listener for sending messages
messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = messageInput.value;
  if (message.trim()) {
    socket.emit("chatMessage", message);
    messageInput.value = "";
  }
});

// Receive and display chat messages
socket.on("chatMessage", (message) => {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message");
  messageElement.textContent = message;
  messagesElement.appendChild(messageElement);
  messagesElement.scrollTop = messagesElement.scrollHeight;
});

// Character movement logic
const isValidMove = (source, destination) => {
  const piece = board[source.row][source.col];
  const target = board[destination.row][destination.col];

  const rowDiff = Math.abs(destination.row - source.row);
  const colDiff = Math.abs(destination.col - source.col);

  switch (piece.type) {
    case "Pawn":
      return (
        rowDiff <= 1 &&
        colDiff <= 1 &&
        (!target || target.player !== piece.player)
      );
    case "Hero1":
      return (
        (rowDiff === 2 && colDiff === 0) ||
        (rowDiff === 0 &&
          colDiff === 2 &&
          (!target || target.player !== piece.player))
      );
    case "Hero2":
      return (
        rowDiff === 2 &&
        colDiff === 2 &&
        (!target || target.player !== piece.player)
      );
    default:
      return false;
  }
};

// Function to get the Unicode representation of a custom game piece
const getPieceUnicode = (piece) => {
  const unicodePieces = {
    Pawn1: {
      1: "\u2659", // Unicode for Pawn
      2: "\u2659", // Unicode for Pawn (Player 2 color)
    },
    Pawn2: {
      1: "\u2659", // Unicode for Pawn
      2: "\u2659", // Unicode for Pawn (Player 2 color)
    },
    Pawn3: {
      1: "\u2659", // Unicode for Pawn
      2: "\u2659", // Unicode for Pawn (Player 2 color)
    },
    Hero1: {
      1: "\u2654", // Unicode for Hero
      2: "\u2654", // Unicode for Hero (Player 2 color)
    },
    Hero2: {
      1: "\u2655", // Unicode for Hero
      2: "\u2655", // Unicode for Hero (Player 2 color)
    },
  };

  return unicodePieces[piece.type][piece.player] || "";
};


socket.on("playerRole", (role) => {
  playerRole = role;
  renderBoard();
});

socket.on("spectatorRole", () => {
  playerRole = null;
  renderBoard();
});

socket.on("boardState", (state) => {
  board = state;
  renderBoard();
});

renderBoard();
