import { BestMove } from '../BestMove'
import { Move } from '../Move'
import { Bot } from './Bot'
import { Evaluator } from './evaluator/Evaluator'

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
