import { Move } from './move'
import { Bishop } from './pieces/bishop'
import { King } from './pieces/king'
import { Knight } from './pieces/knight'
import { Pawn } from './pieces/pawn'
import { Piece } from './pieces/piece'
import { Queen } from './pieces/queen'
import { Rook } from './pieces/rook'
import { CanCastle, Coordinates, EndOfGame, PieceColor } from './types'
import { coordinatesToSquareNb, fileRankToSquareNb, invertColor } from './utils'

export class Board {
    public squares: (Piece | null)[]
    public colorToMove: PieceColor = 'white'
    public canCastle: CanCastle = {
        white: { queenSide: false, kingSide: false },
        black: { queenSide: false, kingSide: false },
    }
    public enPassantTargetSquareNb: number | null = null

    constructor(board?: Board, options?: { switchColor: boolean; resetEnPassant: boolean }) {
        if (board) {
            this.squares = [...board.squares]
            this.colorToMove = options?.switchColor ? invertColor(board.colorToMove) : board.colorToMove
            this.canCastle = { white: { ...board.canCastle.white }, black: { ...board.canCastle.black } }
            this.enPassantTargetSquareNb = options?.resetEnPassant ? null : board.enPassantTargetSquareNb
        } else {
            this.squares = new Array(64).fill(null)
            this.importFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 0')
        }
    }

    public importFEN(fen: string) {
        const piecesId = { r: Rook, n: Knight, b: Bishop, q: Queen, k: King, p: Pawn }
        const [placement, colorToMove, canCastle, enPassantTargetSquare] = fen.split(' ')

        this.squares = new Array(64).fill(null)
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

        this.canCastle.white.kingSide = canCastle.includes('K')
        this.canCastle.white.queenSide = canCastle.includes('Q')
        this.canCastle.black.kingSide = canCastle.includes('k')
        this.canCastle.black.queenSide = canCastle.includes('q')

        this.enPassantTargetSquareNb =
            enPassantTargetSquare === '-' ? null : coordinatesToSquareNb(enPassantTargetSquare as Coordinates)
    }

    public possibleMoves(): Move[] {
        let moves: Move[] = []
        this.squares.forEach((piece, squareNb) => {
            if (piece && piece.color === this.colorToMove) {
                moves = [...moves, ...piece.possibleMoves(squareNb, this, {})]
            }
        })
        return moves
    }

    get endOfGame(): EndOfGame | null {
        if (this.possibleMoves().length === 0) {
            return this.isInCheck() ? 'checkmate' : 'stalemate'
        } else return null
    }

    public isInCheck(kingColor = this.colorToMove): boolean {
        const kingSquareNb = this.squares.findIndex((piece) => piece?.name === 'king' && piece.color === kingColor)
        return this.areSquaresAttacked(invertColor(kingColor), kingSquareNb)
    }

    // Worst possible code in terms of optimization, change when optimizing
    public areSquaresAttacked(attackingColor: PieceColor, ...targetSquareNbs: number[]): boolean {
        for (let squareNb = 0; squareNb < 64; squareNb++) {
            const piece = this.squares[squareNb]
            if (piece?.color === attackingColor) {
                const moves = piece.possibleMoves(squareNb, this, { skipCheckVerification: true })
                if (moves.some((move) => targetSquareNbs.includes(move.endSquareNb))) return true
            }
        }
        return false
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
