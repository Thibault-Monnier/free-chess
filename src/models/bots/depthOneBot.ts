import { BestMove } from '../bestMove'
import { Move } from '../move'
import { Bot } from './bot'
import { Evaluator } from './evaluator/temp'

export class DepthOneBot extends Bot {
    run(): BestMove | null {
        const moves = this.board.possibleMoves()
        const colorMultiplier = this.board.colorToMove === 'white' ? 1 : -1

        let bestMove: Move | null = null
        let bestEvaluation = -Infinity
        for (let move of moves) {
            const evaluator = new Evaluator(move.endBoard)
            const evaluation = evaluator.run() * colorMultiplier

            if (evaluation > bestEvaluation) {
                bestMove = move
                bestEvaluation = evaluation
            }
        }

        return bestMove ? new BestMove(bestMove, bestEvaluation) : null
    }
}
