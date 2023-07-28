import { Board } from '../board'
import { Move } from '../move'
import { DepthOneBot } from './depthOneBot'

describe('depthOneBot', () => {
    const bestMove = (fen: string): Move | null => {
        const board = new Board()
        board.importFEN(fen)
        const bot = new DepthOneBot(board, null)
        return bot.run()
    }

    it('', () => {
        expect(bestMove('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 0')?.notation).toBe('Nc3')
    })

    it('', () => {
        expect(bestMove('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 0')?.notation).toBe('Nc6')
    })
})
