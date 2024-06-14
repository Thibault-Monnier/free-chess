import { Move } from './move'

export type PieceColor = 'white' | 'black'
export type PieceName = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'
export type PieceLetter = 'K' | 'Q' | 'R' | 'B' | 'N' | ''
export type FileRank = { file: number; rank: number }
export type Coordinates = `${'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h'}${
    | '1'
    | '2'
    | '3'
    | '4'
    | '5'
    | '6'
    | '7'
    | '8'}`
export type CanCastle = {
    white: { queenSide: boolean; kingSide: boolean }
    black: { queenSide: boolean; kingSide: boolean }
}
export type EndOfGame = 'checkmate' | 'stalemate'
export type AttackTable = {
    attackedSquares: Bitboard
    pinnedPieces: Array<PinnedPiece>
    kingAttackers: Array<number>
}
export type PinnedPiece = { squareNb: number; offset: FileRank }
export type Bitboard = boolean[]
export type MoveType = 'normal' | 'capture' | 'longCastle' | 'shortCastle' | 'promotion' | 'capturePromotion'
export type PlayMode = '1v1' | '1vC' | 'CvC'
