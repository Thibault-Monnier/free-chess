import { Move } from './move'
import { Bishop } from './pieces/bishop'
import { King } from './pieces/king'
import { Knight } from './pieces/knight'
import { Pawn } from './pieces/pawn'
import { Piece } from './pieces/piece'
import { Queen } from './pieces/queen'
import { Rook } from './pieces/rook'
import { CanCastle, Coordinates, EndOfGame, AttackTable, PieceColor } from './types'
import { coordinatesToSquareNb, createEmptyAttackTable, fileRankToSquareNb, invertColor } from './utils'

export class Board {
    public static startBoardFEN = 'k6K/8/8/8/8/8/7p/6R1 b - - 0 0'

    public squares: (Piece | null)[]
    public colorToMove: PieceColor = 'white'
    public canCastle: CanCastle = {
        white: { queenSide: false, kingSide: false },
        black: { queenSide: false, kingSide: false },
    }
    public enPassantTargetSquareNb: number | null = null

    //Test if constructor can be called in each of the following ways
    constructor()
    constructor(board: Board, options?: { switchColor: boolean; resetEnPassant: boolean })
    constructor(FEN: string)

    constructor(boardOrFEN?: Board | string, options?: { switchColor: boolean; resetEnPassant: boolean }) {
        if (typeof boardOrFEN === 'string') {
            this.squares = new Array(64).fill(null)
            this.importFEN(boardOrFEN)
        } else if (boardOrFEN) {
            const board = boardOrFEN
            this.squares = [...board.squares]
            this.colorToMove = options?.switchColor ? invertColor(board.colorToMove) : board.colorToMove
            this.canCastle = { white: { ...board.canCastle.white }, black: { ...board.canCastle.black } }
            this.enPassantTargetSquareNb = options?.resetEnPassant ? null : board.enPassantTargetSquareNb
        } else {
            this.squares = new Array(64).fill(null)
            this.importFEN(Board.startBoardFEN)
        }
    }

    public importFEN(FEN: string) {
        const piecesId = { r: Rook, n: Knight, b: Bishop, q: Queen, k: King, p: Pawn }
        const [placement, colorToMove, canCastle, enPassantTargetSquare] = FEN.split(' ')

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
        const opponentAttackTable = this.createOpponentAttackTable()
        let moves: Move[] = []
        this.squares.forEach((piece, squareNb) => {
            if (piece && piece.color === this.colorToMove) {
                moves = [...moves, ...piece.possibleMoves(squareNb, this, opponentAttackTable)]
            }
        })
        return moves
    }

    get endOfGame(): EndOfGame | null {
        if (this.possibleMoves().length === 0) {
            return this.isInCheck() ? 'checkmate' : 'stalemate'
        } else return null
    }

    public isInCheck(opponentAttackTable = this.createOpponentAttackTable()): boolean {
        const kingSquareNb = this.squares.findIndex(
            (piece) => piece?.name === 'king' && piece.color === this.colorToMove
        )
        return opponentAttackTable.attackedSquares[kingSquareNb]
    }

    public createOpponentAttackTable(): AttackTable {
        const table: AttackTable = createEmptyAttackTable()

        for (let squareNb = 0; squareNb < 64; squareNb++) {
            const piece = this.squares[squareNb]
            if (piece && piece.color !== this.colorToMove) {
                piece.updateAttackTable(squareNb, this, table)
            }
        }

        return table
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
