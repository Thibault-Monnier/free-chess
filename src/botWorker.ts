import { BestMove } from './models/BestMove'
import { Board } from './models/Board'
import { Bot } from './models/bot/Bot'
import { Move } from './models/Move'

self.onmessage = (event: { data: { boardFEN: string; maxRedoTimeMs: number } }) => {
    const board = new Board(event.data.boardFEN)

    let bot: Bot | null = null
    let bestMove: BestMove | null = null
    let bestLine: Move[] = []

    const startTime = performance.now()
    let totalTime = 0

    let currentDepth = 1
    do {
        bot = new Bot(board, currentDepth)
        const result = bot.run()
        bestMove = result?.bestMove || null
        bestLine = result?.bestLine || []

        if (!bestMove) break

        totalTime = performance.now() - startTime
        currentDepth++
    } while (totalTime < event.data.maxRedoTimeMs && Math.abs(bestMove.evaluation) < 1e8)

    if (bot) {
        console.log('Total time:', Math.round(totalTime), 'ms')
        console.log(
            'Time:',
            Math.round(bot.perfTotalTime),
            'ms' + ' - Minimax calls:',
            bot.nbMinimax,
            ' - Avg time per minimax (microsecs):',
            (bot.perfTotalTime / bot.nbMinimax) * 1000
        )
        console.log(
            'Avg time evals (microsecs):',
            (bot.perfTimeEvals / bot.perfNbEvals) * 1000,
            'Avg time possible moves (microsecs):',
            (bot.perfTimePossibleMoves / bot.perfNbPossibleMoves) * 1000
        )
        console.log('Best move:', bestMove, 'Evaluation:', bestMove?.evaluation)
        console.log('Calculated to depth', currentDepth - 1)
    }

    console.log('Best line:', bestLine)

    postMessage(bestMove?.serialize())
}
