import { BestMove } from '../BestMove'
import { Board } from '../Board'
import { Move } from '../Move'
import { Evaluator } from './evaluator/Evaluator'

export class Bot {
    private checkmateScore = 999999999

    // The following properties are only used for performance analysis
    nbMinimax = 0
    perfTotalTime = 0
    perfNbEvals = 0
    perfTimeEvals = 0
    perfNbPossibleMoves = 0
    perfTimePossibleMoves = 0

    constructor(public board: Board, public depth: number) {}

    run(): { bestMove: BestMove; bestLine: Move[] } | null {
        this.nbMinimax = 0

        const startTimestamp = performance.now()
        const result = this.minimax(this.board, this.depth, -this.checkmateScore, this.checkmateScore)
        const endTimestamp = performance.now()
        this.perfTotalTime = endTimestamp - startTimestamp

        const bestEvaluation = result.evaluation
        if (result.moves) {
            return {
                bestMove: new BestMove(result.moves[0], bestEvaluation),
                bestLine: result.moves,
            }
        }
        return null
    }

    private minimax(
        board: Board,
        remainingDepth: number,
        alpha: number,
        beta: number
    ): { evaluation: number; moves: Move[] | null } {
        this.nbMinimax++

        if (remainingDepth === 0) {
            //const startTimestamp = performance.now()
            const evaluation = new Evaluator(board).run()
            //const endTimestamp = performance.now()
            //this.perfTimeEvals += endTimestamp - startTimestamp
            this.perfNbEvals++
            return { evaluation, moves: null }
        }

        //const startTimestamp = performance.now()
        const moves = board.possibleMoves()
        this.perfNbPossibleMoves++
        //const endTimestamp = performance.now()
        //this.perfTimePossibleMoves += endTimestamp - startTimestamp

        const endOfGame = board.endOfGame(moves)
        if (endOfGame === 'checkmate') {
            const evaluation =
                (this.checkmateScore - (this.depth - remainingDepth - 1)) * (board.colorToMove === 'white' ? -1 : 1)
            return { evaluation, moves: null }
        } else if (endOfGame === 'stalemate') {
            return { evaluation: 0, moves: null }
        }

        if (board.colorToMove === 'white') {
            let bestEvaluation = -Infinity
            let bestMove: Move | null = null
            let bestMoves: Move[] = []
            for (let move of moves) {
                const result = this.minimax(move.endBoard, remainingDepth - 1, alpha, beta)
                if (result.evaluation > bestEvaluation) {
                    bestEvaluation = result.evaluation
                    bestMove = move
                    bestMoves = result.moves || []
                    bestMoves.unshift(move)
                }
                alpha = Math.max(alpha, result.evaluation)
                if (beta <= alpha) break
            }
            return {
                evaluation: bestEvaluation,
                moves: bestMove ? bestMoves : null,
            }
        } else {
            let bestEvaluation = Infinity
            let bestMove: Move | null = null
            let bestMoves: Move[] = []
            for (let move of moves) {
                const result = this.minimax(move.endBoard, remainingDepth - 1, alpha, beta)
                if (result.evaluation < bestEvaluation) {
                    bestEvaluation = result.evaluation
                    bestMove = move
                    bestMoves = result.moves || []
                    bestMoves.unshift(move)
                }
                beta = Math.min(beta, result.evaluation)
                if (beta <= alpha) break
            }
            return {
                evaluation: bestEvaluation,
                moves: bestMove ? bestMoves : null,
            }
        }
    }
}
