import { Bishop } from "./pieces/bishop";
import { King } from "./pieces/king";
import { Knight } from "./pieces/knight";
import { Pawn } from "./pieces/pawn";
import { Queen } from "./pieces/queen";
import { Rook } from "./pieces/rook";

export type Piece = King | Queen | Rook | Bishop | Knight | Pawn
export type PieceColor = "white" | "black"
export type PieceName = "king" | "queen" | "rook" | "bishop" | "knight" | "pawn"