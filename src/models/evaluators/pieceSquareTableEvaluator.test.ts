import { Board } from '../board'
import { PieceSquareTableEvaluator } from './pieceSquareTableEvaluator'

describe('PieceSquareTableEvaluator', () => {
    it('', () => {
        const board = new Board()
        board.importFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 0')
        const evaluator = new PieceSquareTableEvaluator(board)
        expect(evaluator.run()).toBeCloseTo(0)
    })
})
