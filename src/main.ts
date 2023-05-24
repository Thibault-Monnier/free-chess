import { Board } from './models/board'
import { drawBoard } from './draw'

const board = new Board()
board.debug()

drawBoard()
