import { Piece } from './utils'

export class Board {
    squares: (Piece | null)[]

    constructor() {
        this.squares = []
        for (let i = 0; i < 64; i++) {
            this.squares.push(null)
        }
    }

    debug() {
        let debugBoard = []

        for (let row = 0; row < 8; row++) {
            //@ts-ignore
            debugBoard[row] = []
            for (let column = 0; column < 8; column++) {
                //@ts-ignore
                debugBoard[row].push(this.squares[row * 8 + column])
            }
        }

        console.log(debugBoard)
    }
}
