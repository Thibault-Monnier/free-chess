import { Bishop } from './pieces/bishop'
import { King } from './pieces/king'
import { Knight } from './pieces/knight'
import { Pawn } from './pieces/pawn'
import { Piece } from './pieces/piece'
import { Queen } from './pieces/queen'
import { Rook } from './pieces/rook'
import { fileRankToSquareNb } from './utils'

export class Board {
    public squares: (Piece | null)[]
    public canCastle: {
        white: { queenSide: boolean; kingSide: boolean }
        black: { queenSide: boolean; kingSide: boolean }
    } = {
        white: { queenSide: true, kingSide: true },
        black: { queenSide: true, kingSide: true },
    }

    constructor(board?: Board) {
        if (board) {
            this.squares = [...board.squares]
            this.canCastle = { white: { ...board.canCastle.white }, black: { ...board.canCastle.black } }
        } else {
            this.squares = new Array(64).fill(null)
            this.importFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR')
        }
    }

    // TODO: import canCastle
    public importFEN(fen: string) {
        const piecesId = { r: Rook, n: Knight, b: Bishop, q: Queen, k: King, p: Pawn }
        const placement = fen.split(' ')[0]

        placement.split('/').forEach((rowPlacement, index) => {
            const rank = 7 - index
            let file = 0
            for (let char of rowPlacement) {
                if (char > '8') {
                    const c = char.toLowerCase()
                    if (c !== 'r' && c !== 'n' && c !== 'b' && c !== 'q' && c !== 'k' && c !== 'p')
                        throw 'Invalid piece'

                    const Piece = piecesId[c]
                    this.squares[fileRankToSquareNb({ file, rank })] = new Piece(char === c ? 'black' : 'white')
                    file++
                } else {
                    let number = Number(char)
                    while (number > 0) {
                        this.squares[fileRankToSquareNb({ file, rank })] = null
                        number--
                        file++
                    }
                }
            }
        })
    }

    debug() {
        let debugBoard = []

        for (let rank = 0; rank < 8; rank++) {
            //@ts-ignore
            debugBoard[rank] = []
            for (let file = 0; file < 8; file++) {
                //@ts-ignore
                debugBoard[rank].push(this.squares[rank * 8 + file])
            }
        }

        console.log(debugBoard)
    }
}
