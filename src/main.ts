import { canvas, squareSize } from './draw'
import { Chess } from './chess'
import { PlayMode } from './models/types'

let chess = new Chess()

canvas.onmousedown = (event: MouseEvent) => {
    const x = event.clientX - canvas.getBoundingClientRect().x - canvas.clientLeft
    const y = event.clientY - canvas.getBoundingClientRect().y - canvas.clientTop
    if (x >= 0 && y >= 0 && x < squareSize * 8 && y < squareSize * 8) {
        chess.clickedSquare(x, y, event.button === 0 ? 'left' : 'right')
    }
}

const playmodeIDs = ['player_vs_player', 'player_vs_bot', 'bot_vs_bot']
const idToPlayMode: { [key: string]: PlayMode } = {
    player_vs_player: '1v1',
    player_vs_bot: '1vC',
    bot_vs_bot: 'CvC',
}

playmodeIDs.forEach((id) => {
    document.getElementById(id)!.onclick = () => {
        if (chess.calculateBestMoveHandle) cancelIdleCallback(chess.calculateBestMoveHandle)
        chess = new Chess(idToPlayMode[id])
    }
})

document.getElementById('undo')!.onclick = () => chess.undo()
document.getElementById('redo')!.onclick = () => chess.redo()
document.getElementById('reset')!.onclick = () => chess.reset()

canvas.addEventListener('contextmenu', (event: MouseEvent) => event.preventDefault())

document.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') chess.undo()
    if (event.key === 'ArrowRight') chess.redo()
})

//@ts-ignore
window.chess = chess
