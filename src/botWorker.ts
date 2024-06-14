import { Board } from './models/board'
import { DepthNBot } from './models/bots/depthNBot'

self.onmessage = (event: { data: { boardFEN: string; depth: number } }) => {
    const board = new Board(event.data.boardFEN)
    const depth = event.data.depth

    const bot = new DepthNBot(board, depth)
    const bestMove = bot.run()

    postMessage(bestMove?.serialize())
}
