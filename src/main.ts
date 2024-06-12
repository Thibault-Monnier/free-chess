import { Chess } from './chess'
import { PlayMode } from './models/types'

let chess = new Chess()

if (document.readyState === 'complete') {
    chess.setup()
} else {
    document.onreadystatechange = () => document.readyState === 'complete' && chess.setup()
}

window.chess = chess

const playmodeIDs = ['player_vs_player', 'player_vs_bot', 'bot_vs_bot']
const idToPlayMode: Record<(typeof playmodeIDs)[number], PlayMode> = {
    player_vs_player: '1v1',
    player_vs_bot: '1vC',
    bot_vs_bot: 'CvC',
}

playmodeIDs.forEach((id) => {
    document.getElementById(id)!.addEventListener('click', () => {
        chess.stopBot()

        chess = new Chess(idToPlayMode[id])
        chess.setup()
        window.chess = chess
    })
})

document.addEventListener('click', (event) => {
    chess.clicked(event)
})
document.addEventListener('mousedown', (event: MouseEvent) => {
    chess.clicked(event)
})
document.addEventListener('keydown', (event: KeyboardEvent) => {
    chess.keydown(event)
})

window.addEventListener('resize', () => chess.windowResize())
