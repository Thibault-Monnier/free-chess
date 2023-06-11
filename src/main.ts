import { Board } from './models/board'
import { drawBoard, initCanvas } from './draw'
import { Chess } from './chess'

initCanvas()

const chess = new Chess()
chess.draw()
