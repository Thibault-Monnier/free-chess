import { Bishop } from './pieces/bishop'
import { King } from './pieces/king'
import { Knight } from './pieces/knight'
import { Pawn } from './pieces/pawn'
import { Piece } from './pieces/piece'
import { Queen } from './pieces/queen'
import { Rook } from './pieces/rook'
import { Coordinates, PieceColor } from './types'
import { coordinatesToSquareNb, fileRankToSquareNb } from './utils'

export class Board {
    public squares: (Piece | null)[]
    public colorToMove: PieceColor = 'white'
    public canCastle: {
        white: { queenSide: boolean; kingSide: boolean }
        black: { queenSide: boolean; kingSide: boolean }
    } = {
        white: { queenSide: false, kingSide: false },
        black: { queenSide: false, kingSide: false },
    }
    public enPassantTargetSquareNb: number | null = null

    constructor(board?: Board, options?: { switchColor: boolean; resetEnPassant: boolean }) {
        if (board) {
            this.squares = [...board.squares]
            if (options?.switchColor) {
                this.colorToMove = board.colorToMove === 'white' ? 'black' : 'white'
            } else {
                this.colorToMove = board.colorToMove
            }
            this.canCastle = { white: { ...board.canCastle.white }, black: { ...board.canCastle.black } }
            this.enPassantTargetSquareNb = options?.resetEnPassant ? null : board.enPassantTargetSquareNb
        } else {
            this.squares = new Array(64).fill(null)
            this.importFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
        }
    }

    // TODO: import canCastle
    public importFEN(fen: string) {
        const piecesId = { r: Rook, n: Knight, b: Bishop, q: Queen, k: King, p: Pawn }
        const [placement, colorToMove, canCastle, enPassantTargetSquare] = fen.split(' ')

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

        this.colorToMove = colorToMove === 'w' ? 'white' : 'black'

        if (canCastle.includes('K')) this.canCastle.white.kingSide = true
        if (canCastle.includes('Q')) this.canCastle.white.queenSide = true
        if (canCastle.includes('k')) this.canCastle.black.kingSide = true
        if (canCastle.includes('q')) this.canCastle.black.queenSide = true

        this.enPassantTargetSquareNb =
            enPassantTargetSquare === '-' ? null : coordinatesToSquareNb(enPassantTargetSquare as Coordinates)
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
