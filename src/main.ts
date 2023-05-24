import { Board } from './models/board'
import { drawBoard, initCanvas } from './draw'

new Board().debug()

initCanvas()
drawBoard()
