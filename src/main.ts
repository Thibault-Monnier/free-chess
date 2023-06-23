import { canvas } from './draw'
import { Chess } from './chess'

const chess = new Chess()
chess.draw()

canvas.onmousedown = (event: MouseEvent) => {
    const x = event.clientX - canvas.getBoundingClientRect().x - canvas.clientLeft
    const y = event.clientY - canvas.getBoundingClientRect().y - canvas.clientTop
    if (x >= 0 && y >= 0 && x < 600 && y < 600) {
        chess.clickedSquare(x, y, event.button === 0 ? 'left' : 'right')
    }
}

canvas.addEventListener('contextmenu', (event: MouseEvent) => event.preventDefault())


