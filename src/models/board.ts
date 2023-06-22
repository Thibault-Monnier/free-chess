import { Bishop } from './pieces/bishop'
import { King } from './pieces/king'
import { Knight } from './pieces/knight'
import { Pawn } from './pieces/pawn'
import { Piece } from './pieces/piece'
import { Queen } from './pieces/queen'
import { Rook } from './pieces/rook'
import { PieceColor } from './types'
import { columnRowToSquareNb } from './utils'

export class Board {
    squares: (Piece | null)[]

    constructor(board?: Board) {
        if (board) {
            this.squares = [...board.squares]
        } else {
            this.squares = new Array(64).fill(null)
            this.importFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR')
        }
    }

    public importFEN(fen: string) {
        const piecesId = { r: Rook, n: Knight, b: Bishop, q: Queen, k: King, p: Pawn }
        const placement = fen.split(' ')[0]

        placement.split('/').forEach((rowPlacement, index) => {
            const row = 7 - index
            let column = 0
            for (let char of rowPlacement) {
                if (char > '8') {
                    const c = char.toLowerCase()
                    if (c !== 'r' && c !== 'n' && c !== 'b' && c !== 'q' && c !== 'k' && c !== 'p')
                        throw 'Invalid piece'

                    const Piece = piecesId[c]
                    this.squares[columnRowToSquareNb({ column, row })] = new Piece(char === c ? 'black' : 'white')
                    column++
                } else {
                    let number = Number(char)
                    while (number > 0) {
                        this.squares[columnRowToSquareNb({ column, row })] = null
                        number--
                        column++
                    }
                }
            }
        })
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
