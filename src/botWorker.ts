import { Board } from './models/board'
import { DepthNBot } from './models/bots/depthNBot'

self.onmessage = (event: { data: { board: string; depth: number } }) => {
    const board = new Board(event.data.board)
    const depth = event.data.depth

    const bot = new DepthNBot(board, depth)
    const bestMove = bot.run()

    console.log(typeof new Board())
}
