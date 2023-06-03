import { Board } from './models/board'
import { drawBoard, initCanvas } from './draw'

const board = new Board()

initCanvas()
drawBoard(board)
