import { Board } from './board'
import { Move } from './move'
import { squareNbToCoordinates, squareNbToFileRank } from './utils'

export class Game {
    private startingBoard: Board
    private _moves: Move[] = []
    private _moveNb: number = 0

    constructor(FEN?: string) {
        this.startingBoard = FEN ? new Board(FEN) : new Board()
    }

    get moves(): Move[] {
        return this._moves
    }

    get moveNb(): number {
        return this._moveNb
    }

    get currentBoard(): Board {
        if (this._moveNb > 0) {
            return this._moves[this._moveNb - 1].endBoard
        } else {
            return this.startingBoard
        }
    }

    get lastMove(): Move | undefined {
        return this._moves[this.getLastMoveIndex()]
    }

    addMove(move: Move): void {
        this._moves = this._moves.slice(0, this._moveNb)
        this._moves.push(move)
        this._moveNb++

        console.log(this.calculateMoveNotation())
    }

    private getLastMoveIndex(): number {
        return this.moves.length - 1
    }

    jumpToMove(moveNb: number) {
        this._moveNb = moveNb
    }

    get canUndo(): boolean {
        return this._moveNb > 0
    }

    undo(): void {
        if (this.canUndo) this._moveNb--
    }

    get canRedo(): boolean {
        return this._moveNb < this._moves.length
    }

    redo(): void {
        if (this.canRedo) this._moveNb++
    }

    public calculateMoveNotation(moveIndex = this.getLastMoveIndex()): string {
        let notation: string = ''

        const move = this._moves[moveIndex]
        const piece = move.piece
        const endBoard = move.endBoard

        // Add the piece symbol / pawn file
        if (move.type === 'shortCastle') {
            notation += 'O-O'
        } else if (move.type === 'longCastle') {
            notation += 'O-O-O'
        } else {
            if (piece.name === 'pawn' && (move.type === 'capture' || move.type === 'capturePromotion')) {
                // The pawn file is added only if it is a capture
                notation += squareNbToCoordinates(move.startSquareNb)[0]
            } else {
                notation += piece.notationChar
            }
        }

        // Add the start square coordinates if there are ambiguities
        // There can't be ambiguities for pawns because in case of a capture the column is already specified
        if (piece.name !== 'pawn') {
            const ambiguousStartSquareNbs: number[] = []
            const boardBeforeMove = moveIndex > 0 ? this._moves[moveIndex - 1].endBoard : this.startingBoard
            boardBeforeMove.possibleMoves().forEach((testedMove) => {
                if (
                    testedMove.piece.name === piece.name &&
                    testedMove.endSquareNb === move.endSquareNb &&
                    testedMove.startSquareNb !== move.startSquareNb
                ) {
                    ambiguousStartSquareNbs.push(testedMove.startSquareNb)
                }
            })

            if (ambiguousStartSquareNbs.length > 0) {
                const files = ambiguousStartSquareNbs.map((squareNb) => squareNbToFileRank(squareNb).file)
                const ranks = ambiguousStartSquareNbs.map((squareNb) => squareNbToFileRank(squareNb).rank)

                const { file, rank } = squareNbToFileRank(move.startSquareNb)
                const coordinates = squareNbToCoordinates(move.startSquareNb)

                if (!files.some((theFile) => file === theFile)) {
                    notation += coordinates[0]
                } else if (!ranks.some((theRank) => rank === theRank)) {
                    notation += coordinates[1]
                } else {
                    notation += coordinates
                }
            }
        }

        // Add the capture symbol if it is a capture
        if (move.type === 'capture' || move.type === 'capturePromotion') {
            notation += 'x'
        }

        // Add the end square coordinates
        if (move.type !== 'shortCastle' && move.type !== 'longCastle') {
            const endSquareCoordinates = squareNbToCoordinates(move.endSquareNb)
            notation += endSquareCoordinates
        }

        // Add the promotion symbol if it is a promotion
        if (move.type === 'promotion' || move.type === 'capturePromotion') {
            notation += '=' + endBoard.squares[move.endSquareNb]!.notationChar
        }

        // Add the check / checkmate / stalemate symbol
        if (endBoard.endOfGame === 'checkmate') {
            notation += '#'
        } else if (endBoard.isInCheck()) {
            notation += '+'
        } else if (endBoard.endOfGame === 'stalemate') {
            notation += '½'
        }

        return notation
    }
}
