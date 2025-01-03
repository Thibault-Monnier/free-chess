import { Board } from '../Board'
import { Move } from '../Move'
import { Bot } from './Bot'

describe('Checkmates', () => {
    it('tests that the bot detects checkmate', () => {
        const board = new Board('8/8/8/8/8/k7/7r/K7 b - - 0 0')
        const bestMove = new Move(board.squares[15]!, 15, 7, new Board('8/8/8/8/8/k7/8/K6r w - - 0 1'), 'normal')
        console.log(new Bot(board, 2).run()?.bestMove)
        expect(new Bot(board, 2).run()?.bestMove.move).toEqual(bestMove)
    })
})
