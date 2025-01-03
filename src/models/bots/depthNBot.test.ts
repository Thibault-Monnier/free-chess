import { Board } from '../Board'
import { Move } from '../Move'
import { DepthNBot } from './DepthNBot'

describe('Checkmates', () => {
    it('tests that the bot detects checkmate', () => {
        const board = new Board('8/8/8/8/8/k7/7r/K7 b - - 0 0')
        const bestMove = new Move(board.squares[15]!, 15, 7, new Board('8/8/8/8/8/k7/8/K6r w - - 0 1'), 'normal')
        expect(new DepthNBot(board, 2).run()?.move).toEqual(bestMove)
    })
})
