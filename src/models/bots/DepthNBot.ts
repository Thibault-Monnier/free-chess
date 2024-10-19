import { BestMove } from '../BestMove'
import { Board } from '../Board'
import { Move } from '../Move'
import { Bot } from './Bot'
import { Evaluator } from './evaluator/Evaluator'

export class DepthNBot extends Bot {
    private checkmateScore = 999999999

    // The following properties are only used for performance analysis
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
            const evaluation =
                this.minimax(move.endBoard, this.depth! - 1, -this.checkmateScore, this.checkmateScore) *
                colorMultiplier

            if (evaluation >= bestEvaluation) {
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
            ((endTimestamp - startTimestamp) / this.nbMinimax) * 1000
        )
        console.log(
            'Avg time evals (microsecs):',
            (this.perfTimeEvals / this.perfNbEvals) * 1000,
            'Avg time possible moves (microsecs):',
            (this.perfTimePossibleMoves / this.perfNbPossibleMoves) * 1000
        )

        console.log('Best move:', bestMove, 'Evaluation:', bestEvaluation)
        return bestMove ? new BestMove(bestMove, bestEvaluation) : null
    }

    private minimax(board: Board, remainingDepth: number, alpha: number, beta: number): number {
        this.nbMinimax++

        if (remainingDepth === 0) {
            //const startTimestamp = performance.now()
            const evaluation = new Evaluator(board).run()
            //const endTimestamp = performance.now()
            //this.perfTimeEvals += endTimestamp - startTimestamp
            this.perfNbEvals++
            return evaluation
        }

        //const startTimestamp = performance.now()
        const moves = board.possibleMoves()
        this.perfNbPossibleMoves++
        //const endTimestamp = performance.now()
        //this.perfTimePossibleMoves += endTimestamp - startTimestamp

        if (board.endOfGame(moves) === 'checkmate') {
            return board.colorToMove === 'white'
                ? -this.checkmateScore - remainingDepth
                : this.checkmateScore + remainingDepth
        } else if (board.endOfGame(moves) === 'stalemate') {
            return 0
        }

        if (board.colorToMove === 'white') {
            let bestEvaluation = -Infinity
            for (let move of moves) {
                const evaluation = this.minimax(move.endBoard, remainingDepth - 1, alpha, beta)
                bestEvaluation = Math.max(bestEvaluation, evaluation)
                alpha = Math.max(alpha, evaluation)
                if (beta <= alpha) break
            }
            return bestEvaluation
        } else {
            let bestEvaluation = Infinity
            for (let move of moves) {
                const evaluation = this.minimax(move.endBoard, remainingDepth - 1, alpha, beta)
                bestEvaluation = Math.min(bestEvaluation, evaluation)
                beta = Math.min(beta, evaluation)
                if (beta <= alpha) break
            }
            return bestEvaluation
        }
    }
}
