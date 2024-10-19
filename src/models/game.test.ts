import { Game } from './Game'

describe('check notation calculation', () => {
    const notation = (FEN: string, startSquareNb: number, endSquareNb: number): string => {
        const game = new Game(FEN)
        const move = game.currentBoard.possibleMoves().find((move) => {
            return move.startSquareNb === startSquareNb && move.endSquareNb === endSquareNb
        })
        game.addMove(move!)
        return game.calculateMoveNotation()
    }

    describe('pawn moves', () => {
        it('tests notation for a simple pawn move', () => {
            expect(notation('k7/8/8/8/8/8/P6K/8 w - - 0 0', 8, 16)).toBe('a3')
        })
        it('tests notation for a simple pawn capture', () => {
            expect(notation('k7/8/8/8/8/1p6/P6K/8 w - - 0 0', 8, 17)).toBe('axb3')
        })
        it('tests notation for a simple pawn en passant', () => {
            expect(notation('k7/8/8/pP6/8/8/7K/8 w - a6 0 0', 33, 40)).toBe('bxa6')
        })
        it('tests notation for a simple pawn promotion', () => {
            expect(notation('8/P6k/8/8/8/8/7K/8 w - - 0 0', 48, 56)).toBe('a8=Q')
        })
    })

    describe('knight moves', () => {
        it('tests notation for a simple knight move', () => {
            expect(notation('k7/8/8/8/8/8/8/N6K w - - 0 0', 0, 10)).toBe('Nc2')
        })
        it('tests notation for a simple knight capture', () => {
            expect(notation('k7/8/8/8/8/8/2r5/N6K w - - 0 0', 0, 10)).toBe('Nxc2')
        })
    })

    describe('bishop moves', () => {
        it('tests notation for a simple bishop capture', () => {
            expect(notation('k7/8/8/8/8/8/1R5/b6K b - - 0 0', 0, 9)).toBe('Bxb2')
        })
    })

    describe('rook moves', () => {
        it('tests notation for a simple rook move', () => {
            expect(notation('7k/8/8/8/8/8/8/R6K w - - 0 0', 0, 8)).toBe('Ra2')
        })
    })

    describe('queen moves', () => {
        it('tests notation for a simple queen move', () => {
            expect(notation('7k/8/8/8/8/8/8/Q6K w - - 0 0', 0, 8)).toBe('Qa2')
        })
    })

    describe('king moves', () => {
        it('tests notation for a simple king move', () => {
            expect(notation('k7/8/8/8/8/8/8/K7 w - - 0 0', 0, 8)).toBe('Ka2')
        })
    })

    describe('ambiguous moves', () => {
        describe('when several knights can move to the same square', () => {
            it('tests when two knights are on the same rank', () => {
                expect(notation('k7/8/8/8/8/8/K7/N1N5 w - - 0 0', 0, 17)).toBe('Nab3')
            })

            it('tests when two knights are on the same file', () => {
                expect(notation('k7/8/8/8/8/N7/K7/N7 w - - 0 0', 0, 10)).toBe('N1c2')
            })

            it('tests when three knights are on the same file and rank', () => {
                expect(notation('k7/8/8/8/8/N7/K7/N3N3 w - - 0 0', 0, 10)).toBe('Na1c2')
            })

            it('tests that coordinates are not added when they are not needed', () => {
                expect(notation('k7/8/8/8/8/N7/K7/N3N3 w - - 0 0', 16, 10)).toBe('N3c2')
            })
        })
    })
})
