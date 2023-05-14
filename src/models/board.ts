import { King } from './king'

export class Board {
    squares: (King | null)[]

    constructor() {
        this.squares = []
        for (let i = 0; i < 64; i++) {
            this.squares.push(null)
        }
    }

    debug() {
        let board = []

        for (let row = 0; row < 8; row++) {
            //@ts-ignore
            board[row] = []
            for (let column = 0; column < 8; column++) {
                //@ts-ignore
                board[row].push(this.squares[row * 8 + column])
            }
        }

        console.log(board)
    }
}
