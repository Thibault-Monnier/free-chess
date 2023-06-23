import { canvas, squareSize } from './draw'
import { Chess } from './chess'

const chess = new Chess()

canvas.onmousedown = (event: MouseEvent) => {
    const x = event.clientX - canvas.getBoundingClientRect().x - canvas.clientLeft
    const y = event.clientY - canvas.getBoundingClientRect().y - canvas.clientTop
    if (x >= 0 && y >= 0 && x < squareSize * 8 && y < squareSize * 8) {
        chess.clickedSquare(x, y, event.button === 0 ? 'left' : 'right')
    }
}

document.getElementById('undo')!.onclick = () => chess.undo()
document.getElementById('redo')!.onclick = () => chess.redo()
document.getElementById('reset')!.onclick = () => chess.reset()

canvas.addEventListener('contextmenu', (event: MouseEvent) => event.preventDefault())
