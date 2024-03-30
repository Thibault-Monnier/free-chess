import { Chess } from './chess'
import { PlayMode } from './models/types'

let chess = new Chess()

//@ts-ignore
window.chess = chess

function setup() {
    chess.setup()
}

if (document.readyState === 'complete') {
    setup()
} else {
    document.onreadystatechange = () => document.readyState === 'complete' && setup()
}

const playmodeIDs = ['player_vs_player', 'player_vs_bot', 'bot_vs_bot']
const idToPlayMode: Record<(typeof playmodeIDs)[number], PlayMode> = {
    player_vs_player: '1v1',
    player_vs_bot: '1vC',
    bot_vs_bot: 'CvC',
}

playmodeIDs.forEach((id) => {
    document.getElementById(id)!.onclick = () => {
        chess.interruptBot()
        chess = new Chess(idToPlayMode[id])
    }
})
