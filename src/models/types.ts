export type PieceColor = 'white' | 'black'
export type PieceName = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'
export type PieceLetter = 'K' | 'Q' | 'R' | 'B' | 'N' | ''
export type fileRank = { file: number; rank: number }
export type Coordinates = `${'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h'}${
    | '1'
    | '2'
    | '3'
    | '4'
    | '5'
    | '6'
    | '7'
    | '8'}`
export type PossibleMoveOptions = { skipCheckVerification?: boolean }
export type CanCastle = {
    white: { queenSide: boolean; kingSide: boolean }
    black: { queenSide: boolean; kingSide: boolean }
}
