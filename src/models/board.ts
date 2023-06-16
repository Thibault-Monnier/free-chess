import { Bishop } from './pieces/bishop'
import { King } from './pieces/king'
import { Knight } from './pieces/knight'
import { Pawn } from './pieces/pawn'
import { Piece } from './pieces/piece'
import { Queen } from './pieces/queen'
import { Rook } from './pieces/rook'
import { PieceColor } from './types'

export class Board {
    squares: (Piece | null)[]

    constructor() {
        this.squares = []
        for (let i = 0; i < 64; i++) {
            this.squares.push(null)
        }
        this.startingSetup()
    }

    private startingSetup(): void {
        const color = (i: number): PieceColor => (i < 32 ? 'white' : 'black')

        for (let i of [0, 7, 56, 63]) this.squares[i] = new Rook(color(i))
        for (let i of [1, 6, 57, 62]) this.squares[i] = new Knight(color(i))
        for (let i of [2, 5, 58, 61]) this.squares[i] = new Bishop(color(i))
        for (let i of [3, 59]) this.squares[i] = new Queen(color(i))
        for (let i of [4, 60]) this.squares[i] = new King(color(i))
        for (let i of [
            8, 9, 10, 11, 12, 13, 14, 15, 48, 49, 50, 51, 52, 53, 54, 55,
        ])
            this.squares[i] = new Pawn(color(i))
    }

    debug() {
        let debugBoard = []

        for (let row = 0; row < 8; row++) {
            //@ts-ignore
            debugBoard[row] = []
            for (let column = 0; column < 8; column++) {
                //@ts-ignore
                debugBoard[row].push(this.squares[row * 8 + column])
            }
        }

        console.log(debugBoard)
    }
}
