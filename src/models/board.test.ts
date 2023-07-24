import { Board } from './board'
import { CanCastle, EndOfGame } from './types'

describe('importFEN', () => {
    const boardFromFen = (fen: string): Board => {
        const board = new Board()
        board.importFEN(fen)
        return board
    }

    it('imports a FEN', () => {
        const board = boardFromFen('rbk3n1/p7/8/8/8/8/7P/RBK3N1 b KQ - 0 0')
        expect(board.squares[56]?.name).toBe('rook')
    })

    it('imports another FEN', () => {
        const board = boardFromFen('8/8/8/2k5/2pP4/8/B7/4K3 b - d3 0 3')
        expect(board.squares.filter((piece) => piece !== null).length).toBe(5)
        expect(board.colorToMove).toEqual('black')
        expect(board.canCastle).toStrictEqual<CanCastle>({
            white: {
                kingSide: false,
                queenSide: false,
            },
            black: {
                kingSide: false,
                queenSide: false,
            },
        })
        expect(board.enPassantTargetSquareNb).toBe(19)
    })
})

describe('isInCheck', () => {
    const isInCheck = (fen: string): boolean => {
        const board = new Board()
        board.importFEN(fen)
        return board.isInCheck()
    }

    it('detects check', () => expect(isInCheck('r6r/1b2k1bq/8/8/7B/8/8/R3K2R b - - 0 0')).toBe(true))

    it('detects when not in check', () => expect(isInCheck('k7/8/8/8/8/8/8/b5K1 w - - 0 0')).toBe(false))
})

describe('possibleMoves', () => {
    const nbMoves = (fen: string): number => {
        const board = new Board()
        board.importFEN(fen)
        return board.possibleMoves().length
    }

    it('', () => expect(nbMoves('r6r/1b2k1bq/8/8/7B/8/8/R3K2R b KQ - 3 2')).toEqual(8))

    it('stops checks by en passant', () => expect(nbMoves('8/8/8/2k5/2pP4/8/B7/4K3 b - d3 0 3')).toEqual(8))

    it('', () => expect(nbMoves('r1bqkbnr/pppppppp/n7/8/8/P7/1PPPPPPP/RNBQKBNR w KQkq - 2 2')).toEqual(19))

    it('', () => expect(nbMoves('r3k2r/p1pp1pb1/bn2Qnp1/2qPN3/1p2P3/2N5/PPPBBPPP/R3K2R b KQkq - 3 2')).toEqual(5))

    it('', () => expect(nbMoves('2kr3r/p1ppqpb1/bn2Qnp1/3PN3/1p2P3/2N5/PPPBBPPP/R3K2R b KQ - 3 2')).toEqual(44))

    //it('includes all types of promotions', () => expect(nbMoves('rnb2k1r/pp1Pbppp/2p5/q7/2B5/8/PPPQNnPP/RNB1K2R w KQ - 3 9')).toEqual(39))

    it('', () => expect(nbMoves('2r5/3pk3/8/2P5/8/2K5/8/8 w - - 5 4')).toEqual(9))
})

describe('endOfGame', () => {
    const endOfGame = (fen: string): EndOfGame | null => {
        const board = new Board()
        board.importFEN(fen)
        return board.endOfGame
    }

    it('tests checkmate', () => expect(endOfGame('r1K5/r7/8/8/8/8/8/7k w - - 0 0')).toBe('checkmate'))
    it('tests stalemate', () => expect(endOfGame('k7/7R/8/8/8/8/8/1R4K1 b - - 0 0')).toBe('stalemate'))
    it('returns null if not end of game', () => expect(endOfGame('kr6/8/8/8/8/8/8/6RK b - - 0 0')).toBe(null))
})
