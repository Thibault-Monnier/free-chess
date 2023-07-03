export type PieceColor = 'white' | 'black'
export type PieceName = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'
export type pieceLetter = 'K' | 'Q' | 'R' | 'B' | 'N' | ''
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
