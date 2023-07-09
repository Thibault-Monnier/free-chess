define("models/types", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("models/utils", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.coordinatesToSquareNb = exports.squareNbToCoordinates = exports.fileRankToSquareNb = exports.squareNbToFileRank = void 0;
    function squareNbToFileRank(squareNb) {
        return {
            file: squareNb % 8,
            rank: Math.floor(squareNb / 8),
        };
    }
    exports.squareNbToFileRank = squareNbToFileRank;
    function fileRankToSquareNb({ file, rank }) {
        return rank * 8 + file;
    }
    exports.fileRankToSquareNb = fileRankToSquareNb;
    function squareNbToCoordinates(squareNb) {
        const { file, rank } = squareNbToFileRank(squareNb);
        const fileInLetter = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'][file];
        return `${fileInLetter}${rank + 1}`;
    }
    exports.squareNbToCoordinates = squareNbToCoordinates;
    function coordinatesToSquareNb(coordinates) {
        const file = coordinates[0].charCodeAt(0) - 'a'.charCodeAt(0);
        const rank = Number(coordinates[1]) - 1;
        return fileRankToSquareNb({ file, rank });
    }
    exports.coordinatesToSquareNb = coordinatesToSquareNb;
});
define("models/pieces/piece", ["require", "exports", "models/board", "models/move", "models/utils"], function (require, exports, board_1, move_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Piece = void 0;
    class Piece {
        constructor(name, color) {
            this.name = name;
            this.color = color;
        }
        eaten(board) { }
        addOffset(startSquareNb, offset) {
            const endSquareNb = startSquareNb + offset.file + offset.rank * 8;
            const { file } = (0, utils_1.squareNbToFileRank)(startSquareNb);
            if (endSquareNb < 0 || endSquareNb > 63)
                return null;
            if (file + offset.file < 0)
                return null;
            if (file + offset.file > 7)
                return null;
            return endSquareNb;
        }
        createMovesForRepeatedOffsets(startSquareNb, offsets, board, PieceLetter, options) {
            const moves = [];
            for (let offset of offsets) {
                let endSquareNb = startSquareNb;
                while (true) {
                    endSquareNb = this.addOffset(endSquareNb, offset);
                    if (endSquareNb === null)
                        break;
                    this.createMove(moves, startSquareNb, endSquareNb, board, PieceLetter, options);
                    if (board.squares[endSquareNb])
                        break;
                }
            }
            return moves;
        }
        createMove(moves, startSquareNb, endSquareNb, board, letter, options, postMove) {
            if (endSquareNb === null)
                return;
            const endSquarePiece = board.squares[endSquareNb];
            if (!endSquarePiece || endSquarePiece.color !== this.color) {
                const endBoard = new board_1.Board(board, { switchColor: true, resetEnPassant: true });
                const piece = endBoard.squares[endSquareNb];
                if (piece)
                    piece.eaten(endBoard);
                endBoard.squares[endSquareNb] = endBoard.squares[startSquareNb];
                endBoard.squares[startSquareNb] = null;
                if (postMove)
                    postMove(endBoard);
                if (!options?.skipCheckVerification && this.isInCheck(endBoard))
                    return;
                const move = new move_1.Move(this, startSquareNb, endSquareNb, endBoard, this.encodeMove(letter, endSquarePiece ? true : false, startSquareNb, endSquareNb));
                moves.push(move);
            }
        }
        isInCheck(board) {
            const kingSquareNb = board.squares.findIndex((piece) => piece?.name === 'king' && piece.color === this.color);
            return this.areSquaresAttacked(board, kingSquareNb);
        }
        //Worst possible code in terms of optimization, change when optimizing
        areSquaresAttacked(board, ...targetSquareNbs) {
            for (let squareNb = 0; squareNb < 64; squareNb++) {
                const piece = board.squares[squareNb];
                if (!piece || piece.color === this.color)
                    continue;
                const moves = piece.possibleMoves(squareNb, board, { skipCheckVerification: true });
                if (moves.some((move) => targetSquareNbs.includes(move.endSquareNb)))
                    return true;
            }
            return false;
        }
        encodeMove(letter, isCapture, startSquareNb, endSquareNb) {
            const captureSymbol = isCapture ? 'x' : '';
            const endSquareCoordinates = (0, utils_1.squareNbToCoordinates)(endSquareNb);
            let file = '';
            if (isCapture && letter === '')
                file = (0, utils_1.squareNbToCoordinates)(startSquareNb)[0];
            return [letter === '' ? file : letter, captureSymbol, endSquareCoordinates].join('');
        }
    }
    exports.Piece = Piece;
});
define("models/move", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Move = void 0;
    class Move {
        constructor(piece, startSquareNb, endSquareNb, endBoard, notation) {
            this.piece = piece;
            this.startSquareNb = startSquareNb;
            this.endSquareNb = endSquareNb;
            this.endBoard = endBoard;
            this.notation = notation;
        }
    }
    exports.Move = Move;
});
define("models/pieces/bishop", ["require", "exports", "models/pieces/piece"], function (require, exports, piece_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Bishop = void 0;
    class Bishop extends piece_1.Piece {
        constructor(color) {
            super('bishop', color);
        }
        possibleMoves(startSquareNb, board, options) {
            return this.createMovesForRepeatedOffsets(startSquareNb, [
                { file: 1, rank: 1 },
                { file: 1, rank: -1 },
                { file: -1, rank: 1 },
                { file: -1, rank: -1 },
            ], board, 'B', options);
        }
    }
    exports.Bishop = Bishop;
});
define("models/pieces/king", ["require", "exports", "models/board", "models/move", "models/pieces/piece"], function (require, exports, board_2, move_2, piece_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.King = void 0;
    class King extends piece_2.Piece {
        constructor(color) {
            super('king', color);
        }
        // TODO: checks
        possibleMoves(startSquareNb, board, options) {
            const OFFSETS = [
                { file: 1, rank: 1 },
                { file: 1, rank: 0 },
                { file: 1, rank: -1 },
                { file: 0, rank: 1 },
                { file: 0, rank: -1 },
                { file: -1, rank: 1 },
                { file: -1, rank: 0 },
                { file: -1, rank: -1 },
            ];
            const moves = [];
            for (let offset of OFFSETS) {
                const endSquareNb = this.addOffset(startSquareNb, offset);
                this.createMove(moves, startSquareNb, endSquareNb, board, King.LETTER, options, (endBoard) => {
                    const canCastle = endBoard.canCastle[this.color];
                    canCastle.queenSide = false;
                    canCastle.kingSide = false;
                });
            }
            // Castling
            if (!options.skipCheckVerification) {
                // Castlings cannot "eat" opponent kings
                const canCastle = board.canCastle[this.color];
                if (canCastle.queenSide) {
                    const isClearPath = this.areSquaresClear(board, startSquareNb, [
                        startSquareNb - 1,
                        startSquareNb - 2,
                        startSquareNb - 3,
                    ]);
                    if (isClearPath) {
                        const move = this.createCastling(board, startSquareNb, true);
                        moves.push(move);
                    }
                }
                if (canCastle.kingSide) {
                    const isClearPath = this.areSquaresClear(board, startSquareNb, [startSquareNb + 1, startSquareNb + 2]);
                    if (isClearPath) {
                        const move = this.createCastling(board, startSquareNb, false);
                        moves.push(move);
                    }
                }
            }
            return moves;
        }
        areSquaresClear(board, startSquareNb, squareNbs) {
            return (squareNbs.every((squareNb) => !board.squares[squareNb]) &&
                !this.areSquaresAttacked(board, ...[startSquareNb, ...squareNbs]));
        }
        createCastling(startBoard, startSquareNb, isQueenSideCastling) {
            const endBoard = new board_2.Board(startBoard, { switchColor: true, resetEnPassant: true });
            const endSquareNb = startSquareNb + (isQueenSideCastling ? -2 : 2);
            const rookStartPosition = startSquareNb + (isQueenSideCastling ? -4 : 3);
            endBoard.squares[endSquareNb] = endBoard.squares[startSquareNb];
            endBoard.squares[endSquareNb + (isQueenSideCastling ? 1 : -1)] = endBoard.squares[rookStartPosition];
            endBoard.squares[startSquareNb] = null;
            endBoard.squares[rookStartPosition] = null;
            const moveNotation = isQueenSideCastling ? 'O-O-O' : 'O-O';
            return new move_2.Move(startBoard.squares[startSquareNb], startSquareNb, endSquareNb, endBoard, moveNotation);
        }
    }
    King.LETTER = 'K';
    exports.King = King;
});
define("models/pieces/knight", ["require", "exports", "models/pieces/piece"], function (require, exports, piece_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Knight = void 0;
    class Knight extends piece_3.Piece {
        constructor(color) {
            super('knight', color);
        }
        possibleMoves(startSquareNb, board, options) {
            const OFFSETS = [
                { file: 1, rank: 2 },
                { file: 2, rank: 1 },
                { file: 2, rank: -1 },
                { file: 1, rank: -2 },
                { file: -1, rank: -2 },
                { file: -2, rank: -1 },
                { file: -2, rank: 1 },
                { file: -1, rank: 2 },
            ];
            const moves = [];
            for (let offset of OFFSETS) {
                const endSquareNb = this.addOffset(startSquareNb, offset);
                this.createMove(moves, startSquareNb, endSquareNb, board, 'N', options);
            }
            return moves;
        }
    }
    exports.Knight = Knight;
});
define("models/pieces/pawn", ["require", "exports", "models/utils", "models/pieces/piece"], function (require, exports, utils_2, piece_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Pawn = void 0;
    class Pawn extends piece_4.Piece {
        constructor(color) {
            super('pawn', color);
        }
        // TODO:  promotion
        possibleMoves(startSquareNb, board, options) {
            const moves = [];
            const direction = this.color === 'white' ? 1 : -1;
            // Basic moves
            const moveOneSquare = startSquareNb + 8 * direction;
            const moveTwoSquares = startSquareNb + 16 * direction;
            if (moveOneSquare >= 0 && moveOneSquare <= 63 && board.squares[moveOneSquare] === null) {
                // Advance one square
                this.createMove(moves, startSquareNb, moveOneSquare, board, Pawn.LETTER, options);
                // Advance two squares
                const { rank } = (0, utils_2.squareNbToFileRank)(startSquareNb);
                if (board.squares[moveTwoSquares] === null &&
                    ((this.color === 'white' && rank === 1) || (this.color === 'black' && rank === 6))) {
                    this.createMove(moves, startSquareNb, moveTwoSquares, board, Pawn.LETTER, options, (endBoard) => {
                        endBoard.enPassantTargetSquareNb = moveOneSquare;
                    });
                }
            }
            const captures = [
                { file: -1, rank: direction },
                { file: 1, rank: direction },
            ];
            // Basic captures
            for (let capture of captures) {
                const endSquareNb = this.addOffset(startSquareNb, capture);
                if (endSquareNb !== null &&
                    board.squares[endSquareNb] &&
                    board.squares[endSquareNb].color !== this.color) {
                    this.createMove(moves, startSquareNb, endSquareNb, board, Pawn.LETTER, options);
                }
            }
            // En passant captures
            if (board.enPassantTargetSquareNb !== null) {
                const enPassantTargetSquareNb = board.enPassantTargetSquareNb;
                const offsetToTarget = enPassantTargetSquareNb - startSquareNb;
                if (offsetToTarget === 7 * direction || offsetToTarget === 9 * direction) {
                    this.createMove(moves, startSquareNb, enPassantTargetSquareNb, board, Pawn.LETTER, options, (endBoard) => {
                        endBoard.squares[enPassantTargetSquareNb - 8 * direction] = null;
                    });
                }
            }
            return moves;
        }
    }
    Pawn.LETTER = '';
    exports.Pawn = Pawn;
});
define("models/pieces/queen", ["require", "exports", "models/pieces/piece"], function (require, exports, piece_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Queen = void 0;
    class Queen extends piece_5.Piece {
        constructor(color) {
            super('queen', color);
        }
        possibleMoves(startSquareNb, board, options) {
            return this.createMovesForRepeatedOffsets(startSquareNb, [
                { file: 1, rank: 1 },
                { file: 1, rank: 0 },
                { file: 1, rank: -1 },
                { file: 0, rank: 1 },
                { file: 0, rank: -1 },
                { file: -1, rank: 1 },
                { file: -1, rank: 0 },
                { file: -1, rank: -1 },
            ], board, 'Q', options);
        }
    }
    exports.Queen = Queen;
});
define("models/pieces/rook", ["require", "exports", "models/pieces/piece"], function (require, exports, piece_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Rook = void 0;
    class Rook extends piece_6.Piece {
        constructor(color) {
            super('rook', color);
        }
        possibleMoves(startSquareNb, board, options) {
            const moves = this.createMovesForRepeatedOffsets(startSquareNb, [
                { file: 1, rank: 0 },
                { file: 0, rank: 1 },
                { file: 0, rank: -1 },
                { file: -1, rank: 0 },
            ], board, 'R', options);
            const isQueenSquare = (this.color === 'white' ? 0 : 56) === startSquareNb;
            const isKingSquare = (this.color === 'white' ? 7 : 63) === startSquareNb;
            if (isQueenSquare || isKingSquare) {
                moves.forEach((move) => {
                    move.endBoard.canCastle[this.color][isQueenSquare ? 'queenSide' : 'kingSide'] = false;
                });
            }
            return moves;
        }
        eaten(board) {
            if (this.color === 'white') {
                if (board.squares[0] === this)
                    board.canCastle[this.color].queenSide = false;
                if (board.squares[7] === this)
                    board.canCastle[this.color].kingSide = false;
            }
            else {
                if (board.squares[56] === this)
                    board.canCastle[this.color].queenSide = false;
                if (board.squares[63] === this)
                    board.canCastle[this.color].kingSide = false;
            }
        }
    }
    exports.Rook = Rook;
});
define("models/board", ["require", "exports", "models/pieces/bishop", "models/pieces/king", "models/pieces/knight", "models/pieces/pawn", "models/pieces/queen", "models/pieces/rook", "models/utils"], function (require, exports, bishop_1, king_1, knight_1, pawn_1, queen_1, rook_1, utils_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Board = void 0;
    class Board {
        constructor(board, options) {
            this.colorToMove = 'white';
            this.canCastle = {
                white: { queenSide: false, kingSide: false },
                black: { queenSide: false, kingSide: false },
            };
            this.enPassantTargetSquareNb = null;
            if (board) {
                this.squares = [...board.squares];
                if (options?.switchColor) {
                    this.colorToMove = board.colorToMove === 'white' ? 'black' : 'white';
                }
                else {
                    this.colorToMove = board.colorToMove;
                }
                this.canCastle = { white: { ...board.canCastle.white }, black: { ...board.canCastle.black } };
                this.enPassantTargetSquareNb = options?.resetEnPassant ? null : board.enPassantTargetSquareNb;
            }
            else {
                this.squares = new Array(64).fill(null);
                this.importFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 0');
            }
        }
        importFEN(fen) {
            const piecesId = { r: rook_1.Rook, n: knight_1.Knight, b: bishop_1.Bishop, q: queen_1.Queen, k: king_1.King, p: pawn_1.Pawn };
            const [placement, colorToMove, canCastle, enPassantTargetSquare] = fen.split(' ');
            placement.split('/').forEach((rowPlacement, index) => {
                const rank = 7 - index;
                let file = 0;
                for (let char of rowPlacement) {
                    if (char > '8') {
                        const c = char.toLowerCase();
                        if (c !== 'r' && c !== 'n' && c !== 'b' && c !== 'q' && c !== 'k' && c !== 'p')
                            throw 'Invalid piece';
                        const Piece = piecesId[c];
                        this.squares[(0, utils_3.fileRankToSquareNb)({ file, rank })] = new Piece(char === c ? 'black' : 'white');
                        file++;
                    }
                    else {
                        let number = Number(char);
                        while (number > 0) {
                            this.squares[(0, utils_3.fileRankToSquareNb)({ file, rank })] = null;
                            number--;
                            file++;
                        }
                    }
                }
            });
            this.colorToMove = colorToMove === 'w' ? 'white' : 'black';
            this.canCastle.white.kingSide = canCastle.includes('K');
            this.canCastle.white.queenSide = canCastle.includes('Q');
            this.canCastle.black.kingSide = canCastle.includes('k');
            this.canCastle.black.queenSide = canCastle.includes('q');
            this.enPassantTargetSquareNb =
                enPassantTargetSquare === '-' ? null : (0, utils_3.coordinatesToSquareNb)(enPassantTargetSquare);
        }
        possibleMoves() {
            let moves = [];
            this.squares.forEach((piece, squareNb) => {
                if (piece && piece.color === this.colorToMove) {
                    moves = [...moves, ...piece.possibleMoves(squareNb, this, {})];
                }
            });
            return moves;
        }
        debug() {
            let debugBoard = [];
            for (let rank = 0; rank < 8; rank++) {
                //@ts-ignore
                debugBoard[rank] = [];
                for (let file = 0; file < 8; file++) {
                    //@ts-ignore
                    debugBoard[rank].push(this.squares[rank * 8 + file]);
                }
            }
            console.log(debugBoard);
        }
    }
    exports.Board = Board;
});
define("models/game", ["require", "exports", "models/board"], function (require, exports, board_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Game = void 0;
    class Game {
        constructor() {
            this.startingBoard = new board_3.Board();
            this._moves = [];
            this._moveNb = 0;
        }
        get moves() {
            return this._moves;
        }
        get moveNb() {
            return this._moveNb;
        }
        get currentBoard() {
            if (this._moveNb > 0) {
                return this._moves[this._moveNb - 1].endBoard;
            }
            else {
                return this.startingBoard;
            }
        }
        get lastMove() {
            return this._moves[this._moveNb - 1];
        }
        addMove(move) {
            this._moves = this._moves.slice(0, this._moveNb);
            this._moves.push(move);
            this._moveNb++;
        }
        jumpToMove(moveNb) {
            this._moveNb = moveNb;
        }
        get canUndo() {
            return this._moveNb > 0;
        }
        undo() {
            if (this.canUndo)
                this._moveNb--;
        }
        get canRedo() {
            return this._moveNb < this._moves.length;
        }
        redo() {
            if (this.canRedo)
                this._moveNb++;
        }
    }
    exports.Game = Game;
});
define("utils", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.waitOneMillisecondAsync = exports.logWithTimestamp = void 0;
    function logWithTimestamp(...message) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}]`, ...message);
    }
    exports.logWithTimestamp = logWithTimestamp;
    async function waitOneMillisecondAsync() {
        return new Promise((resolve) => {
            setTimeout(resolve, 1);
        });
    }
    exports.waitOneMillisecondAsync = waitOneMillisecondAsync;
});
define("draw", ["require", "exports", "utils"], function (require, exports, utils_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.drawBoard = exports.canvas = exports.squareSize = void 0;
    exports.squareSize = 85;
    const pieceSize = exports.squareSize * 0.97;
    const lightSquares = '#efdfc5';
    const darkSquares = '#ae7c66';
    exports.canvas = document.getElementById('board');
    const ctx = exports.canvas.getContext('2d');
    exports.canvas.width = exports.squareSize * 8;
    exports.canvas.height = exports.squareSize * 8;
    //https://commons.wikimedia.org/wiki/Category:PNG_chess_pieces/Standard_transparent
    //https://www.base64-image.de/
    let imagesLoading = 0;
    const piecesImages = {
        white: {
            pawn: stringToImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAA6/NlyAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAASLSURBVGiB7ZrLS2NnGIefL6YJEuM4GaOiUvDCgJIKI0Y7KFJ3BSm00j9gil1ULbRi+1cUV92U7gahSLvUzeAiVG3QCoOggxmvgRlRY2uKSLSivl3oV2JJgyfnYrw8EDgh3+X35P3ycc7JUSLCXcJ13QGc5l74tnMvfNu5F77t3Dlh93VMqpQKAmGgEVgGfheRbUcmFxHHXkAx8CMgGV4/AaV2Z1BOnVoqpaqAKPCux+Ohra2NUChELBZjZmaGw8NDgF2gXURWbAviYHVfANLS0iJLS0uSTjwel87OTl3pKFBgWw6HZD8BJBAIyNbWlmQimUxKZWWllv7MrixO7dIdAAMDA1RUVGRsUFJSwtDQ0KX2duCU8BOAcDictVHa50/sCuKUcArg5OQka6PT01N9eGRXEKeEXwFMTExkbRSJRPRhzLYkDm1a7wPi8XgkHo9n3LR2d3fF7/frTevDG7tpKaUeA88BPB4P8Xg8Y7u3b9/idv974veDUsqe37HNlS0GXgMSCoUkFotlrK5mY2NDwuGwrvImUGZ5JpuFfwakqalJDg4Osspqjo6OpKOjQ0tP3Bhhzi8MpKioSNbW1q4kq0kkElJaWqqlO6zMZedv+EuA3t5eamtrDXUMBoP09/frt19ZmsrGCq8DMj8/b6i6ms3NTV3hPStz2XK1pJRyA0cul6sglUrh9XpzGicQCJBMJgECIpK0IptdS7oMKCgpKclZFs6FL6iyIhRg65L+A5CNjY2clvTe3p4opQQ4BgqtymXnpjUDMD09nVPnaDSqv7iXInJoVSg7haMAk5OTOXWemprSh79ZlOccG5d0OyBer1dmZ2cNLedYLCbFxcV6l/7I0lx2CV9Ifw9IdXW17OzsXEl2f39fGhoatOwvlmeyWdgNRADp7OyU4+PjrLJnZ2fS09OjZReBohsjzPn+8AXwJyBut1vGxsayCkejUfF6vVr4L+BrwJ33wsBDYPYiuHR1dcni4mJWWc3q6qp0d3en369eACryVhjwAr8CUlVVJaOjo1cS/S/j4+NSV1enpV8C/rwTBhQwqjeqN2/e5CSrSSQSUl9fr6VfAO/km/B3gDx48EAWFhZMyWpWV1elrKxMSz/PG2Ggh4v7VpFIxBJZzdzcnPh8Pi39eb4IzwEyPDxsqaxmZGREC78GXNcqDHzAxV8pV72VY5STkxOpqanR0h/nmtWqc+lv4PyvFJ/PZ9GQlykoKGBwcPDSfDlhQXUbgbPCwkJJJBK2VFdzcHAggUBAV/npdVV4CFDPnj0jGAxaMNz/4/P56Ovr02+/zWkQCyq8A8jy8rKt1dVsb2+Ly+US4G/AazivSdk6QCorKx2R1TQ2Nupl3WY0s9kl/RSgtbXV5DDGSJuvzWhfs8LvATQ3N5scxhhp84WM9jUrXApQXl5uchhjpM33yGhfs8KP4NLtVEdIm8+wsKkb8UqpaaC9trYWv9+f8zhGSaVSrKysALwSEUPL2uyTeA8B1tfXTQ5jbn4jmBX+lPML/usi+0MjGXDsSbx84c49TXsvfNu5F77t3DnhfwDnGIncxPZT9AAAAABJRU5ErkJggg=='),
            rook: stringToImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAA6/NlyAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAMiSURBVGiB7ZqxTxNRHMc/P2jC2dDCYmhtB8cuJgQaWQwFRx1kdHAQHCr/ghOyMLAQBnRhI4Q4MTBoTEzYJDQhONIOGG3aktCQGHFo6HOAMyBX2nv3oHq9T/JLmrv3fvf73nv37t7vV1FK0Ul0tTuAmyYQ7HcCwX4nEOx3AsF+R1uwiFgi8l5ElIMtiYi4aK9E5IuI3Ha4zrSI1Ftt3xSllJYBY4C6wmIu2yvgpcN1ym7aNzPPUzqTyVxwODAwYJ96IiJPbQMeOrVXSpHNZu0+6fN9zvpZAKVSyam9a0LaPRvQ399PpVIBeNvo/BXHXpzZBXp6erAsy0h8xgWvr68zOztLvV6/dM6yLObn5y8dn5mZ4fj4mIODA0efU1NTjjdKB+OCU6kUq6urrvpYlsXi4qLpUBzxLLhcLrO2tmYilpbZ29vT7+xhlX5G81X3um3Zbdyim/EQkTCQB+6Ew2HGx8fp7e3V8tUqtVqNzc1NDg8PAX4AQ0qpgisnuiN8dqP6gM+ASiaTKp/Pq+vi6OhIjYyM2CO7D9zViVl7hG1EpA/4AIwkk0nm5uYIhYyvhSwsLLC1tQXwFRhTSu3r+PEsGP6I/hSNRoeGh4fPf3wYoVqtsru7S6VSKQIPdMUC3qb0X9P7MaAymYzx6ZzNZu2p/MprnCZ3Sz8N+mpE1auDYHvodwLBficQ7HcCwX4nEOx3AsF+p+MEm9yp9wDs7OwwMTFh0C3kcjn7Z8SrL5OCnwOk02kmJycNuoVIJMLKygqcJg4vJ7bdYGjznwJqXV1dant723gCoFQqqWg0aicBHnmJ1fMIi4gFvANCg4ODFAoFCgV3icRWGB0dZWNjA2BZRO4rpb5pOTIwuh+54Xy0iHwHbrVlhIF7AIlEgu7ubgPurqZYLHJycpLgNEX8y21/Y4tWLpcjFouZcteQWCxmVye16Lj3cMcJ1lmkpoE67S+knbclzooKzcx15UFEyoDZ0oIZ4kqpcrNG2lP6/H8u2mluyzod9wxrv5bi8bjJOG4MnRF+zelC8S/xBmjp5WykXPo/0XHPcCDY7wSC/U4g2O/8BtFWHbaczITCAAAAAElFTkSuQmCC'),
            knight: stringToImage('data:image/png;base64,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'),
            bishop: stringToImage('data:image/png;base64,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'),
            queen: stringToImage('data:image/png;base64,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'),
            king: stringToImage('data:image/png;base64,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'),
        },
        black: {
            pawn: stringToImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAA6/NlyAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAKaSURBVGiB7Zo9axVBFIafNyYoGhSNYFDUoI1CGtEgooIo/oGAhWApWlhoivgLgp32tlqJBEEsBMXGr0ILkYiVhRaCICL4gUXisbi5QaIkOzvnzL25975wujnvnIezOzs7uzIzukl9rS6gtHrAna4ecKerB9zp6jrg/lZMKmknMAbsAF4DL83sa5HJzaxYACPAA8AWxSxwBVgdXYNKbS0lHQbuA4NLDJsBDpnZ96g6itzDkgaBGywNCzAKXI2spdSiNQnsqjj2nKR9UYWUAj4SPL6ySgGndmzFd/hn8PjKKgX8Jnh8ZZUCvpMw9jdwN6qQcGBJJ4GphJQ+YFrSlpB6IjcekvYAL1j++fs/PQaOm9msZ01hHZY0AExTDxbgKI3tpqvCOizpDHAz0+YXsN3MPjuUBMTewxcdPNYA5x18FhQCLGkDcMDJ7oSTDxDX4ar75ira7egVBrzN0WtYkrzMooDfOnrNmOPKGgJsZu+AT052z518gNhV+qmTzzMnHyAW+JGDxxzwxMFnQZHA12lsD3N02cw+eBSzoOBTymHgI/+eUlaJmxE1Re6l1wIXgE01LY5JOuVYUkNBnd0LvKdeZxfHPRzPqyNgtzrCNuMW8y86bQUMrAdeOcM241pbAQMDwMMg2GZMtBPwVDCs0TjvGms5MI1TjS8FgA24nVOr12PpLLDRyWs5jUuq/cqYDSypH7iU65OgPmCidrbD5XyaMpfy3/EDGGrVJT3p4JGq5i4uWVnAkkYI/PC1jMbrJOV2+GBmfo5GJa1LTVrJwKuA/alJucCjmfm5Sp4/F3goMz9XyfP3gBO1OTM/V8nz1wae/zqYvEo6K3k7m/Pr4RytewY39S01odifeO2irvubtgfc6eoBd7q6DvgP/gH4mMhDFawAAAAASUVORK5CYII='),
            rook: stringToImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAA6/NlyAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAJSSURBVGiB7ZqxixNBFMa/b/HOFBGbSDRgoRCQK01IndrG1j/BI0QQ7JLG2sIg5AQ7QbCystByIYVFKq1sUh0kmyKolWE37rPwxDOG252ZzcabnR+8YsObt+/bmXkzO1mKCIqEt+sE8sYJth0n2HacYNtxgm1HWzDJEsn3JGWDHZGkgr+Q/ETyyob7HJKM0/onIiJaBqANQM6wq4r+AuD+hvsEKv5JdkH5CaXnLslvp64PUrRpkry39lspw5y22sN5mHIPu6JlO+ddMJNd/sZE8CXf97VrgKnN53N4nnddNWnqnniQ3G+1Wp9rtdoNrQCGLBaLr6PR6KaIfFFqaPKUAewBeIH8q/M7AJd1ctbu4dOQfADgab/f95rNpnG8TUynU3Q6HYjIAMAjEfmhEyeTjYeIPCO5H0XRk+VymUXIfwjDECLySkQeGgXKqoggn42I8kbDbTx2nUDeOMG24wTbjhNsO06w7TjBtuME206WB/EXG40G6vV6hiH/EAQBfN8vGwfK8H34te/7si1ms5mQ/GicZ0ZibwEIkc951h2TXI2HNMlSpVJ5MxgM9spl8xF3FnEco9frvSR5W0SOdWJkMYffrlargzAMsa3zrN9EUYQwDCsAPpCsi8h31RjGp5YkAwBVoyB6XBORQLVR4Zalwgk2nsPVatVrt9tY+8Jhq4zHY0wmE73GGkvQIYAYJ8tEt9s1X2QVGQ6H60vVEU7qUZIpF60dFqkkUhWxws1hJ9h2dAQ/xq9C8T/xHMA8jWMm/w+fJ9yQth0n2HacYNspnOCf287BmtabMhEAAAAASUVORK5CYII='),
            knight: stringToImage('data:image/png;base64,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'),
            bishop: stringToImage('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAA6/NlyAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAARpSURBVGiB7Zo/bFtVFMZ/x7EhUdN2cFSkDMSCdEnKgkSH0IAZACkgAgpL2yhCDGz8UZNgRYINhpQgQAgQIwNiARRRJJOJAVhAuEhtBUIijhpRZJyAGpw4jRMfhmcjU/XZ78XnvbhuPunIkt/1ud/ne8699517RVW5lRDZawJhY19wu2NfcLtjTwSLSEJEBkUk9P5D7VBEhkXkZyALXATyIvJcmBxQ1VAMuB8oAXoDS4XFQ8LaeIjIRWDQ5XEJSKjqlaB5hBLSItKLu1iAGPBgGFzCyuHbPbTpDJwFIQlW1Szwe4Nm34XBJcxZ+qU6z95T1V/DIBGm4C+Bj3Fm5Vr8CMyGxiKE5agTOAP8wY2XJAWKwDtAb+B8AhZ7J3C+jtDr7W/g4ZtSMHACyPkQW7Vt4PmbSjDwLHBtF2Jr7UOgo+UFA48A5SbFVu31lhYM9ABXGgmZnZ3VdDqtkUikkeAdYLiVBc97GblsNquqqn19fV5GeQk4bMXRbB0WkceAUY9t//fZAH3AK7smdh2iVo6A024PRISpqSkGB533h56eHgDm5uYoFAqsr68zMzPD2tqam4uTIvKyVsKoKRiFchfwDy5hGY/HdXt7W+thbGysUWifsOBqNcKPAt1uD1dXV0kmk/T39wPOyMbjcaanp1lZWSGfz5NOpxv18TTwbdNMjUb4DD6Wm6WlJVVVTSQSfpaoL1pp0rrNT+OtrS0AyuVyYH24wSqkY34ap1IpBgYGWF5eDqwPVxiF9DPY7Kzq2UetFNLncDb9QWLewomJYFVdBb628OWCIrBg4ciy4nEW56UhCLypqhsmnizyoiaXp7HP3XNAxIyjpeCK6LNAaWhoSHO5nG5ubvqyjY0NnZycrIr9Cjhkyc9yL11FCjja2dn5ZDwep6Ojw9ePVZVoNAqwCJxSVdcN9m5gftQiIi8CbwNEo9Eqec8ol8v/bUyAeVV9ypSgcTjfjTOjWubwaUuO1nXpUeyPTE5aOjPN4fHx8dGRkREiEbv/MZPJPCQiola5ZxjOsYWFhS01RrFY1O7u7geseFqOcGxiYiKWTCa9lm48IZPJUCgUDlj5M52lRSSPU7m0xjFVvWThyHrS+tzYH8AlwO5k0So3KpESAV6gTn3Lh5WBDzDeaQVyx0NEDgKP49ShhnHC3EtirwEXgM+AT1XVV4XAE7fdChZnZuoFjuBUI2rtQOX7OyqfvTiHa0dc3G3gFOiywJ8VywFXcS681NpV4LKqlnbF26tgETkOPAHcC9wFJPB2dyMI7OBcoVgEfgLeVdVFT7/0kJeHgE8IvoTTjJWAV6kMYF09DcR2Ad+0gCCvlgbizQh+vwVE+LXzzey0Cg2e+8VvwA/A9zhL133AceAYdvv6Qr29d8NJS0ROAW/gzLwXgF+AyzWWw1lyokBHxQRnYqnaNpBT1b9c+ujCOSWs9VH9A2p97AAHK22rdhS4BzgMvAW8pqrXXPUEsQ7vBby+UbWNYK/YvxHf7tgX3O645QT/Cym/GLJbVZClAAAAAElFTkSuQmCC'),
            queen: stringToImage('data:image/png;base64,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'),
            king: stringToImage('data:image/png;base64,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'),
        },
    };
    function stringToImage(data) {
        const image = new Image();
        imagesLoading++;
        image.onload = () => imagesLoading--;
        image.src = data;
        return image;
    }
    function squareNbToXY(squareNb) {
        return {
            x: exports.squareSize * (squareNb % 8),
            y: exports.canvas.height - exports.squareSize - exports.squareSize * Math.floor(squareNb / 8),
        };
    }
    function drawBoard(game, selectedSquareNb, highlightedSquareNbs) {
        for (let squareNb = 0; squareNb < 64; squareNb++) {
            const { x, y } = squareNbToXY(squareNb);
            ctx.fillStyle = getSquareColor(squareNb) === 'dark' ? darkSquares : lightSquares;
            ctx.fillRect(x, y, exports.squareSize, exports.squareSize);
            if (selectedSquareNb === squareNb) {
                ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
                ctx.fillRect(x, y, exports.squareSize, exports.squareSize);
            }
            if (highlightedSquareNbs[squareNb]) {
                ctx.fillStyle = 'rgba(255, 80, 70, 0.75)';
                ctx.fillRect(x, y, exports.squareSize, exports.squareSize);
            }
        }
        drawCoordinates();
        drawPieces(game);
        if (selectedSquareNb !== null)
            drawPossibleMoves(game, selectedSquareNb);
    }
    exports.drawBoard = drawBoard;
    function drawPossibleMoves(game, selectedSquareNb) {
        const piece = game.currentBoard.squares[selectedSquareNb];
        const moves = piece.possibleMoves(selectedSquareNb, game.currentBoard, {});
        for (let move of moves) {
            const { x, y } = squareNbToXY(move.endSquareNb);
            const isOccupied = game.currentBoard.squares[move.endSquareNb] !== null;
            ctx.beginPath();
            ctx.arc(x + exports.squareSize / 2, y + exports.squareSize / 2, isOccupied ? exports.squareSize / 2 : exports.squareSize / 8, 0, Math.PI * 2);
            ctx.fillStyle = isOccupied ? 'rgba(30, 0, 100, 0.25)' : 'rgba(0, 0, 0, 0.2)';
            ctx.fill();
        }
    }
    function getSquareColor(squareNb) {
        return ((squareNb >> 3) + squareNb) % 2 === 0 ? 'dark' : 'light';
    }
    function drawCoordinates() {
        const fontSize = 14;
        ctx.font = `${fontSize}px Arial`;
        for (let file = 0; file < 8; file++) {
            ctx.fillStyle = getSquareColor(file) === 'dark' ? lightSquares : darkSquares;
            ctx.fillText(String.fromCharCode(97 + file), exports.squareSize * (file + 1) - fontSize, exports.canvas.height - fontSize * 0.4);
        }
        for (let rank = 0; rank < 8; rank++) {
            ctx.fillStyle = getSquareColor(rank * 8) === 'dark' ? lightSquares : darkSquares;
            ctx.fillText(String(rank + 1), fontSize * 0.4, exports.squareSize * (7 - rank) + fontSize * 1.2);
        }
    }
    async function drawPieces(game) {
        while (imagesLoading > 0) {
            await (0, utils_4.waitOneMillisecondAsync)();
        }
        for (let squareNb = 0; squareNb < 64; squareNb++) {
            const piece = game.currentBoard.squares[squareNb];
            if (!piece)
                continue;
            const { x, y } = squareNbToXY(squareNb);
            const image = piecesImages[piece.color][piece.name];
            const offset = (exports.squareSize - pieceSize) / 2;
            ctx.drawImage(image, x + offset, y + offset, pieceSize, pieceSize);
        }
    }
});
define("chess", ["require", "exports", "draw", "models/game"], function (require, exports, draw_1, game_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Chess = void 0;
    class Chess {
        //public mode: "1v1" | "1vC" | "CvC"
        constructor() {
            this.game = new game_1.Game();
            this.selectedSquareNb = null;
            this.highlightedSquareNbs = new Array(64).fill(false);
            this.draw();
        }
        draw() {
            this.toggleActions();
            (0, draw_1.drawBoard)(this.game, this.selectedSquareNb, this.highlightedSquareNbs);
            this.updateMovesPanel();
            this.toggleNextPlayer();
        }
        clickedSquare(x, y, clickType) {
            const squareNb = Math.floor(x / draw_1.squareSize) + Math.floor((draw_1.squareSize * 8 - (y + 1)) / draw_1.squareSize) * 8;
            if (clickType === 'left') {
                this.highlightedSquareNbs.fill(false);
                const piece = this.game.currentBoard.squares[squareNb];
                //Deselects the square if it was already selected
                if (squareNb === this.selectedSquareNb) {
                    this.selectedSquareNb = null;
                }
                //Makes a move if possible
                else if (this.selectedSquareNb !== null && this.getMove(squareNb)) {
                    const move = this.getMove(squareNb);
                    this.game.addMove(move);
                    this.selectedSquareNb = null;
                }
                //Deselects the square if it is empty
                else if (piece === null) {
                    this.selectedSquareNb = null;
                }
                //Selects the square if it contains a piece of the current player
                else if (piece.color === this.game.currentBoard.colorToMove) {
                    this.selectedSquareNb = squareNb;
                }
            }
            else {
                this.selectedSquareNb = null;
                this.highlightedSquareNbs[squareNb] = !this.highlightedSquareNbs[squareNb];
            }
            this.draw();
        }
        //Calls the possibleMoves() method of the piece on the selected square
        getMove(endSquareNb) {
            if (this.selectedSquareNb === null)
                return;
            const piece = this.game.currentBoard.squares[this.selectedSquareNb];
            const possibleMoves = piece.possibleMoves(this.selectedSquareNb, this.game.currentBoard, {});
            return possibleMoves.find((move) => move.endSquareNb === endSquareNb);
        }
        toggleNextPlayer() {
            const isWhite = this.game.currentBoard.colorToMove === 'white';
            document.getElementById('white_to_move').setAttribute('style', isWhite ? '' : 'display: none;');
            document.getElementById('black_to_move').setAttribute('style', isWhite ? 'display: none;' : '');
        }
        jumpToMove(moveNb) {
            this.selectedSquareNb = null;
            this.game.jumpToMove(moveNb);
            this.draw();
        }
        undo() {
            this.selectedSquareNb = null;
            this.game.undo();
            this.draw();
        }
        redo() {
            this.selectedSquareNb = null;
            this.game.redo();
            this.draw();
        }
        reset() {
            this.selectedSquareNb = null;
            this.game = new game_1.Game();
            this.draw();
        }
        toggleActions() {
            if (this.game.canUndo)
                document.getElementById('undo').removeAttribute('disabled');
            else
                document.getElementById('undo').setAttribute('disabled', '');
            if (this.game.canRedo)
                document.getElementById('redo').removeAttribute('disabled');
            else
                document.getElementById('redo').setAttribute('disabled', '');
        }
        updateMovesPanel() {
            let html = '';
            const moves = document.getElementById('moves');
            this.game.moves.forEach((move, index) => {
                if (index % 2 === 0) {
                    html += `<div>${index / 2 + 1}.</div>`;
                }
                html +=
                    this.game.moveNb - 1 === index
                        ? `<div class="move currentMove">${move.notation}</div>`
                        : `<div class="move" onClick="window.chess.jumpToMove(${index + 1})">${move.notation}</div>`;
            });
            moves.innerHTML = html;
            const currentMove = document.getElementsByClassName('currentMove')[0];
            if (currentMove)
                currentMove.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    exports.Chess = Chess;
});
define("main", ["require", "exports", "draw", "chess"], function (require, exports, draw_2, chess_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const chess = new chess_1.Chess();
    draw_2.canvas.onmousedown = (event) => {
        const x = event.clientX - draw_2.canvas.getBoundingClientRect().x - draw_2.canvas.clientLeft;
        const y = event.clientY - draw_2.canvas.getBoundingClientRect().y - draw_2.canvas.clientTop;
        if (x >= 0 && y >= 0 && x < draw_2.squareSize * 8 && y < draw_2.squareSize * 8) {
            chess.clickedSquare(x, y, event.button === 0 ? 'left' : 'right');
        }
    };
    document.getElementById('undo').onclick = () => chess.undo();
    document.getElementById('redo').onclick = () => chess.redo();
    document.getElementById('reset').onclick = () => chess.reset();
    draw_2.canvas.addEventListener('contextmenu', (event) => event.preventDefault());
    //@ts-ignore
    window.chess = chess;
});
define("models/board.test", ["require", "exports", "models/board"], function (require, exports, board_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    describe('importFEN', () => {
        const boardFromFen = (fen) => {
            const board = new board_4.Board();
            board.importFEN(fen);
            return board;
        };
        it('imports a FEN', () => {
            const board = boardFromFen('rbk3n1/p7/8/8/8/8/7P/RBK3N1 b KQ - 0 0');
            expect(board.squares[56]?.name).toBe('rook');
        });
        it('imports another FEN', () => {
            const board = boardFromFen('8/8/8/2k5/2pP4/8/B7/4K3 b - d3 0 3');
            expect(board.squares.filter((piece) => piece !== null).length).toBe(5);
            expect(board.colorToMove).toEqual('black');
            expect(board.canCastle).toStrictEqual({
                white: {
                    kingSide: false,
                    queenSide: false,
                },
                black: {
                    kingSide: false,
                    queenSide: false,
                },
            });
            expect(board.enPassantTargetSquareNb).toBe(19);
        });
    });
    describe('possibleMoves', () => {
        const nbMoves = (fen) => {
            const board = new board_4.Board();
            board.importFEN(fen);
            return board.possibleMoves().length;
        };
        it('', () => expect(nbMoves('r6r/1b2k1bq/8/8/7B/8/8/R3K2R b KQ - 3 2')).toEqual(8));
        it('stops checks by en passant', () => expect(nbMoves('8/8/8/2k5/2pP4/8/B7/4K3 b - d3 0 3')).toEqual(8));
        it('', () => expect(nbMoves('r1bqkbnr/pppppppp/n7/8/8/P7/1PPPPPPP/RNBQKBNR w KQkq - 2 2')).toEqual(19));
        it('', () => expect(nbMoves('r3k2r/p1pp1pb1/bn2Qnp1/2qPN3/1p2P3/2N5/PPPBBPPP/R3K2R b KQkq - 3 2')).toEqual(5));
        it('', () => expect(nbMoves('2kr3r/p1ppqpb1/bn2Qnp1/3PN3/1p2P3/2N5/PPPBBPPP/R3K2R b KQ - 3 2')).toEqual(44));
        //it('includes all types of promotions', () => expect(nbMoves('rnb2k1r/pp1Pbppp/2p5/q7/2B5/8/PPPQNnPP/RNB1K2R w KQ - 3 9')).toEqual(39))
        it('', () => expect(nbMoves('2r5/3pk3/8/2P5/8/2K5/8/8 w - - 5 4')).toEqual(9));
    });
});
define("models/pieces/king.test", ["require", "exports", "models/board"], function (require, exports, board_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    describe('possibleMoves', () => {
        it('skips castlings in skipVerification mode', () => {
            const board = new board_5.Board();
            board.importFEN('4k2r/8/8/8/8/8/8/4K2R b Kk - 0 0');
            const kingSquareNb = 60;
            const king = board.squares[kingSquareNb];
            expect(king).toEqual(expect.objectContaining({ name: 'king', color: 'black' }));
            // If castlings were not skipped from opponent (= white) moves computation, our implementation of
            // castlings would result in a "Maximum call stack size exceeded" error.
            expect(() => king.possibleMoves(kingSquareNb, board, {})).not.toThrowError();
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tb2RlbHMvdHlwZXMudHMiLCIuLi9zcmMvbW9kZWxzL3V0aWxzLnRzIiwiLi4vc3JjL21vZGVscy9waWVjZXMvcGllY2UudHMiLCIuLi9zcmMvbW9kZWxzL21vdmUudHMiLCIuLi9zcmMvbW9kZWxzL3BpZWNlcy9iaXNob3AudHMiLCIuLi9zcmMvbW9kZWxzL3BpZWNlcy9raW5nLnRzIiwiLi4vc3JjL21vZGVscy9waWVjZXMva25pZ2h0LnRzIiwiLi4vc3JjL21vZGVscy9waWVjZXMvcGF3bi50cyIsIi4uL3NyYy9tb2RlbHMvcGllY2VzL3F1ZWVuLnRzIiwiLi4vc3JjL21vZGVscy9waWVjZXMvcm9vay50cyIsIi4uL3NyYy9tb2RlbHMvYm9hcmQudHMiLCIuLi9zcmMvbW9kZWxzL2dhbWUudHMiLCIuLi9zcmMvdXRpbHMudHMiLCIuLi9zcmMvZHJhdy50cyIsIi4uL3NyYy9jaGVzcy50cyIsIi4uL3NyYy9tYWluLnRzIiwiLi4vc3JjL21vZGVscy9ib2FyZC50ZXN0LnRzIiwiLi4vc3JjL21vZGVscy9waWVjZXMva2luZy50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0lDRUEsU0FBZ0Isa0JBQWtCLENBQUMsUUFBZ0I7UUFDL0MsT0FBTztZQUNILElBQUksRUFBRSxRQUFRLEdBQUcsQ0FBQztZQUNsQixJQUFJLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDO1NBQ2pDLENBQUE7SUFDTCxDQUFDO0lBTEQsZ0RBS0M7SUFFRCxTQUFnQixrQkFBa0IsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQVk7UUFDdkQsT0FBTyxJQUFJLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQTtJQUMxQixDQUFDO0lBRkQsZ0RBRUM7SUFFRCxTQUFnQixxQkFBcUIsQ0FBQyxRQUFnQjtRQUNsRCxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUks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