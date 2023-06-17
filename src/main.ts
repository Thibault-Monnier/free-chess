import { canvas, initCanvas } from './draw'
import { Chess } from './chess'

initCanvas()

const chess = new Chess()
chess.draw()

canvas.onclick = (event: MouseEvent) => {
    const { x, y } = mouseXY(event)
    if (x >= 0 && y >= 0 && x < 600 && y < 600) {
        chess.clickedSquare(x, y, 'left')
    }
}

window.addEventListener('contextmenu', (event: MouseEvent) => {
    event.preventDefault()
    const { x, y } = mouseXY(event)
    chess.clickedSquare(x, y, 'right')
})

function mouseXY(event: MouseEvent): { x: number; y: number } {
    const x = event.clientX - canvas.getBoundingClientRect().x - canvas.clientLeft
    const y = event.clientY - canvas.getBoundingClientRect().y - canvas.clientTop
    return { x: x, y: y }
}
