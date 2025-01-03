import { BestMove } from './models/BestMove'
import { Board } from './models/Board'
import { DepthNBot } from './models/bots/DepthNBot'
import { Move } from './models/Move'

self.onmessage = (event: { data: { boardFEN: string; depth: number; maxRedoTimeMs: number } }) => {
    const board = new Board(event.data.boardFEN)

    let bot: DepthNBot | null = null
    let botCurrentDepth = event.data.depth
    let bestMove: BestMove | null = null
    let bestLine: Move[] = []

    const startTime = performance.now()
    let totalTime = 0
    while (totalTime < event.data.maxRedoTimeMs) {
        bot = new DepthNBot(board, botCurrentDepth)
        const result = bot.run()
        bestMove = result?.bestMove || null
        bestLine = result?.bestLine || []

        totalTime += performance.now() - startTime
        botCurrentDepth++
    }

    if (bot) {
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
        console.log('Calculated to depth', botCurrentDepth - 1)
    }

    console.log('Best line:', bestLine)

    postMessage(bestMove?.serialize())
}
