import { Chess } from './Chess'
import { PlayMode } from './models/types'

let chess = new Chess({ mode: '1v1' })

if (document.readyState === 'complete') {
    chess.setup()
} else {
    document.onreadystatechange = () => document.readyState === 'complete' && chess.setup()
}

window.chess = chess

const playmodeIDs = ['player_vs_player', 'player_vs_bot', 'player_vs_bot_white', 'player_vs_bot_black', 'bot_vs_bot']
const idToPlayMode: Record<(typeof playmodeIDs)[number], PlayMode> = {
    player_vs_player: { mode: '1v1' },
    player_vs_bot: { mode: '1vC', playerColor: 'white' },
    player_vs_bot_white: { mode: '1vC', playerColor: 'white' },
    player_vs_bot_black: { mode: '1vC', playerColor: 'black' },
    bot_vs_bot: { mode: 'CvC' },
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
