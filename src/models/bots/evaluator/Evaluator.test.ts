import { Board } from '../../board'
import { Evaluator } from './evaluator'

describe('PieceSquareTableEvaluator', () => {
    const evaluate = (FEN: string): number => {
        const board = new Board(FEN)
        const evaluator = new Evaluator(board)
        return evaluator.run()
    }

    it('evaluates the start position to zero', () => {
        expect(evaluate('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 0')).toBeCloseTo(0)
    })

    describe('Pawn', () => {
        it('', () => {
            expect(evaluate('4k3/p7/8/8/8/8/8/4K3 w - - 0 0')).toBeCloseTo(-105)
        })
    })

    describe('Queen', () => {
        it('', () => {
            expect(evaluate('4k3/8/8/8/8/8/2Q5/4K3 w - - 0 0')).toBeCloseTo(905)
        })

        it('', () => {
            expect(evaluate('4k3/2q5/8/8/8/8/8/4K3 w - - 0 0')).toBeCloseTo(-900)
        })
    })
})
