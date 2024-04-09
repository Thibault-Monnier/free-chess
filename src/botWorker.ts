import { Board } from './models/board'

self.onmessage = (event: { data: Board }) => {
    const board = event.data
    postMessage('Hello from the worker! Your number is:' + JSON.stringify(board.squares))
}