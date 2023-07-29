import { PieceSquareTableEvaluator } from '../evaluators/pieceSquareTableEvaluator'
import { Move } from '../move'
import { Bot } from './bot'

export class DepthOneBot extends Bot {
    run(): { move: Move; evaluation: number } | null {
        const moves = this.board.possibleMoves()
        const colorMultiplier = this.board.colorToMove === 'white' ? 1 : -1

        let bestMove: Move | null = null
        let bestEvaluation = -Infinity
        for (let move of moves) {
            const evaluator = new PieceSquareTableEvaluator(move.endBoard)
            const evaluation = evaluator.run() * colorMultiplier

            if (evaluation > bestEvaluation) {
                bestMove = move
                bestEvaluation = evaluation
            }
        }

        return bestMove ? { move: bestMove, evaluation: bestEvaluation } : null
    }
}
