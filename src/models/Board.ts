import { Move } from './Move'
import { Bishop } from './pieces/Bishop'
import { King } from './pieces/King'
import { Knight } from './pieces/Knight'
import { Pawn } from './pieces/Pawn'
import { Piece } from './pieces/Piece'
import { Queen } from './pieces/Queen'
import { Rook } from './pieces/Rook'
import { CanCastle, Coordinates, EndOfGame, AttackTable, PieceColor } from './types'
import {
    coordinatesToSquareNb,
    createEmptyAttackTable,
    fileRankToSquareNb,
    invertColor,
    squareNbToCoordinates,
} from './utils'

export class Board {
    static startBoardFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 0'

    squares: (Piece | null)[]
    colorToMove: PieceColor = 'white'
    canCastle: CanCastle = {
        white: { queenSide: false, kingSide: false },
        black: { queenSide: false, kingSide: false },
    }
    enPassantTargetSquareNb: number | null = null

    // Test if constructor can be called in each of the following ways
    constructor()
    constructor(board: Board, options?: { switchColor: boolean; resetEnPassant: boolean })
    constructor(FEN: string)

    constructor(boardOrFEN?: Board | string, options?: { switchColor: boolean; resetEnPassant: boolean }) {
        if (typeof boardOrFEN === 'string') {
            this.squares = new Array(64).fill(null)
            this.importFEN(boardOrFEN)
        } else if (boardOrFEN) {
            const board = boardOrFEN
            this.squares = board.squares.slice()
            this.colorToMove = options?.switchColor ? invertColor(board.colorToMove) : board.colorToMove
            this.canCastle = { white: { ...board.canCastle.white }, black: { ...board.canCastle.black } }
            this.enPassantTargetSquareNb = options?.resetEnPassant ? null : board.enPassantTargetSquareNb
        } else {
            this.squares = new Array(64).fill(null)
            this.importFEN(Board.startBoardFEN)
        }
    }

    serialize(): string {
        return this.exportFEN()
    }

    importFEN(FEN: string) {
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

    exportFEN(): string {
        const piecesId = { r: Rook, n: Knight, b: Bishop, q: Queen, k: King, p: Pawn }

        let FEN = ''
        for (let rank = 7; rank >= 0; rank--) {
            let emptySquares = 0
            for (let file = 0; file < 8; file++) {
                const piece = this.squares[fileRankToSquareNb({ file, rank })]
                if (piece) {
                    if (emptySquares > 0) {
                        FEN += emptySquares
                        emptySquares = 0
                    }
                    const pieceId = Object.entries(piecesId).find(([_, Piece]) => piece instanceof Piece)?.[0]
                    FEN += piece.color === 'white' ? pieceId!.toUpperCase() : pieceId
                } else {
                    emptySquares++
                }
            }
            if (emptySquares > 0) FEN += emptySquares
            if (rank > 0) FEN += '/'
        }

        FEN += ` ${this.colorToMove === 'white' ? 'w' : 'b'} `

        const castlingOptions = [
            this.canCastle.white.kingSide ? 'K' : '',
            this.canCastle.white.queenSide ? 'Q' : '',
            this.canCastle.black.kingSide ? 'k' : '',
            this.canCastle.black.queenSide ? 'q' : '',
        ].join('')
        FEN += castlingOptions || '-'

        FEN += ` ${this.enPassantTargetSquareNb ? squareNbToCoordinates(this.enPassantTargetSquareNb) : '-'}`
        FEN += ` ${0} ${0}`
        return FEN
    }

    possibleMoves(): Move[] {
        const opponentAttackTable = this.createOpponentAttackTable()
        let moves: Move[] = []
        for (let squareNb = 0; squareNb < 64; squareNb++) {
            const piece = this.squares[squareNb]
            if (piece && piece.color === this.colorToMove) {
                moves.push(...piece.possibleMoves(squareNb, this, opponentAttackTable))
            }
        }
        return moves
    }

    endOfGame(possibleMoves = this.possibleMoves()): EndOfGame | null {
        if (possibleMoves.length === 0) {
            return this.isInCheck() ? 'checkmate' : 'stalemate'
        } else return null
    }

    isInCheck(opponentAttackTable = this.createOpponentAttackTable()): boolean {
        const kingSquareNb = this.squares.findIndex(
            (piece) => piece?.name === 'king' && piece.color === this.colorToMove
        )
        return opponentAttackTable.attackedSquares[kingSquareNb]
    }

    createOpponentAttackTable(): AttackTable {
        const table: AttackTable = createEmptyAttackTable()

        for (let squareNb = 0; squareNb < 64; squareNb++) {
            const piece = this.squares[squareNb]
            if (piece && piece.color !== this.colorToMove) {
                piece.updateAttackTable(squareNb, this, table)
            }
        }

        return table
    }
}
