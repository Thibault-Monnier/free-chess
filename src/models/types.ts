export type PieceColor = 'white' | 'black'
export type PieceName = 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn'
export type fileRank = { file: number; rank: number }
export type Coordinate = `${'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h'}${
    | '1'
    | '2'
    | '3'
    | '4'
    | '5'
    | '6'
    | '7'
    | '8'}`
