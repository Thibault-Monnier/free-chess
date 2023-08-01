import { Board } from '../board'
import { PieceSquareTableEvaluator } from '../evaluators/pieceSquareTableEvaluator'
import { Move } from '../move'
import { BestMove } from '../types'
import { Bot } from './bot'

export class DepthNBot extends Bot {
    private nbMinimax = 0

    private perfNbEvals = 0
    private perfTimeEvals = 0

    private perfNbPossibleMoves = 0
    private perfTimePossibleMoves = 0

    run(): BestMove | null {
        this.nbMinimax = 0
        const startTimestamp = performance.now()

        const moves = this.board.possibleMoves()
        const colorMultiplier = this.board.colorToMove === 'white' ? 1 : -1

        let bestMove: Move | null = null
        let bestEvaluation = -Infinity
        for (let move of moves) {
            const evaluation = this.minimax(move.endBoard, this.depth! - 1, -Infinity, Infinity) * colorMultiplier

            if (evaluation > bestEvaluation) {
                bestMove = move
                bestEvaluation = evaluation
            }
        }
        bestEvaluation *= colorMultiplier

        const endTimestamp = performance.now()
        console.log(
            'Time:',
            Math.round(endTimestamp - startTimestamp),
            'ms' + ' - Minimax calls:',
            this.nbMinimax,
            ' - Avg time per minimax (microsecs):',
            ((endTimestamp - startTimestamp) / this.nbMinimax) * 1000,
        )
        console.log(
            'Avg time evals (microsecs):',
            (this.perfTimeEvals / this.perfNbEvals) * 1000,
            'Avg time possible moves (microsecs):',
            (this.perfTimePossibleMoves / this.perfNbPossibleMoves) * 1000
        )

        return bestMove ? { move: bestMove, evaluation: bestEvaluation } : null
    }

    private minimax(board: Board, depth: number, alpha: number, beta: number): number {
        this.nbMinimax++

        if (depth === 0) {
            const startTimestamp = performance.now()
            const evaluation = new PieceSquareTableEvaluator(board).run()
            const endTimestamp = performance.now()
            this.perfNbEvals++
            this.perfTimeEvals += endTimestamp - startTimestamp
            return evaluation
        }

        if (board.endOfGame === 'checkmate') {
            return board.colorToMove === 'white' ? -Infinity : Infinity
        } else if (board.endOfGame === 'stalemate') {
            return 0
        }

        const startTimestamp = performance.now()
        const moves = board.possibleMoves()
        const endTimestamp = performance.now()
        this.perfNbPossibleMoves++
        this.perfTimePossibleMoves += endTimestamp - startTimestamp

        if (board.colorToMove === 'white') {
            let bestEvaluation = -Infinity
            for (let move of moves) {
                const evaluation = this.minimax(move.endBoard, depth - 1, alpha, beta)
                bestEvaluation = Math.max(bestEvaluation, evaluation)
                alpha = Math.max(alpha, evaluation)
                if (beta <= alpha) break
            }
            return bestEvaluation
        } else {
            let bestEvaluation = Infinity
            for (let move of moves) {
                const evaluation = this.minimax(move.endBoard, depth - 1, alpha, beta)
                bestEvaluation = Math.min(bestEvaluation, evaluation)
                beta = Math.min(beta, evaluation)
                if (beta <= alpha) break
            }
            return bestEvaluation
        }
    }
}
