import { logWithTimestamp } from '../../utils'
import { Board } from '../board'
import { PieceSquareTableEvaluator } from '../evaluators/pieceSquareTableEvaluator'
import { Move } from '../move'
import { Bot } from './bot'

export class DepthNBot extends Bot {
    run(): Move | null {
        logWithTimestamp('DepthNBot start')
        const moves = this.board.possibleMoves()

        let bestMove: Move | null = null
        let bestEvaluation = -Infinity
        for (let move of moves) {
            const evaluation = this.minimax(move.endBoard, this.depth! - 1) * this.colorMultiplier

            if (evaluation > bestEvaluation) {
                bestMove = move
                bestEvaluation = evaluation
            }
        }

        logWithTimestamp('DepthNBot end')

        return bestMove
    }

    private minimax(board: Board, depth: number): number {
        if (depth === 0 || board.endOfGame) {
            const evaluation = new PieceSquareTableEvaluator(board).run()
            return evaluation
        }

        let bestEvaluation = -Infinity
        const moves = board.possibleMoves()
        for (let move of moves) {
            const evaluation = this.minimax(move.endBoard, depth - 1) * this.colorMultiplier
            bestEvaluation = Math.max(bestEvaluation, evaluation)
        }
        return bestEvaluation * this.colorMultiplier
    }

    private colorMultiplier = this.board.colorToMove === 'white' ? 1 : -1
}
