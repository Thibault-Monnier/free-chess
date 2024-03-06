define("models/types", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("models/utils", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.calculateAxisOffset = exports.isBetweenSquares = exports.createEmptyAttackTable = exports.coordinatesToSquareNb = exports.squareNbToCoordinates = exports.fileRankToSquareNb = exports.squareNbToFileRank = exports.invertColor = void 0;
    function invertColor(color) {
        return color === 'white' ? 'black' : 'white';
    }
    exports.invertColor = invertColor;
    function squareNbToFileRank(squareNb) {
        const file = squareNb % 8;
        const rank = squareNb >= 0 ? Math.floor(squareNb / 8) : Math.ceil(squareNb / 8);
        return {
            file,
            rank,
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
    function createEmptyAttackTable() {
        return { attackedSquares: new Array(64).fill(false), pinnedPieces: [], kingAttackers: [] };
    }
    exports.createEmptyAttackTable = createEmptyAttackTable;
    // Tests if a square is on the segment between two points
    function isBetweenSquares(squareNbFrom, testedSquareNb, squareNbTo) {
        const fromSquare = squareNbToFileRank(squareNbFrom);
        const toSquare = squareNbToFileRank(squareNbTo);
        const squareTested = squareNbToFileRank(testedSquareNb);
        const direction = {
            file: Math.sign(toSquare.file - fromSquare.file),
            rank: Math.sign(toSquare.rank - fromSquare.rank),
        };
        let currentSquare = fromSquare;
        currentSquare.file += direction.file;
        currentSquare.rank += direction.rank;
        while (currentSquare.file !== toSquare.file || currentSquare.rank !== toSquare.rank) {
            if (currentSquare.file < 0 || currentSquare.file > 7 || currentSquare.rank < 0 || currentSquare.rank > 7) {
                return false;
            }
            if (currentSquare.file === squareTested.file && currentSquare.rank === squareTested.rank)
                return true;
            currentSquare.file += direction.file;
            currentSquare.rank += direction.rank;
        }
        return false;
    }
    exports.isBetweenSquares = isBetweenSquares;
    function calculateAxisOffset(squareNbFrom, squareNbTo) {
        const fromSquare = squareNbToFileRank(squareNbFrom);
        const toSquare = squareNbToFileRank(squareNbTo);
        return fileRankToSquareNb({
            file: Math.sign(toSquare.file - fromSquare.file),
            rank: Math.sign(toSquare.rank - fromSquare.rank),
        });
    }
    exports.calculateAxisOffset = calculateAxisOffset;
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
            if (endSquareNb < 0 || endSquareNb > 63)
                return null;
            const { file } = (0, utils_1.squareNbToFileRank)(startSquareNb);
            if (file + offset.file < 0)
                return null;
            if (file + offset.file > 7)
                return null;
            return endSquareNb;
        }
        createMovesForRepeatedOffsets(startSquareNb, offsets, board, opponentAttackTable, PieceLetter) {
            const moves = [];
            for (let offset of offsets) {
                let endSquareNb = startSquareNb;
                while (true) {
                    endSquareNb = this.addOffset(endSquareNb, offset);
                    if (endSquareNb === null)
                        break;
                    this.createMove(moves, startSquareNb, endSquareNb, board, opponentAttackTable, PieceLetter);
                    if (board.squares[endSquareNb])
                        break;
                }
            }
            return moves;
        }
        createMove(moves, startSquareNb, endSquareNb, board, opponentAttackTable, letter, postMove, isPromotion = false) {
            if (endSquareNb === null)
                return;
            let moveType = isPromotion ? 'promotion' : 'normal';
            if (board.squares[startSquareNb]?.name === 'pawn' && board.enPassantTargetSquareNb === endSquareNb) {
                // En passant capture
                moveType = 'capture';
                if (!this.isEnPassantLegal(startSquareNb, board))
                    return;
            }
            const endSquarePiece = board.squares[endSquareNb];
            if (!endSquarePiece || endSquarePiece.color !== this.color) {
                const endBoard = new board_1.Board(board, { switchColor: true, resetEnPassant: true });
                if (endSquarePiece) {
                    moveType = isPromotion ? 'capturePromotion' : 'capture';
                    endSquarePiece.eaten(endBoard);
                }
                endBoard.squares[endSquareNb] = endBoard.squares[startSquareNb];
                endBoard.squares[startSquareNb] = null;
                if (postMove)
                    postMove(endBoard);
                if (this.inCheckAfterMove(startSquareNb, endSquareNb, board, endBoard, opponentAttackTable))
                    return;
                const move = new move_1.Move(this, startSquareNb, endSquareNb, endBoard, moveType);
                moves.push(move);
            }
        }
        calculateAttackTable(startSquareNb, board, table, offsets, isSlidingPiece) {
            for (let offset of offsets) {
                let endSquareNb = startSquareNb;
                do {
                    endSquareNb = this.addOffset(endSquareNb, offset);
                    if (endSquareNb === null)
                        break;
                    table.attackedSquares[endSquareNb] = true;
                    const piece = board.squares[endSquareNb];
                    if (piece) {
                        if (piece.color !== this.color && piece.name === 'king') {
                            table.kingAttackers.push(startSquareNb);
                        }
                        if (isSlidingPiece) {
                            if (piece.color !== this.color && this.isPiecePinned(endSquareNb, board, offset)) {
                                table.pinnedPieces.push({
                                    squareNb: endSquareNb,
                                    offset,
                                });
                            }
                            break;
                        }
                    }
                } while (isSlidingPiece);
            }
        }
        isPiecePinned(startSquareNb, board, offset) {
            const kingSquareNb = board.squares.findIndex((piece) => piece?.name === 'king' && piece.color !== this.color);
            return this.firstPieceOnAxis(startSquareNb, board, offset) === board.squares[kingSquareNb];
        }
        firstPieceOnAxis(startSquareNb, board, offset) {
            let endSquareNb = startSquareNb;
            while (true) {
                endSquareNb = this.addOffset(endSquareNb, offset);
                if (endSquareNb === null)
                    break;
                const piece = board.squares[endSquareNb];
                if (piece)
                    return piece;
            }
            return null;
        }
        inCheckAfterMove(startSquareNb, endSquareNb, board, endBoard, opponentAttackTable) {
            const kingAttackers = opponentAttackTable.kingAttackers;
            const piece = board.squares[startSquareNb];
            if (piece.name === 'king') {
                if (opponentAttackTable.attackedSquares[endSquareNb])
                    return true;
                // If the king is attacked by a sliding piece, check that it does not move alongside the attack axis
                for (let kingAttacker of kingAttackers) {
                    if (!board.squares[kingAttacker]?.isSliding)
                        continue;
                    const offset = (0, utils_1.calculateAxisOffset)(kingAttacker, startSquareNb);
                    if (endSquareNb === startSquareNb + offset)
                        return true;
                }
            }
            else {
                if (!kingAttackers.length && !opponentAttackTable.pinnedPieces.length)
                    return false;
                const pinnedPiece = opponentAttackTable.pinnedPieces.find((pinnedPiece) => pinnedPiece.squareNb === startSquareNb);
                if (pinnedPiece && (startSquareNb - endSquareNb) % (0, utils_1.fileRankToSquareNb)(pinnedPiece.offset) !== 0)
                    return true;
                if (kingAttackers.length > 1)
                    return true;
                if (kingAttackers.length === 1) {
                    const kingAttackerSquareNb = kingAttackers[0];
                    const kingSquareNb = endBoard.squares.findIndex((piece) => piece?.name === 'king' && piece.color === this.color);
                    const kingAttacker = board.squares[kingAttackerSquareNb];
                    let isAttackStopped = false;
                    // The move captures the attacking piece (normal capture + en passant)
                    if (endBoard.squares[kingAttackerSquareNb] !== board.squares[kingAttackerSquareNb]) {
                        isAttackStopped = true;
                    }
                    // The move intersects the attack axis
                    if (!isAttackStopped &&
                        kingAttacker.isSliding &&
                        (0, utils_1.isBetweenSquares)(kingAttackerSquareNb, endSquareNb, kingSquareNb)) {
                        isAttackStopped = true;
                    }
                    if (!isAttackStopped)
                        return true;
                }
            }
            return false;
        }
        isEnPassantLegal(startSquareNb, board) {
            const kingSquareNb = board.squares.findIndex((piece) => piece?.name === 'king' && piece.color === this.color);
            const fromSquare = (0, utils_1.squareNbToFileRank)(startSquareNb);
            const toSquare = (0, utils_1.squareNbToFileRank)(kingSquareNb);
            const direction = {
                file: toSquare.file - fromSquare.file,
                rank: toSquare.rank - fromSquare.rank,
            };
            const offset = {
                file: Math.sign(direction.file),
                rank: Math.sign(direction.rank),
            };
            if (offset.file !== 0 &&
                offset.rank !== 0 &&
                Math.abs(direction.file) !== Math.abs(direction.rank / offset.rank)) {
                // The pawn-to-king offset isn't a possible movement offset
                return true;
            }
            else {
                const offset = (0, utils_1.calculateAxisOffset)(startSquareNb, kingSquareNb);
                let squareNb = startSquareNb;
                // Check that there is a enemy sliding piece attacking the pawn through the pawn-to-king offset
                // "offset" is the pawn-to-king offset so it needs to be reversed
                const firstPieceOnAxis = this.firstPieceOnAxis(squareNb, board, (0, utils_1.squareNbToFileRank)(-offset));
                if (firstPieceOnAxis && firstPieceOnAxis.color !== this.color && firstPieceOnAxis.isSliding) {
                    if (Math.abs(offset) === 1 || Math.abs(offset) === 8) {
                        // The offset is a file or rank offset
                        if (firstPieceOnAxis.name !== 'rook' && firstPieceOnAxis.name !== 'queen')
                            return true;
                    }
                    else {
                        // The offset is a diagonal offset
                        if (firstPieceOnAxis.name !== 'bishop' && firstPieceOnAxis.name !== 'queen')
                            return true;
                    }
                    const kingSquareNb = board.squares.findIndex((piece) => piece?.name === 'king' && piece.color === this.color);
                    if (this.firstPieceOnAxis(squareNb + offset, board, (0, utils_1.squareNbToFileRank)(offset)) ===
                        board.squares[kingSquareNb]) {
                        // Check there is nothing between the pawn and the king
                        // Skip the first square (the pawn's square) so that the captured pawn's square isn't checked
                        return false;
                    }
                }
                // The first piece on the offset can't be pinning the pawn
                return true;
            }
        }
    }
    exports.Piece = Piece;
});
define("models/move", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Move = void 0;
    class Move {
        constructor(piece, startSquareNb, endSquareNb, endBoard, type) {
            this.piece = piece;
            this.startSquareNb = startSquareNb;
            this.endSquareNb = endSquareNb;
            this.endBoard = endBoard;
            this.type = type;
        }
    }
    exports.Move = Move;
});
define("models/pieces/bishop", ["require", "exports", "models/pieces/piece"], function (require, exports, piece_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Bishop = void 0;
    class Bishop extends piece_1.Piece {
        get notationChar() {
            return 'B';
        }
        constructor(color) {
            super('bishop', color);
        }
        possibleMoves(startSquareNb, board, opponentAttackTable) {
            return this.createMovesForRepeatedOffsets(startSquareNb, OFFSETS, board, opponentAttackTable, 'B');
        }
        updateAttackTable(startSquareNb, board, table) {
            this.calculateAttackTable(startSquareNb, board, table, OFFSETS, true);
        }
        get isSliding() {
            return true;
        }
    }
    exports.Bishop = Bishop;
    const OFFSETS = [
        { file: 1, rank: 1 },
        { file: 1, rank: -1 },
        { file: -1, rank: 1 },
        { file: -1, rank: -1 },
    ];
});
define("models/pieces/king", ["require", "exports", "models/board", "models/move", "models/pieces/piece"], function (require, exports, board_2, move_2, piece_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.King = void 0;
    class King extends piece_2.Piece {
        get notationChar() {
            return 'K';
        }
        constructor(color) {
            super('king', color);
        }
        possibleMoves(startSquareNb, board, opponentAttackTable) {
            const moves = [];
            for (let offset of OFFSETS) {
                const endSquareNb = this.addOffset(startSquareNb, offset);
                this.createMove(moves, startSquareNb, endSquareNb, board, opponentAttackTable, this.notationChar, (endBoard) => {
                    const canCastle = endBoard.canCastle[this.color];
                    canCastle.queenSide = false;
                    canCastle.kingSide = false;
                });
            }
            // Castling
            const canCastle = board.canCastle[this.color];
            if (canCastle.queenSide) {
                const isClearPath = this.areSquaresClear(board, opponentAttackTable, startSquareNb, [
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
                const isClearPath = this.areSquaresClear(board, opponentAttackTable, startSquareNb, [
                    startSquareNb + 1,
                    startSquareNb + 2,
                ]);
                if (isClearPath) {
                    const move = this.createCastling(board, startSquareNb, false);
                    moves.push(move);
                }
            }
            return moves;
        }
        areSquaresClear(board, opponentAttackTable, startSquareNb, squareNbs) {
            return (squareNbs.every((squareNb) => !board.squares[squareNb]) &&
                [startSquareNb, ...squareNbs].every((squareNb) => !opponentAttackTable.attackedSquares[squareNb]));
        }
        createCastling(startBoard, startSquareNb, isLongCastle) {
            const endBoard = new board_2.Board(startBoard, { switchColor: true, resetEnPassant: true });
            endBoard.canCastle[this.color][isLongCastle ? 'queenSide' : 'kingSide'] = false;
            const rookStartPosition = startSquareNb + (isLongCastle ? -4 : 3);
            const endSquareNb = startSquareNb + (isLongCastle ? -2 : 2);
            endBoard.squares[endSquareNb] = endBoard.squares[startSquareNb];
            endBoard.squares[endSquareNb + (isLongCastle ? 1 : -1)] = endBoard.squares[rookStartPosition];
            endBoard.squares[startSquareNb] = null;
            endBoard.squares[rookStartPosition] = null;
            const moveNotation = isLongCastle ? 'O-O-O' : 'O-O';
            return new move_2.Move(startBoard.squares[startSquareNb], startSquareNb, endSquareNb, endBoard, isLongCastle ? 'longCastle' : 'shortCastle');
        }
        updateAttackTable(startSquareNb, board, table) {
            this.calculateAttackTable(startSquareNb, board, table, OFFSETS, false);
        }
        get isSliding() {
            return false;
        }
    }
    exports.King = King;
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
});
define("models/pieces/knight", ["require", "exports", "models/pieces/piece"], function (require, exports, piece_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Knight = void 0;
    class Knight extends piece_3.Piece {
        get notationChar() {
            return 'N';
        }
        constructor(color) {
            super('knight', color);
        }
        possibleMoves(startSquareNb, board, opponentAttackTable) {
            const moves = [];
            for (let offset of OFFSETS) {
                const endSquareNb = this.addOffset(startSquareNb, offset);
                this.createMove(moves, startSquareNb, endSquareNb, board, opponentAttackTable, this.notationChar);
            }
            return moves;
        }
        updateAttackTable(startSquareNb, board, table) {
            this.calculateAttackTable(startSquareNb, board, table, OFFSETS, false);
        }
        get isSliding() {
            return false;
        }
    }
    exports.Knight = Knight;
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
});
define("models/pieces/queen", ["require", "exports", "models/pieces/piece"], function (require, exports, piece_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Queen = void 0;
    class Queen extends piece_4.Piece {
        get notationChar() {
            return 'Q';
        }
        constructor(color) {
            super('queen', color);
        }
        possibleMoves(startSquareNb, board, opponentAttackTable) {
            return this.createMovesForRepeatedOffsets(startSquareNb, OFFSETS, board, opponentAttackTable, 'Q');
        }
        updateAttackTable(startSquareNb, board, table) {
            this.calculateAttackTable(startSquareNb, board, table, OFFSETS, true);
        }
        get isSliding() {
            return true;
        }
    }
    exports.Queen = Queen;
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
});
define("models/pieces/pawn", ["require", "exports", "models/utils", "models/pieces/piece", "models/pieces/queen"], function (require, exports, utils_2, piece_5, queen_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Pawn = void 0;
    class Pawn extends piece_5.Piece {
        get notationChar() {
            return '';
        }
        constructor(color) {
            super('pawn', color);
        }
        possibleMoves(startSquareNb, board, opponentAttackTable) {
            const moves = [];
            // Basic moves
            const moveOneSquareForward = this.addOffset(startSquareNb, (0, utils_2.squareNbToFileRank)(8 * this.direction));
            const moveTwoSquaresForward = this.addOffset(startSquareNb, (0, utils_2.squareNbToFileRank)(16 * this.direction));
            const { rank: startRank } = (0, utils_2.squareNbToFileRank)(startSquareNb);
            const promotionStartRank = this.color === 'white' ? 6 : 1;
            if (moveOneSquareForward !== null && board.squares[moveOneSquareForward] === null) {
                // Advance one square if not eligible for promotion
                if (startRank !== promotionStartRank) {
                    this.createMove(moves, startSquareNb, moveOneSquareForward, board, opponentAttackTable, this.notationChar);
                }
                // Advance two squares
                if (moveTwoSquaresForward !== null &&
                    board.squares[moveTwoSquaresForward] === null &&
                    (this.color === 'white' ? startRank === 1 : startRank === 6)) {
                    this.createMove(moves, startSquareNb, moveTwoSquaresForward, board, opponentAttackTable, this.notationChar, (endBoard) => {
                        endBoard.enPassantTargetSquareNb = moveOneSquareForward;
                    });
                }
            }
            const createPromotionMove = (endSquareNb) => {
                this.createMove(moves, startSquareNb, endSquareNb, board, opponentAttackTable, this.notationChar, (endBoard) => {
                    endBoard.squares[endSquareNb] = new queen_1.Queen(this.color);
                }, true);
            };
            // Forward promotion. The case where the promotion is a capture is dealt within the capture loop
            if (moveOneSquareForward !== null &&
                board.squares[moveOneSquareForward] === null &&
                startRank === promotionStartRank) {
                createPromotionMove(moveOneSquareForward);
            }
            // Basic captures
            for (let offset of this.captureOffsets) {
                const endSquareNb = this.addOffset(startSquareNb, offset);
                if (endSquareNb !== null &&
                    board.squares[endSquareNb] &&
                    board.squares[endSquareNb].color !== this.color) {
                    if (startRank === promotionStartRank) {
                        createPromotionMove(endSquareNb);
                    }
                    else {
                        this.createMove(moves, startSquareNb, endSquareNb, board, opponentAttackTable, this.notationChar);
                    }
                }
            }
            // En passant captures
            if (board.enPassantTargetSquareNb !== null) {
                const enPassantTargetSquareNb = board.enPassantTargetSquareNb;
                const offsetToTarget = enPassantTargetSquareNb - startSquareNb;
                if (offsetToTarget === 7 * this.direction || offsetToTarget === 9 * this.direction) {
                    this.createMove(moves, startSquareNb, enPassantTargetSquareNb, board, opponentAttackTable, this.notationChar, (endBoard) => {
                        endBoard.squares[enPassantTargetSquareNb - 8 * this.direction] = null;
                    });
                }
            }
            return moves;
        }
        updateAttackTable(startSquareNb, board, table) {
            this.calculateAttackTable(startSquareNb, board, table, this.captureOffsets, false);
        }
        get isSliding() {
            return false;
        }
        get direction() {
            return this.color === 'white' ? 1 : -1;
        }
        get captureOffsets() {
            return [
                { file: -1, rank: this.direction },
                { file: 1, rank: this.direction },
            ];
        }
    }
    exports.Pawn = Pawn;
});
define("models/pieces/rook", ["require", "exports", "models/pieces/piece"], function (require, exports, piece_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Rook = void 0;
    class Rook extends piece_6.Piece {
        get notationChar() {
            return 'R';
        }
        constructor(color) {
            super('rook', color);
        }
        possibleMoves(startSquareNb, board, opponentAttackTable) {
            const moves = this.createMovesForRepeatedOffsets(startSquareNb, OFFSETS, board, opponentAttackTable, 'R');
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
        updateAttackTable(startSquareNb, board, table) {
            this.calculateAttackTable(startSquareNb, board, table, OFFSETS, true);
        }
        get isSliding() {
            return true;
        }
    }
    exports.Rook = Rook;
    const OFFSETS = [
        { file: 1, rank: 0 },
        { file: 0, rank: 1 },
        { file: 0, rank: -1 },
        { file: -1, rank: 0 },
    ];
});
define("models/board", ["require", "exports", "models/pieces/bishop", "models/pieces/king", "models/pieces/knight", "models/pieces/pawn", "models/pieces/queen", "models/pieces/rook", "models/utils"], function (require, exports, bishop_1, king_1, knight_1, pawn_1, queen_2, rook_1, utils_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Board = void 0;
    class Board {
        constructor(boardOrFEN, options) {
            this.colorToMove = 'white';
            this.canCastle = {
                white: { queenSide: false, kingSide: false },
                black: { queenSide: false, kingSide: false },
            };
            this.enPassantTargetSquareNb = null;
            if (typeof boardOrFEN === 'string') {
                this.squares = new Array(64).fill(null);
                this.importFEN(boardOrFEN);
            }
            else if (boardOrFEN) {
                const board = boardOrFEN;
                this.squares = [...board.squares];
                this.colorToMove = options?.switchColor ? (0, utils_3.invertColor)(board.colorToMove) : board.colorToMove;
                this.canCastle = { white: { ...board.canCastle.white }, black: { ...board.canCastle.black } };
                this.enPassantTargetSquareNb = options?.resetEnPassant ? null : board.enPassantTargetSquareNb;
            }
            else {
                this.squares = new Array(64).fill(null);
                this.importFEN(Board.startBoardFEN);
            }
        }
        importFEN(FEN) {
            const piecesId = { r: rook_1.Rook, n: knight_1.Knight, b: bishop_1.Bishop, q: queen_2.Queen, k: king_1.King, p: pawn_1.Pawn };
            const [placement, colorToMove, canCastle, enPassantTargetSquare] = FEN.split(' ');
            this.squares = new Array(64).fill(null);
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
            const opponentAttackTable = this.createOpponentAttackTable();
            let moves = [];
            this.squares.forEach((piece, squareNb) => {
                if (piece && piece.color === this.colorToMove) {
                    moves = [...moves, ...piece.possibleMoves(squareNb, this, opponentAttackTable)];
                }
            });
            return moves;
        }
        get endOfGame() {
            if (this.possibleMoves().length === 0) {
                return this.isInCheck() ? 'checkmate' : 'stalemate';
            }
            else
                return null;
        }
        isInCheck(opponentAttackTable = this.createOpponentAttackTable()) {
            const kingSquareNb = this.squares.findIndex((piece) => piece?.name === 'king' && piece.color === this.colorToMove);
            return opponentAttackTable.attackedSquares[kingSquareNb];
        }
        createOpponentAttackTable() {
            const table = (0, utils_3.createEmptyAttackTable)();
            for (let squareNb = 0; squareNb < 64; squareNb++) {
                const piece = this.squares[squareNb];
                if (piece && piece.color !== this.colorToMove) {
                    piece.updateAttackTable(squareNb, this, table);
                }
            }
            return table;
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
    Board.startBoardFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 0';
});
define("models/game", ["require", "exports", "models/board", "models/utils"], function (require, exports, board_3, utils_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Game = void 0;
    class Game {
        constructor(FEN) {
            this._moves = [];
            this._moveNb = 0;
            this.startingBoard = FEN ? new board_3.Board(FEN) : new board_3.Board();
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
            return this._moves[this.getLastMoveIndex()];
        }
        addMove(move) {
            this._moves = this._moves.slice(0, this._moveNb);
            this._moves.push(move);
            this._moveNb++;
        }
        getLastMoveIndex() {
            return this.moves.length - 1;
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
        calculateMoveNotation(moveIndex = this.getLastMoveIndex()) {
            let notation = '';
            const move = this._moves[moveIndex];
            const piece = move.piece;
            const endBoard = move.endBoard;
            // Add the piece symbol / pawn file
            if (move.type === 'shortCastle') {
                notation += 'O-O';
            }
            else if (move.type === 'longCastle') {
                notation += 'O-O-O';
            }
            else {
                if (piece.name === 'pawn' && (move.type === 'capture' || move.type === 'capturePromotion')) {
                    // The pawn file is added only if it is a capture
                    notation += (0, utils_4.squareNbToCoordinates)(move.startSquareNb)[0];
                }
                else {
                    notation += piece.notationChar;
                }
            }
            // Add the start square coordinates if there are ambiguities
            // There can't be ambiguities for pawns because in case of a capture the column is already specified
            if (piece.name !== 'pawn') {
                const ambiguousStartSquareNbs = [];
                const boardBeforeMove = moveIndex > 0 ? this._moves[moveIndex - 1].endBoard : this.startingBoard;
                boardBeforeMove.possibleMoves().forEach((testedMove) => {
                    if (testedMove.piece.name === piece.name &&
                        testedMove.endSquareNb === move.endSquareNb &&
                        testedMove.startSquareNb !== move.startSquareNb) {
                        ambiguousStartSquareNbs.push(testedMove.startSquareNb);
                    }
                });
                if (ambiguousStartSquareNbs.length > 0) {
                    const files = ambiguousStartSquareNbs.map((squareNb) => (0, utils_4.squareNbToFileRank)(squareNb).file);
                    const ranks = ambiguousStartSquareNbs.map((squareNb) => (0, utils_4.squareNbToFileRank)(squareNb).rank);
                    const { file, rank } = (0, utils_4.squareNbToFileRank)(move.startSquareNb);
                    const coordinates = (0, utils_4.squareNbToCoordinates)(move.startSquareNb);
                    if (!files.some((theFile) => file === theFile)) {
                        notation += coordinates[0];
                    }
                    else if (!ranks.some((theRank) => rank === theRank)) {
                        notation += coordinates[1];
                    }
                    else {
                        notation += coordinates;
                    }
                }
            }
            // Add the capture symbol if it is a capture
            if (move.type === 'capture' || move.type === 'capturePromotion') {
                notation += 'x';
            }
            // Add the end square coordinates
            if (move.type !== 'shortCastle' && move.type !== 'longCastle') {
                const endSquareCoordinates = (0, utils_4.squareNbToCoordinates)(move.endSquareNb);
                notation += endSquareCoordinates;
            }
            // Add the promotion symbol if it is a promotion
            if (move.type === 'promotion' || move.type === 'capturePromotion') {
                notation += '=' + endBoard.squares[move.endSquareNb].notationChar;
            }
            // Add the check / checkmate / stalemate symbol
            if (endBoard.endOfGame === 'checkmate') {
                notation += '#';
            }
            else if (endBoard.isInCheck()) {
                notation += '+';
            }
            else if (endBoard.endOfGame === 'stalemate') {
                notation += '½';
            }
            return notation;
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
define("draw", ["require", "exports", "models/utils", "utils"], function (require, exports, utils_5, utils_6) {
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
    function drawBoard(game, selectedSquareNb, highlightedSquareNbs, bestMove) {
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
            if (bestMove?.startSquareNb === squareNb || bestMove?.endSquareNb === squareNb) {
                ctx.fillStyle = 'rgba(100, 255, 100, 0.75)';
                ctx.fillRect(x, y, exports.squareSize, exports.squareSize);
            }
        }
        drawCoordinates();
        if (bestMove)
            createBestMoveArrow(bestMove);
        drawPieces(game);
        if (selectedSquareNb !== null)
            drawPossibleMoves(game, selectedSquareNb);
    }
    exports.drawBoard = drawBoard;
    function drawPossibleMoves(game, selectedSquareNb) {
        const piece = game.currentBoard.squares[selectedSquareNb];
        const moves = piece.possibleMoves(selectedSquareNb, game.currentBoard, game.currentBoard.createOpponentAttackTable());
        for (let move of moves) {
            const { x, y } = squareNbToXY(move.endSquareNb);
            const isOccupied = game.currentBoard.squares[move.endSquareNb] !== null;
            ctx.beginPath();
            ctx.arc(x + exports.squareSize / 2, y + exports.squareSize / 2, isOccupied ? exports.squareSize / 2 : exports.squareSize / 8, 0, Math.PI * 2);
            ctx.fillStyle = isOccupied ? 'rgba(30, 0, 100, 0.25)' : 'rgba(0, 0, 0, 0.2)';
            ctx.fill();
        }
    }
    function createBestMoveArrow(move) {
        const startPosition = (0, utils_5.squareNbToFileRank)(move.startSquareNb);
        const endPosition = (0, utils_5.squareNbToFileRank)(move.endSquareNb);
        const width = 8;
        const color = 'rgba(50, 150, 50, 1)';
        const startCoordinates = {
            fromX: startPosition.file * exports.squareSize + exports.squareSize / 2,
            fromY: (7 - startPosition.rank) * exports.squareSize + exports.squareSize / 2,
        };
        const endCoordinates = {
            toX: endPosition.file * exports.squareSize + exports.squareSize / 2,
            toY: (7 - endPosition.rank) * exports.squareSize + exports.squareSize / 2,
        };
        drawArrow(startCoordinates, endCoordinates, width, color);
    }
    function drawArrow({ fromX, fromY }, { toX, toY }, width, color) {
        //variables to be used when creating the arrow
        var headlen = width * 2;
        var angle = Math.atan2(toY - fromY, toX - fromX);
        ctx.strokeStyle = color;
        //starting path of the arrow from the start square to the end square and drawing the stroke
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.lineWidth = width;
        ctx.stroke();
        //starting a new path from the head of the arrow to one of the sides of the point
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 7), toY - headlen * Math.sin(angle - Math.PI / 7));
        //path from the side point of the arrow, to the other side point
        ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 7), toY - headlen * Math.sin(angle + Math.PI / 7));
        //path from the side point back to the tip of the arrow, and then again to the opposite side point
        ctx.lineTo(toX, toY);
        ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 7), toY - headlen * Math.sin(angle - Math.PI / 7));
        //draws the paths created above
        ctx.stroke();
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
            await (0, utils_6.waitOneMillisecondAsync)();
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
define("models/evaluators/evaluator", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Evaluator = void 0;
    class Evaluator {
        constructor(board) {
            this.board = board;
        }
    }
    exports.Evaluator = Evaluator;
});
define("models/evaluators/pieceSquareTableEvaluator", ["require", "exports", "models/utils", "models/evaluators/evaluator"], function (require, exports, utils_7, evaluator_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.PieceSquareTableEvaluator = void 0;
    //Coefficients from https://www.chessprogramming.org/Simplified_Evaluation_Function
    class PieceSquareTableEvaluator extends evaluator_1.Evaluator {
        // private static const pawnValue
        run() {
            let evaluation = 0;
            this.board.squares.forEach((piece, squareNb) => {
                switch (piece?.name) {
                    case null:
                        return;
                    case 'pawn':
                        evaluation += this.pawnEvaluation(squareNb, piece.color);
                        return;
                    case 'knight':
                        evaluation += this.knightEvaluation(squareNb, piece.color);
                        return;
                    case 'bishop':
                        evaluation += this.bishopEvaluation(squareNb, piece.color);
                        return;
                    case 'rook':
                        evaluation += this.rookEvaluation(squareNb, piece.color);
                        return;
                    case 'queen':
                        evaluation += this.queenEvaluation(squareNb, piece.color);
                        return;
                    case 'king':
                        evaluation += this.kingEvaluation(squareNb, piece.color);
                        return;
                }
            });
            return evaluation;
        }
        pieceEvaluation(squareNb, value, coefficients, color) {
            const colorMultiplier = color === 'white' ? 1 : -1;
            const { file, rank } = (0, utils_7.squareNbToFileRank)(squareNb);
            const coefficient = coefficients[color === 'white' ? 7 - rank : rank][color === 'white' ? file : 7 - file];
            return (value + coefficient) * colorMultiplier;
        }
        pawnEvaluation(squareNb, color) {
            const value = 100;
            const coefficients = [
                [0, 0, 0, 0, 0, 0, 0, 0],
                [50, 50, 50, 50, 50, 50, 50, 50],
                [10, 10, 20, 30, 30, 20, 10, 10],
                [5, 5, 10, 25, 25, 10, 5, 5],
                [0, 0, 0, 20, 20, 0, 0, 0],
                [5, -5, -10, 0, 0, -10, -5, 5],
                [5, 10, 10, -20, -20, 10, 10, 5],
                [0, 0, 0, 0, 0, 0, 0, 0],
            ];
            return this.pieceEvaluation(squareNb, value, coefficients, color);
        }
        knightEvaluation(squareNb, color) {
            const value = 300;
            const coefficients = [
                [-50, -40, -30, -30, -30, -30, -40, -50],
                [-40, -20, 0, 0, 0, 0, -20, -40],
                [-30, 0, 10, 15, 15, 10, 0, -30],
                [-30, 5, 15, 20, 20, 15, 5, -30],
                [-30, 0, 15, 20, 20, 15, 0, -30],
                [-30, 5, 10, 15, 15, 10, 5, -30],
                [-40, -20, 0, 5, 5, 0, -20, -40],
                [-50, -40, -30, -30, -30, -30, -40, -50],
            ];
            return this.pieceEvaluation(squareNb, value, coefficients, color);
        }
        bishopEvaluation(squareNb, color) {
            const value = 320;
            const coefficients = [
                [-20, -10, -10, -10, -10, -10, -10, -20],
                [-10, 0, 0, 0, 0, 0, 0, -10],
                [-10, 0, 5, 10, 10, 5, 0, -10],
                [-10, 5, 5, 10, 10, 5, 5, -10],
                [-10, 0, 10, 10, 10, 10, 0, -10],
                [-10, 10, 10, 10, 10, 10, 10, -10],
                [-10, 5, 0, 0, 0, 0, 5, -10],
                [-20, -10, -10, -10, -10, -10, -10, -20],
            ];
            return this.pieceEvaluation(squareNb, value, coefficients, color);
        }
        rookEvaluation(squareNb, color) {
            const value = 500;
            const coefficients = [
                [0, 0, 0, 0, 0, 0, 0, 0],
                [5, 10, 10, 10, 10, 10, 10, 5],
                [-5, 0, 0, 0, 0, 0, 0, -5],
                [-5, 0, 0, 0, 0, 0, 0, -5],
                [-5, 0, 0, 0, 0, 0, 0, -5],
                [-5, 0, 0, 0, 0, 0, 0, -5],
                [-5, 0, 0, 0, 0, 0, 0, -5],
                [0, 0, 0, 5, 5, 0, 0, 0],
            ];
            return this.pieceEvaluation(squareNb, value, coefficients, color);
        }
        queenEvaluation(squareNb, color) {
            const value = 900;
            const coefficients = [
                [-20, -10, -10, -5, -5, -10, -10, -20],
                [-10, 0, 0, 0, 0, 0, 0, -10],
                [-10, 0, 5, 5, 5, 5, 0, -10],
                [-5, 0, 5, 5, 5, 5, 0, -5],
                [0, 0, 5, 5, 5, 5, 0, -5],
                [-10, 5, 5, 5, 5, 5, 0, -10],
                [-10, 0, 5, 0, 0, 0, 0, -10],
                [-20, -10, -10, -5, -5, -10, -10, -20],
            ];
            return this.pieceEvaluation(squareNb, value, coefficients, color);
        }
        kingEvaluation(squareNb, color) {
            const value = 20000;
            const coefficients = [
                [-30, -40, -40, -50, -50, -40, -40, -30],
                [-30, -40, -40, -50, -50, -40, -40, -30],
                [-30, -40, -40, -50, -50, -40, -40, -30],
                [-30, -40, -40, -50, -50, -40, -40, -30],
                [-20, -30, -30, -40, -40, -30, -30, -20],
                [-10, -20, -20, -20, -20, -20, -20, -10],
                [20, 20, 0, 0, 0, 0, 20, 20],
                [20, 30, 10, 0, 0, 10, 30, 20],
            ];
            return this.pieceEvaluation(squareNb, value, coefficients, color);
        }
    }
    exports.PieceSquareTableEvaluator = PieceSquareTableEvaluator;
});
define("models/bots/bot", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Bot = void 0;
    class Bot {
        constructor(board, depth) {
            this.board = board;
            this.depth = depth;
        }
    }
    exports.Bot = Bot;
});
define("models/bots/depthNBot", ["require", "exports", "models/evaluators/pieceSquareTableEvaluator", "models/bots/bot"], function (require, exports, pieceSquareTableEvaluator_1, bot_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DepthNBot = void 0;
    class DepthNBot extends bot_1.Bot {
        constructor() {
            super(...arguments);
            this.checkmateScore = 999999999;
            // The following properties are only used for performance analysis
            this.nbMinimax = 0;
            this.perfNbEvals = 0;
            this.perfTimeEvals = 0;
            this.perfNbPossibleMoves = 0;
            this.perfTimePossibleMoves = 0;
        }
        run() {
            this.nbMinimax = 0;
            const startTimestamp = performance.now();
            const moves = this.board.possibleMoves();
            const colorMultiplier = this.board.colorToMove === 'white' ? 1 : -1;
            let bestMove = null;
            let bestEvaluation = -Infinity;
            for (let move of moves) {
                const evaluation = this.minimax(move.endBoard, this.depth - 1, -this.checkmateScore, this.checkmateScore) *
                    colorMultiplier;
                if (evaluation >= bestEvaluation) {
                    bestMove = move;
                    bestEvaluation = evaluation;
                }
            }
            bestEvaluation *= colorMultiplier;
            const endTimestamp = performance.now();
            console.log('Time:', Math.round(endTimestamp - startTimestamp), 'ms' + ' - Minimax calls:', this.nbMinimax, ' - Avg time per minimax (microsecs):', ((endTimestamp - startTimestamp) / this.nbMinimax) * 1000);
            console.log('Avg time evals (microsecs):', (this.perfTimeEvals / this.perfNbEvals) * 1000, 'Avg time possible moves (microsecs):', (this.perfTimePossibleMoves / this.perfNbPossibleMoves) * 1000);
            console.log('Best move:', bestMove, 'Evaluation:', bestEvaluation);
            return bestMove ? { move: bestMove, evaluation: bestEvaluation } : null;
        }
        minimax(board, remainingDepth, alpha, beta) {
            this.nbMinimax++;
            if (remainingDepth === 0) {
                const startTimestamp = performance.now();
                const evaluation = new pieceSquareTableEvaluator_1.PieceSquareTableEvaluator(board).run();
                const endTimestamp = performance.now();
                this.perfNbEvals++;
                this.perfTimeEvals += endTimestamp - startTimestamp;
                return evaluation;
            }
            if (board.endOfGame === 'checkmate') {
                return board.colorToMove === 'white'
                    ? -this.checkmateScore - remainingDepth
                    : this.checkmateScore + remainingDepth;
            }
            else if (board.endOfGame === 'stalemate') {
                return 0;
            }
            const startTimestamp = performance.now();
            const moves = board.possibleMoves();
            const endTimestamp = performance.now();
            this.perfNbPossibleMoves++;
            this.perfTimePossibleMoves += endTimestamp - startTimestamp;
            if (board.colorToMove === 'white') {
                let bestEvaluation = -Infinity;
                for (let move of moves) {
                    const evaluation = this.minimax(move.endBoard, remainingDepth - 1, alpha, beta);
                    bestEvaluation = Math.max(bestEvaluation, evaluation);
                    alpha = Math.max(alpha, evaluation);
                    if (beta <= alpha)
                        break;
                }
                return bestEvaluation;
            }
            else {
                let bestEvaluation = Infinity;
                for (let move of moves) {
                    const evaluation = this.minimax(move.endBoard, remainingDepth - 1, alpha, beta);
                    bestEvaluation = Math.min(bestEvaluation, evaluation);
                    beta = Math.min(beta, evaluation);
                    if (beta <= alpha)
                        break;
                }
                return bestEvaluation;
            }
        }
    }
    exports.DepthNBot = DepthNBot;
});
define("chess", ["require", "exports", "draw", "models/bots/depthNBot", "models/game", "models/utils"], function (require, exports, draw_1, depthNBot_1, game_1, utils_8) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Chess = void 0;
    class Chess {
        constructor(playMode = '1v1') {
            this.game = new game_1.Game();
            this.selectedSquareNb = null;
            this.highlightedSquareNbs = new Array(64).fill(false);
            this.playMode = playMode;
            // Hide the evaluation panel if the player is playing against the bot
            if (playMode === '1vC') {
                this.hideEvaluation();
            }
            else {
                this.showEvaluation();
            }
            this.setActivePlayModeButton();
            this.newMove();
        }
        get showBestMove() {
            return this.playMode === '1v1';
        }
        get currentBoard() {
            return this.game.currentBoard;
        }
        draw() {
            this.toggleActions();
            (0, draw_1.drawBoard)(this.game, this.selectedSquareNb, this.highlightedSquareNbs, this.bestMoveToDisplay && this.showBestMove ? this.bestMoveToDisplay.move : null);
            this.updateMovesPanel();
            this.toggleNextPlayer();
            this.updateEvaluation();
        }
        newMove() {
            this.resetSelectedSquare();
            this.highlightedSquareNbs.fill(false);
            this.calculateBestMove();
            this.draw();
        }
        clickedOutside() {
            this.resetSelectedSquare();
        }
        clickedSquare(x, y, clickType) {
            const squareNb = Math.floor(x / draw_1.squareSize) + Math.floor((draw_1.squareSize * 8 - (y + 1)) / draw_1.squareSize) * 8;
            if (clickType === 'left') {
                this.highlightedSquareNbs.fill(false);
                const piece = this.currentBoard.squares[squareNb];
                //Deselects the square if it was already selected
                if (squareNb === this.selectedSquareNb) {
                    this.selectedSquareNb = null;
                }
                //Makes a move if possible
                else if (this.selectedSquareNb !== null && this.getMove(squareNb)) {
                    const move = this.getMove(squareNb);
                    this.game.addMove(move);
                    this.newMove();
                }
                //Deselects the square if it is empty
                else if (piece === null) {
                    this.selectedSquareNb = null;
                }
                //Selects the square if it contains a piece of the current player
                else if (piece.color === this.currentBoard.colorToMove) {
                    this.selectedSquareNb = squareNb;
                }
            }
            else {
                this.selectedSquareNb = null;
                this.highlightedSquareNbs[squareNb] = !this.highlightedSquareNbs[squareNb];
            }
            this.draw();
        }
        resetSelectedSquare() {
            this.selectedSquareNb = null;
            this.draw();
        }
        //Calls the possibleMoves() method of the piece on the selected square
        getMove(endSquareNb) {
            if (this.selectedSquareNb === null)
                return;
            const piece = this.currentBoard.squares[this.selectedSquareNb];
            const possibleMoves = piece.possibleMoves(this.selectedSquareNb, this.currentBoard, this.currentBoard.createOpponentAttackTable());
            return possibleMoves.find((move) => move.endSquareNb === endSquareNb);
        }
        toggleNextPlayer() {
            const whiteToMoveElement = document.getElementById('white_to_move');
            const blackToMoveElement = document.getElementById('black_to_move');
            const endOfGameElement = document.getElementById('end_of_game');
            whiteToMoveElement.setAttribute('style', 'display: none;');
            blackToMoveElement.setAttribute('style', 'display: none;');
            endOfGameElement.setAttribute('style', 'display: none;');
            const endOfGame = this.currentBoard.endOfGame;
            switch (endOfGame) {
                case 'checkmate':
                    const colorWinner = (0, utils_8.invertColor)(this.currentBoard.colorToMove);
                    endOfGameElement.innerHTML = `${colorWinner.charAt(0).toUpperCase() + colorWinner.slice(1)} wins by checkmate!`;
                    endOfGameElement.setAttribute('style', '');
                    break;
                case 'stalemate':
                    endOfGameElement.innerHTML = 'Stalemate!';
                    endOfGameElement.setAttribute('style', '');
                    break;
                case null:
                    const isWhite = this.currentBoard.colorToMove === 'white';
                    if (isWhite)
                        whiteToMoveElement.setAttribute('style', '');
                    else
                        blackToMoveElement.setAttribute('style', '');
            }
        }
        calculateBestMove() {
            this.interruptBot();
            this.runBot(() => this.updateBestMoveToDisplay());
        }
        updateBestMoveToDisplay() {
            // If the game isn't in 1v1 mode, the best move shouldn't be displayed
            switch (this.playMode) {
                case '1v1':
                    this.bestMoveToDisplay = this.bestMove;
                    break;
                case '1vC':
                    if (this.currentBoard.colorToMove === 'black')
                        this.playBestMove();
                    break;
                case 'CvC':
                    this.bestMoveToDisplay = this.bestMove;
                    this.playBestMove();
                    break;
            }
            this.draw();
        }
        updateEvaluation() {
            const element = document.getElementById('evaluation');
            switch (this.bestMove) {
                case undefined:
                    element.innerHTML = '. . .';
                    break;
                case null:
                    element.innerHTML = 'Evaluation: /';
                    break;
                default:
                    element.innerHTML = `Evaluation: ${this.bestMove.evaluation}`;
            }
        }
        showEvaluation() {
            const element = document.getElementById('evaluation');
            if (element)
                element?.setAttribute('style', 'display: flex;');
        }
        hideEvaluation() {
            const element = document.getElementById('evaluation');
            if (element)
                element.setAttribute('style', 'display: none;');
        }
        playBestMove() {
            if (this.bestMove) {
                this.game.addMove(this.bestMove.move);
                this.newMove();
            }
        }
        interruptBot() {
            if (this.calculateBestMoveHandle)
                cancelIdleCallback(this.calculateBestMoveHandle);
        }
        runBot(after) {
            this.bestMove = undefined;
            this.calculateBestMoveHandle = requestIdleCallback((deadline) => {
                const bot = new depthNBot_1.DepthNBot(this.currentBoard, 4);
                this.bestMove = bot.run();
                after();
            });
        }
        jumpToMove(moveNb) {
            this.game.jumpToMove(moveNb);
            this.newMove();
        }
        undo() {
            this.game.undo();
            this.newMove();
        }
        redo() {
            this.game.redo();
            this.newMove();
        }
        reset() {
            this.game = new game_1.Game();
            this.newMove();
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
            this.game.moves.forEach((_, index) => {
                // Add the move number every two moves
                if (index % 2 === 0) {
                    html += `<div>${index / 2 + 1}.</div>`;
                    // The move number starts at one but the index starts at zero, so + 1 is required to adjust.
                }
                html +=
                    this.game.moveNb - 1 === index
                        ? `<div class="move currentMove">${this.game.calculateMoveNotation(index)}</div>`
                        : `<div class="move" onClick="window.chess.jumpToMove(${index + 1})">${this.game.calculateMoveNotation(index)}</div>`;
            });
            moves.innerHTML = html;
            const currentMove = document.getElementsByClassName('currentMove')[0];
            if (currentMove)
                currentMove.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setActivePlayModeButton() {
            const toggleVisibility = (id, visibility) => {
                document.getElementById(id).style.visibility = visibility ? 'visible' : 'hidden';
            };
            toggleVisibility('player_vs_player_arrow', this.playMode === '1v1');
            toggleVisibility('player_vs_bot_arrow', this.playMode === '1vC');
            toggleVisibility('bot_vs_bot_arrow', this.playMode === 'CvC');
        }
    }
    exports.Chess = Chess;
});
define("main", ["require", "exports", "draw", "chess"], function (require, exports, draw_2, chess_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let chess = new chess_1.Chess();
    draw_2.canvas.onmousedown = (event) => {
        const x = event.clientX - draw_2.canvas.getBoundingClientRect().x - draw_2.canvas.clientLeft;
        const y = event.clientY - draw_2.canvas.getBoundingClientRect().y - draw_2.canvas.clientTop;
        if (x >= 0 && y >= 0 && x < draw_2.squareSize * 8 && y < draw_2.squareSize * 8) {
            chess.clickedSquare(x, y, event.button === 0 ? 'left' : 'right');
        }
    };
    window.onmousedown = (event) => {
        if (event.target !== draw_2.canvas) {
            chess.clickedOutside();
        }
    };
    const playmodeIDs = ['player_vs_player', 'player_vs_bot', 'bot_vs_bot'];
    const idToPlayMode = {
        player_vs_player: '1v1',
        player_vs_bot: '1vC',
        bot_vs_bot: 'CvC',
    };
    playmodeIDs.forEach((id) => {
        document.getElementById(id).onclick = () => {
            chess.interruptBot();
            chess = new chess_1.Chess(idToPlayMode[id]);
        };
    });
    document.getElementById('undo').onclick = () => chess.undo();
    document.getElementById('redo').onclick = () => chess.redo();
    document.getElementById('reset').onclick = () => chess.reset();
    draw_2.canvas.addEventListener('contextmenu', (event) => event.preventDefault());
    document.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft')
            chess.undo();
        if (event.key === 'ArrowRight')
            chess.redo();
    });
    //@ts-ignore
    window.chess = chess;
});
define("models/board.test", ["require", "exports", "models/board"], function (require, exports, board_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    describe('importFEN', () => {
        it('imports a FEN', () => {
            const board = new board_4.Board('rbk3n1/p7/8/8/8/8/7P/RBK3N1 b KQ - 0 0');
            expect(board.squares[56]?.name).toBe('rook');
        });
        it('imports another FEN', () => {
            const board = new board_4.Board('8/8/8/2k5/2pP4/8/B7/4K3 b - d3 0 3');
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
    describe('isInCheck', () => {
        const isInCheck = (FEN) => {
            const board = new board_4.Board(FEN);
            return board.isInCheck();
        };
        it('detects check', () => expect(isInCheck('r6r/1b2k1bq/8/8/7B/8/8/R3K2R b - - 0 0')).toBe(true));
        it('detects when not in check', () => expect(isInCheck('k7/8/8/8/8/8/8/b5K1 w - - 0 0')).toBe(false));
    });
    describe('possibleMoves', () => {
        const possibleMoves = (FEN) => {
            const board = new board_4.Board(FEN);
            return board.possibleMoves();
        };
        const nbMoves = (FEN) => {
            return possibleMoves(FEN).length;
        };
        it('', () => expect(nbMoves('r6r/1b2k1bq/8/8/7B/8/8/R3K2R b KQ - 3 2')).toEqual(8));
        it('stops checks by en passant', () => expect(nbMoves('8/8/8/2k5/2pP4/8/B7/4K3 b - d3 0 3')).toEqual(8));
        it('', () => expect(nbMoves('r1bqkbnr/pppppppp/n7/8/8/P7/1PPPPPPP/RNBQKBNR w KQkq - 2 2')).toEqual(19));
        it('', () => expect(nbMoves('r3k2r/p1pp1pb1/bn2Qnp1/2qPN3/1p2P3/2N5/PPPBBPPP/R3K2R b KQkq - 3 2')).toEqual(5));
        it('', () => expect(nbMoves('2kr3r/p1ppqpb1/bn2Qnp1/3PN3/1p2P3/2N5/PPPBBPPP/R3K2R b KQ - 3 2')).toEqual(44));
        //it('includes all types of promotions', () => expect(nbMoves('rnb2k1r/pp1Pbppp/2p5/q7/2B5/8/PPPQNnPP/RNB1K2R w KQ - 3 9')).toEqual(39))
        it('verifies that that the pawn promotes when it moves straight', () => {
            expect(possibleMoves('8/P7/8/8/8/8/8/k6K w - - 0 0').some((move) => move.endBoard.squares[56]?.name === 'queen')).toBe(true);
        });
        it('verifies that that the pawn promotes when it makes a capture-promotion', () => {
            expect(possibleMoves('k6K/8/8/8/8/8/7p/6R1 b - - 0 0').some((move) => move.endBoard.squares[6]?.name === 'queen')).toBe(true);
        });
        it('', () => expect(nbMoves('2r5/3pk3/8/2P5/8/2K5/8/8 w - - 5 4')).toEqual(9));
        it('verifies that the king cannot move into check', () => expect(nbMoves('k7/8/K7/8/8/8/8/8 w - - 0 0')).toEqual(3));
        describe('pins', () => {
            it('detects a pin', () => expect(nbMoves('k7/8/8/n7/8/8/R7/K7 b - - 0 0')).toEqual(3));
            it('detects unpin when the pinned piece has the same movement offset as the pinning piece', () => {
                expect(nbMoves('k7/8/r7/8/Q7/8/8/K7 b - - 0 0')).toEqual(6);
            });
            it('detects unpin when two pieces block the pin', () => {
                expect(nbMoves('k7/p7/r7/8/Q7/8/8/K7 b - - 0 0')).toEqual(11);
            });
            describe('en passant', () => {
                it("detects clearance of a pin's path when en passant - row offset", () => {
                    expect(nbMoves('8/8/8/8/k1PpQ3/8/8/K7 b - c3 0 0')).toEqual(5);
                });
                it("detects clearance of a pin's path when en passant - random offset", () => {
                    expect(nbMoves('8/8/8/k7/2Pp4/6Q1/8/K7 b - c3 0 0')).toEqual(6);
                });
                it("detects clearance of a pin's path when en passant - random offset", () => {
                    expect(nbMoves('8/8/8/8/k1PpB3/8/8/K7 b - c3 0 0')).toEqual(6);
                });
            });
            describe("non-sliding pieces don't pin", () => {
                it('verifies that the king cannot pin a piece', () => {
                    expect(nbMoves('k7/N7/K7/8/8/8/8/8 w - - 0 0')).toEqual(6);
                });
                it('verifies that the knight cannot pin a piece', () => {
                    expect(nbMoves('k7/8/8/2n5/8/1R6/8/K7 w - - 0 0')).toEqual(17);
                });
                it('verifies that the pawn cannot pin a piece', () => {
                    expect(nbMoves('k7/8/8/8/p7/1R6/8/3K4 w - - 0 0')).toEqual(19);
                });
            });
        });
    });
    describe('endOfGame', () => {
        const endOfGame = (FEN) => {
            const board = new board_4.Board(FEN);
            return board.endOfGame;
        };
        it('tests checkmate', () => expect(endOfGame('r1K5/r7/8/8/8/8/8/7k w - - 0 0')).toBe('checkmate'));
        it('tests stalemate', () => expect(endOfGame('k7/7R/8/8/8/8/8/1R4K1 b - - 0 0')).toBe('stalemate'));
        it('returns null if not end of game', () => expect(endOfGame('kr6/8/8/8/8/8/8/6RK b - - 0 0')).toBe(null));
    });
    describe('kingAttackers in opponentAttackTable', () => {
        const kingAttackers = (FEN) => {
            const board = new board_4.Board(FEN);
            return board.createOpponentAttackTable().kingAttackers;
        };
        it('verifies that kingAttackers is updated', () => {
            expect(kingAttackers('kr1K4/8/8/8/8/8/8/8 w - - 0 0')).toEqual([57]);
        });
    });
});
define("models/game.test", ["require", "exports", "models/game"], function (require, exports, game_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    describe('check notation calculation', () => {
        const notation = (FEN, startSquareNb, endSquareNb) => {
            const game = new game_2.Game(FEN);
            const move = game.currentBoard.possibleMoves().find((move) => {
                return move.startSquareNb === startSquareNb && move.endSquareNb === endSquareNb;
            });
            game.addMove(move);
            return game.calculateMoveNotation();
        };
        describe('pawn moves', () => {
            it('tests notation for a simple pawn move', () => {
                expect(notation('k7/8/8/8/8/8/P6K/8 w - - 0 0', 8, 16)).toBe('a3');
            });
            it('tests notation for a simple pawn capture', () => {
                expect(notation('k7/8/8/8/8/1p6/P6K/8 w - - 0 0', 8, 17)).toBe('axb3');
            });
            it('tests notation for a simple pawn en passant', () => {
                expect(notation('k7/8/8/pP6/8/8/7K/8 w - a6 0 0', 33, 40)).toBe('bxa6');
            });
            it('tests notation for a simple pawn promotion', () => {
                expect(notation('8/P6k/8/8/8/8/7K/8 w - - 0 0', 48, 56)).toBe('a8=Q');
            });
        });
        describe('knight moves', () => {
            it('tests notation for a simple knight move', () => {
                expect(notation('k7/8/8/8/8/8/8/N6K w - - 0 0', 0, 10)).toBe('Nc2');
            });
            it('tests notation for a simple knight capture', () => {
                expect(notation('k7/8/8/8/8/8/2r5/N6K w - - 0 0', 0, 10)).toBe('Nxc2');
            });
        });
        describe('bishop moves', () => {
            it('tests notation for a simple bishop capture', () => {
                expect(notation('k7/8/8/8/8/8/1R5/b6K b - - 0 0', 0, 9)).toBe('Bxb2');
            });
        });
        describe('rook moves', () => {
            it('tests notation for a simple rook move', () => {
                expect(notation('7k/8/8/8/8/8/8/R6K w - - 0 0', 0, 8)).toBe('Ra2');
            });
        });
        describe('queen moves', () => {
            it('tests notation for a simple queen move', () => {
                expect(notation('7k/8/8/8/8/8/8/Q6K w - - 0 0', 0, 8)).toBe('Qa2');
            });
        });
        describe('king moves', () => {
            it('tests notation for a simple king move', () => {
                expect(notation('k7/8/8/8/8/8/8/K7 w - - 0 0', 0, 8)).toBe('Ka2');
            });
        });
        describe('ambiguous moves', () => {
            describe('when several knights can move to the same square', () => {
                it('tests when two knights are on the same rank', () => {
                    expect(notation('k7/8/8/8/8/8/K7/N1N5 w - - 0 0', 0, 17)).toBe('Nab3');
                });
                it('tests when two knights are on the same file', () => {
                    expect(notation('k7/8/8/8/8/N7/K7/N7 w - - 0 0', 0, 10)).toBe('N1c2');
                });
                it('tests when three knights are on the same file and rank', () => {
                    expect(notation('k7/8/8/8/8/N7/K7/N3N3 w - - 0 0', 0, 10)).toBe('Na1c2');
                });
                it('tests that coordinates are not added when they are not needed', () => {
                    expect(notation('k7/8/8/8/8/N7/K7/N3N3 w - - 0 0', 16, 10)).toBe('N3c2');
                });
            });
        });
    });
});
define("models/utils.test", ["require", "exports", "models/utils"], function (require, exports, utils_9) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    describe('isBetweenSquares', () => {
        it('verifies that the function returns the correct value', () => {
            expect((0, utils_9.isBetweenSquares)(0, 18, 27)).toBe(true);
        });
        it('', () => expect((0, utils_9.isBetweenSquares)(0, 8, 56)).toBe(true));
        it('', () => expect((0, utils_9.isBetweenSquares)(0, 8, 18)).toBe(false));
        it('', () => expect((0, utils_9.isBetweenSquares)(63, 61, 56)).toBe(true));
        it('', () => expect((0, utils_9.isBetweenSquares)(19, 19, 20)).toBe(false));
        it('', () => expect((0, utils_9.isBetweenSquares)(34, 38, 38)).toBe(false));
        it('', () => expect((0, utils_9.isBetweenSquares)(20, 19, 21)).toBe(false));
    });
});
define("models/bots/depthOneBot", ["require", "exports", "models/evaluators/pieceSquareTableEvaluator", "models/bots/bot"], function (require, exports, pieceSquareTableEvaluator_2, bot_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DepthOneBot = void 0;
    class DepthOneBot extends bot_2.Bot {
        run() {
            const moves = this.board.possibleMoves();
            const colorMultiplier = this.board.colorToMove === 'white' ? 1 : -1;
            let bestMove = null;
            let bestEvaluation = -Infinity;
            for (let move of moves) {
                const evaluator = new pieceSquareTableEvaluator_2.PieceSquareTableEvaluator(move.endBoard);
                const evaluation = evaluator.run() * colorMultiplier;
                if (evaluation > bestEvaluation) {
                    bestMove = move;
                    bestEvaluation = evaluation;
                }
            }
            return bestMove ? { move: bestMove, evaluation: bestEvaluation } : null;
        }
    }
    exports.DepthOneBot = DepthOneBot;
});
define("models/evaluators/pieceSquareTableEvaluator.test", ["require", "exports", "models/board", "models/evaluators/pieceSquareTableEvaluator"], function (require, exports, board_5, pieceSquareTableEvaluator_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    describe('PieceSquareTableEvaluator', () => {
        const evaluate = (FEN) => {
            const board = new board_5.Board(FEN);
            const evaluator = new pieceSquareTableEvaluator_3.PieceSquareTableEvaluator(board);
            return evaluator.run();
        };
        it('evaluates the start position to zero', () => {
            expect(evaluate('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 0')).toBeCloseTo(0);
        });
        describe('Pawn', () => {
            it('', () => {
                expect(evaluate('4k3/p7/8/8/8/8/8/4K3 w - - 0 0')).toBeCloseTo(-105);
            });
        });
        describe('Queen', () => {
            it('', () => {
                expect(evaluate('4k3/8/8/8/8/8/2Q5/4K3 w - - 0 0')).toBeCloseTo(905);
            });
            it('', () => {
                expect(evaluate('4k3/2q5/8/8/8/8/8/4K3 w - - 0 0')).toBeCloseTo(-900);
            });
        });
    });
});
define("models/pieces/bishop.test", ["require", "exports", "models/board", "models/utils"], function (require, exports, board_6, utils_10) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    describe('updateAttackTable', () => {
        describe('test with specific FEN', () => {
            const board = new board_6.Board('7k/n7/5q2/8/3B4/8/5P2/8 w - - 0 0');
            const bishopSquareNb = 27;
            const bishop = board.squares[bishopSquareNb];
            expect(bishop?.name).toBe('bishop');
            const table = (0, utils_10.createEmptyAttackTable)();
            bishop?.updateAttackTable(bishopSquareNb, board, table);
            it('calculates squares attacked by bishop', () => {
                expect(table.attackedSquares.filter((square) => square === true).length).toBe(10);
            });
            it('calculates pieces pinned by bishop', () => {
                expect(table.pinnedPieces).toEqual([
                    {
                        squareNb: 45,
                        offset: { file: 1, rank: 1 },
                    },
                ]);
            });
        });
    });
});
define("models/pieces/king.test", ["require", "exports", "models/board", "models/utils"], function (require, exports, board_7, utils_11) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    describe('possibleMoves', () => {
        it('skips castlings in skipVerification mode', () => {
            const board = new board_7.Board();
            board.importFEN('4k2r/8/8/8/8/8/8/4K2R b Kk - 0 0');
            const kingSquareNb = 60;
            const king = board.squares[kingSquareNb];
            expect(king).toEqual(expect.objectContaining({ name: 'king', color: 'black' }));
            // If castlings were not skipped from opponent (= white) moves computation, our implementation of
            // castlings would result in a "Maximum call stack size exceeded" error.
            expect(() => king.possibleMoves(kingSquareNb, board, (0, utils_11.createEmptyAttackTable)())).not.toThrowError();
        });
    });
    describe('updateAttackTable', () => {
        describe('test with specific FEN', () => {
            const board = new board_7.Board('k7/8/8/8/8/8/8/K7 w - - 0 0');
            const kingSquareNb = 0;
            const king = board.squares[kingSquareNb];
            expect(king?.name).toBe('king');
            const table = (0, utils_11.createEmptyAttackTable)();
            king?.updateAttackTable(kingSquareNb, board, table);
            it('calculates attacked squares', () => {
                expect(table.attackedSquares.filter((square) => square === true).length).toBe(3);
            });
        });
    });
});
define("models/pieces/knight.test", ["require", "exports", "models/board", "models/utils"], function (require, exports, board_8, utils_12) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    describe('updateAttackTable', () => {
        describe('test with specific FEN', () => {
            const board = new board_8.Board('k7/8/8/8/8/8/8/K1N5 w - - 0 0');
            const knightSquareNb = 2;
            const knight = board.squares[knightSquareNb];
            expect(knight?.name).toBe('knight');
            const table = (0, utils_12.createEmptyAttackTable)();
            knight?.updateAttackTable(knightSquareNb, board, table);
            it('calculates attacked squares', () => {
                expect(table.attackedSquares.filter((square) => square === true).length).toBe(4);
            });
        });
    });
});
define("models/pieces/pawn.test", ["require", "exports", "models/board", "models/utils"], function (require, exports, board_9, utils_13) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    describe('updateAttackTable', () => {
        describe('test with specific FEN', () => {
            const board = new board_9.Board('k7/8/8/8/1P6/8/8/K7 w - - 0 0');
            const pawnSquareNb = 25;
            const pawn = board.squares[pawnSquareNb];
            expect(pawn?.name).toBe('pawn');
            const table = (0, utils_13.createEmptyAttackTable)();
            pawn?.updateAttackTable(pawnSquareNb, board, table);
            it('calculates attacked squares', () => {
                expect(table.attackedSquares.filter((square) => square === true).length).toBe(2);
            });
        });
    });
});
define("models/pieces/queen.test", ["require", "exports", "models/board", "models/utils"], function (require, exports, board_10, utils_14) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    describe('updateAttackTable', () => {
        describe('test with specific FEN', () => {
            const board = new board_10.Board('k7/n7/8/8/8/8/Q7/K7 w - - 0 0');
            const queenSquareNb = 8;
            const queen = board.squares[queenSquareNb];
            expect(queen?.name).toBe('queen');
            const table = (0, utils_14.createEmptyAttackTable)();
            queen?.updateAttackTable(queenSquareNb, board, table);
            it('calculates squares attacked by queen', () => {
                expect(table.attackedSquares.filter((square) => square === true).length).toBe(20);
            });
            it('calculates pieces pinned by queen', () => {
                expect(table.pinnedPieces).toEqual([
                    {
                        squareNb: 48,
                        offset: { file: 0, rank: 1 },
                    },
                ]);
            });
        });
    });
});
define("models/pieces/rook.test", ["require", "exports", "models/board", "models/utils"], function (require, exports, board_11, utils_15) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    describe('updateAttackTable', () => {
        describe('test with specific FEN', () => {
            const board = new board_11.Board('kb5R/8/8/8/8/8/8/K7 w - - 0 0');
            const rookSquareNb = 63;
            const rook = board.squares[rookSquareNb];
            expect(rook?.name).toBe('rook');
            const table = (0, utils_15.createEmptyAttackTable)();
            rook?.updateAttackTable(rookSquareNb, board, table);
            it('calculates squares attacked by rook', () => {
                expect(table.attackedSquares.filter((square) => square === true).length).toBe(13);
            });
            it('calculates pieces pinned by rook', () => {
                expect(table.pinnedPieces).toEqual([
                    {
                        squareNb: 57,
                        offset: { file: -1, rank: 0 },
                    },
                ]);
            });
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tb2RlbHMvdHlwZXMudHMiLCIuLi9zcmMvbW9kZWxzL3V0aWxzLnRzIiwiLi4vc3JjL21vZGVscy9waWVjZXMvcGllY2UudHMiLCIuLi9zcmMvbW9kZWxzL21vdmUudHMiLCIuLi9zcmMvbW9kZWxzL3BpZWNlcy9iaXNob3AudHMiLCIuLi9zcmMvbW9kZWxzL3BpZWNlcy9raW5nLnRzIiwiLi4vc3JjL21vZGVscy9waWVjZXMva25pZ2h0LnRzIiwiLi4vc3JjL21vZGVscy9waWVjZXMvcXVlZW4udHMiLCIuLi9zcmMvbW9kZWxzL3BpZWNlcy9wYXduLnRzIiwiLi4vc3JjL21vZGVscy9waWVjZXMvcm9vay50cyIsIi4uL3NyYy9tb2RlbHMvYm9hcmQudHMiLCIuLi9zcmMvbW9kZWxzL2dhbWUudHMiLCIuLi9zcmMvdXRpbHMudHMiLCIuLi9zcmMvZHJhdy50cyIsIi4uL3NyYy9tb2RlbHMvZXZhbHVhdG9ycy9ldmFsdWF0b3IudHMiLCIuLi9zcmMvbW9kZWxzL2V2YWx1YXRvcnMvcGllY2VTcXVhcmVUYWJsZUV2YWx1YXRvci50cyIsIi4uL3NyYy9tb2RlbHMvYm90cy9ib3QudHMiLCIuLi9zcmMvbW9kZWxzL2JvdHMvZGVwdGhOQm90LnRzIiwiLi4vc3JjL2NoZXNzLnRzIiwiLi4vc3JjL21haW4udHMiLCIuLi9zcmMvbW9kZWxzL2JvYXJkLnRlc3QudHMiLCIuLi9zcmMvbW9kZWxzL2dhbWUudGVzdC50cyIsIi4uL3NyYy9tb2RlbHMvdXRpbHMudGVzdC50cyIsIi4uL3NyYy9tb2RlbHMvYm90cy9kZXB0aE9uZUJvdC50cyIsIi4uL3NyYy9tb2RlbHMvZXZhbHVhdG9ycy9waWVjZVNxdWFyZVRhYmxlRXZhbHVhdG9yLnRlc3QudHMiLCIuLi9zcmMvbW9kZWxzL3BpZWNlcy9iaXNob3AudGVzdC50cyIsIi4uL3NyYy9tb2RlbHMvcGllY2VzL2tpbmcudGVzdC50cyIsIi4uL3NyYy9tb2RlbHMvcGllY2VzL2tuaWdodC50ZXN0LnRzIiwiLi4vc3JjL21vZGVscy9waWVjZXMvcGF3bi50ZXN0LnRzIiwiLi4vc3JjL21vZGVscy9waWVjZXMvcXVlZW4udGVzdC50cyIsIi4uL3NyYy9tb2RlbHMvcGllY2VzL3Jvb2sudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7OztJQ0VBLFNBQWdCLFdBQVcsQ0FBQyxLQUFpQjtRQUN6QyxPQUFPLEtBQUssS0FBSyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFBO0lBQ2hELENBQUM7SUFGRCxrQ0FFQztJQUVELFNBQWdCLGtCQUFrQixDQUFDLFFBQWdCO1FBQy9DLE1BQU0sSUFBSSxHQUFHLFFBQVEsR0FBRyxDQUFDLENBQUE7UUFDekIsTUFBTSxJQUFJLEdBQUcsUUFBUSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQyxDQUFBO1FBRS9FLE9BQU87WUFDSCxJQUFJO1lBQ0osSUFBSTtTQUNQLENBQUE7SUFDTCxDQUFDO0lBUkQsZ0RBUUM7SUFFRCxTQUFnQixrQkFBa0IsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQVk7UUFDdkQsT0FBTyxJQUFJLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQTtJQUMxQixDQUFDO0lBRkQsZ0RBRUM7SUFFRCxTQUFnQixxQkFBcUIsQ0FBQyxRQUFnQjtRQUNsRCxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxHQUFHLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBQ25ELE1BQU0sWUFBWSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ25FLE9BQU8sR0FBRyxZQUFZLEdBQUcsSUFBSSxHQUFHLENBQUMsRUFBaUIsQ0FBQTtJQUN0RCxDQUFDO0lBSkQsc0RBSUM7SUFFRCxTQUFnQixxQkFBcUIsQ0FBQyxXQUF3QjtRQUMxRCxNQUFNLElBQUksR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDN0QsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtRQUN2QyxPQUFPLGtCQUFrQixDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUE7SUFDN0MsQ0FBQztJQUpELHNEQUlDO0lBRUQsU0FBZ0Isc0JBQXNCO1FBQ2xDLE9BQU8sRUFBRSxlQUFlLEVBQUUsSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLFlBQVksRUFBRSxFQUFFLEVBQUUsYUFBYSxFQUFFLEVBQUUsRUFBRSxDQUFBO0lBQzlGLENBQUM7SUFGRCx3REFFQztJQUVELHlEQUF5RDtJQUN6RCxTQUFnQixnQkFBZ0IsQ0FBQyxZQUFvQixFQUFFLGNBQXNCLEVBQUUsVUFBa0I7UUFDN0YsTUFBTSxVQUFVLEdBQUcsa0JBQWtCLENBQUMsWUFBWSxDQUFDLENBQUE7UUFDbkQsTUFBTSxRQUFRLEdBQUcsa0JBQWtCLENBQUMsVUFBVSxDQUFDLENBQUE7UUFDL0MsTUFBTSxZQUFZLEdBQUcsa0JBQWtCLENBQUMsY0FBYyxDQUFDLENBQUE7UUFDdkQsTUFBTSxTQUFTLEdBQUc7WUFDZCxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUM7WUFDaEQsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDO1NBQ25ELENBQUE7UUFFRCxJQUFJLGFBQWEsR0FBRyxVQUFVLENBQUE7UUFDOUIsYUFBYSxDQUFDLElBQUksSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFBO1FBQ3BDLGFBQWEsQ0FBQyxJQUFJLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQTtRQUNwQyxPQUFPLGFBQWEsQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDLElBQUksSUFBSSxhQUFhLENBQUMsSUFBSSxLQUFLLFFBQVEsQ0FBQyxJQUFJLEVBQUU7WUFDakYsSUFBSSxhQUFhLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxhQUFhLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxhQUFhLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxhQUFhLENBQUMsSUFBSSxHQUFHLENBQUMsRUFBRTtnQkFDdEcsT0FBTyxLQUFLLENBQUE7YUFDZjtZQUNELElBQUksYUFBYSxDQUFDLElBQUksS0FBSyxZQUFZLENBQUMsSUFBSSxJQUFJLGFBQWEsQ0FBQyxJQUFJLEtBQUssWUFBWSxDQUFDLElBQUk7Z0JBQUUsT0FBTyxJQUFJLENBQUE7WUFFckcsYUFBYSxDQUFDLElBQUksSUFBSSxTQUFTLENBQUMsSUFBSSxDQUFBO1lBQ3BDLGFBQWEsQ0FBQyxJQUFJLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQTtTQUN2QztRQUNELE9BQU8sS0FBSyxDQUFBO0lBQ2hCLENBQUM7SUF0QkQsNENBc0JDO0lBRUQsU0FBZ0IsbUJBQW1CLENBQUMsWUFBb0IsRUFBRSxVQUFrQjtRQUN4RSxNQUFNLFVBQVUsR0FBRyxrQkFBa0IsQ0FBQyxZQUFZLENBQUMsQ0FBQTtRQUNuRCxNQUFNLFFBQVEsR0FBRyxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsQ0FBQTtRQUUvQyxPQUFPLGtCQUFrQixDQUFDO1lBQ3RCLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQztZQUNoRCxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUM7U0FDbkQsQ0FBQyxDQUFBO0lBQ04sQ0FBQztJQVJELGtEQVFDOzs7Ozs7SUNoRUQsTUFBc0IsS0FBSztRQUN2QixZQUFtQixJQUFlLEVBQVMsS0FBaUI7WUFBekMsU0FBSSxHQUFKLElBQUksQ0FBVztZQUFTLFVBQUssR0FBTCxLQUFLLENBQVk7UUFBRyxDQUFDO1FBT2hFLEtBQUssQ0FBQyxLQUFZLElBQVMsQ0FBQztRQUU1QixTQUFTLENBQUMsYUFBcUIsRUFBRSxNQUFnQjtZQUM3QyxNQUFNLFdBQVcsR0FBRyxhQUFhLEdBQUcsTUFBTSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQTtZQUNqRSxJQUFJLFdBQVcsR0FBRyxDQUFDLElBQUksV0FBVyxHQUFHLEVBQUU7Z0JBQUUsT0FBTyxJQUFJLENBQUE7WUFFcEQsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLElBQUEsMEJBQWtCLEVBQUMsYUFBYSxDQUFDLENBQUE7WUFDbEQsSUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksR0FBRyxDQUFDO2dCQUFFLE9BQU8sSUFBSSxDQUFBO1lBQ3ZDLElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLEdBQUcsQ0FBQztnQkFBRSxPQUFPLElBQUksQ0FBQTtZQUV2QyxPQUFPLFdBQVcsQ0FBQTtRQUN0QixDQUFDO1FBRUQsNkJBQTZCLENBQ3pCLGFBQXFCLEVBQ3JCLE9BQW1CLEVBQ25CLEtBQVksRUFDWixtQkFBZ0MsRUFDaEMsV0FBd0I7WUFFeEIsTUFBTSxLQUFLLEdBQVcsRUFBRSxDQUFBO1lBRXhCLEtBQUssSUFBSSxNQUFNLElBQUksT0FBTyxFQUFFO2dCQUN4QixJQUFJLFdBQVcsR0FBa0IsYUFBYSxDQUFBO2dCQUU5QyxPQUFPLElBQUksRUFBRTtvQkFDVCxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLENBQUE7b0JBQ2pELElBQUksV0FBVyxLQUFLLElBQUk7d0JBQUUsTUFBSztvQkFDL0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsbUJBQW1CLEVBQUUsV0FBVyxDQUFDLENBQUE7b0JBQzNGLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUM7d0JBQUUsTUFBSztpQkFDeEM7YUFDSjtZQUNELE9BQU8sS0FBSyxDQUFBO1FBQ2hCLENBQUM7UUFFRCxVQUFVLENBQ04sS0FBYSxFQUNiLGFBQXFCLEVBQ3JCLFdBQTBCLEVBQzFCLEtBQVksRUFDWixtQkFBZ0MsRUFDaEMsTUFBbUIsRUFDbkIsUUFBb0MsRUFDcEMsV0FBVyxHQUFHLEtBQUs7WUFFbkIsSUFBSSxXQUFXLEtBQUssSUFBSTtnQkFBRSxPQUFNO1lBRWhDLElBQUksUUFBUSxHQUFhLFdBQVcsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUE7WUFFN0QsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxFQUFFLElBQUksS0FBSyxNQUFNLElBQUksS0FBSyxDQUFDLHVCQUF1QixLQUFLLFdBQVcsRUFBRTtnQkFDaEcscUJBQXFCO2dCQUNyQixRQUFRLEdBQUcsU0FBUyxDQUFBO2dCQUNwQixJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUM7b0JBQUUsT0FBTTthQUMzRDtZQUVELE1BQU0sY0FBYyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUE7WUFFakQsSUFBSSxDQUFDLGNBQWMsSUFBSSxjQUFjLENBQUMsS0FBSyxLQUFLLElBQUksQ0FBQyxLQUFLLEVBQUU7Z0JBQ3hELE1BQU0sUUFBUSxHQUFHLElBQUksYUFBSyxDQUFDLEtBQUssRUFBRSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUE7Z0JBRTlFLElBQUksY0FBYyxFQUFFO29CQUNoQixRQUFRLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFBO29CQUN2RCxjQUFjLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFBO2lCQUNqQztnQkFFRCxRQUFRLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUE7Z0JBQy9ELFFBQVEsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLEdBQUcsSUFBSSxDQUFBO2dCQUV0QyxJQUFJLFFBQVE7b0JBQUUsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFBO2dCQUVoQyxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsbUJBQW1CLENBQUM7b0JBQUUsT0FBTTtnQkFFbkcsTUFBTSxJQUFJLEdBQUcsSUFBSSxXQUFJLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFBO2dCQUMzRSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO2FBQ25CO1FBQ0wsQ0FBQztRQUVELG9CQUFvQixDQUNoQixhQUFxQixFQUNyQixLQUFZLEVBQ1osS0FBa0IsRUFDbEIsT0FBbUIsRUFDbkIsY0FBdUI7WUFFdkIsS0FBSyxJQUFJLE1BQU0sSUFBSSxPQUFPLEVBQUU7Z0JBQ3hCLElBQUksV0FBVyxHQUFrQixhQUFhLENBQUE7Z0JBRTlDLEdBQUc7b0JBQ0MsV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxDQUFBO29CQUNqRCxJQUFJLFdBQVcsS0FBSyxJQUFJO3dCQUFFLE1BQUs7b0JBQy9CLEtBQUssQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLEdBQUcsSUFBSSxDQUFBO29CQUV6QyxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFBO29CQUN4QyxJQUFJLEtBQUssRUFBRTt3QkFDUCxJQUFJLEtBQUssQ0FBQyxLQUFLLEtBQUssSUFBSSxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLE1BQU0sRUFBRTs0QkFDckQsS0FBSyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUE7eUJBQzFDO3dCQUVELElBQUksY0FBYyxFQUFFOzRCQUNoQixJQUFJLEtBQUssQ0FBQyxLQUFLLEtBQUssSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLEVBQUU7Z0NBQzlFLEtBQUssQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDO29DQUNwQixRQUFRLEVBQUUsV0FBVztvQ0FDckIsTUFBTTtpQ0FDVCxDQUFDLENBQUE7NkJBQ0w7NEJBQ0QsTUFBSzt5QkFDUjtxQkFDSjtpQkFDSixRQUFRLGNBQWMsRUFBQzthQUMzQjtRQUNMLENBQUM7UUFFUyxhQUFhLENBQUMsYUFBcUIsRUFBRSxLQUFZLEVBQUUsTUFBZ0I7WUFDekUsTUFBTSxZQUFZLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLEtBQUssRUFBRSxJQUFJLEtBQUssTUFBTSxJQUFJLEtBQUssQ0FBQyxLQUFLLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFBO1lBQzdHLE9BQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLGFBQWEsRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUMsQ0FBQTtRQUM5RixDQUFDO1FBRU8sZ0JBQWdCLENBQUMsYUFBcUIsRUFBRSxLQUFZLEVBQUUsTUFBZ0I7WUFDMUUsSUFBSSxXQUFXLEdBQWtCLGFBQWEsQ0FBQTtZQUM5QyxPQUFPLElBQUksRUFBRTtnQkFDVCxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLENBQUE7Z0JBQ2pELElBQUksV0FBVyxLQUFLLElBQUk7b0JBQUUsTUFBSztnQkFFL0IsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQTtnQkFDeEMsSUFBSSxLQUFLO29CQUFFLE9BQU8sS0FBSyxDQUFBO2FBQzFCO1lBRUQsT0FBTyxJQUFJLENBQUE7UUFDZixDQUFDO1FBRU8sZ0JBQWdCLENBQ3BCLGFBQXFCLEVBQ3JCLFdBQW1CLEVBQ25CLEtBQVksRUFDWixRQUFlLEVBQ2YsbUJBQWdDO1lBRWhDLE1BQU0sYUFBYSxHQUFHLG1CQUFtQixDQUFDLGFBQWEsQ0FBQTtZQUN2RCxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBRSxDQUFBO1lBRTNDLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxNQUFNLEVBQUU7Z0JBQ3ZCLElBQUksbUJBQW1CLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQztvQkFBRSxPQUFPLElBQUksQ0FBQTtnQkFFakUsb0dBQW9HO2dCQUNwRyxLQUFLLElBQUksWUFBWSxJQUFJLGFBQWEsRUFBRTtvQkFDcEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLEVBQUUsU0FBUzt3QkFBRSxTQUFRO29CQUVyRCxNQUFNLE1BQU0sR0FBRyxJQUFBLDJCQUFtQixFQUFDLFlBQVksRUFBRSxhQUFhLENBQUMsQ0FBQTtvQkFDL0QsSUFBSSxXQUFXLEtBQUssYUFBYSxHQUFHLE1BQU07d0JBQUUsT0FBTyxJQUFJLENBQUE7aUJBQzFEO2FBQ0o7aUJBQU07Z0JBQ0gsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxZQUFZLENBQUMsTUFBTTtvQkFBRSxPQUFPLEtBQUssQ0FBQTtnQkFDbkYsTUFBTSxXQUFXLEdBQUcsbUJBQW1CLENBQUMsWUFBWSxDQUFDLElBQUksQ0FDckQsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEtBQUssYUFBYSxDQUMxRCxDQUFBO2dCQUNELElBQUksV0FBVyxJQUFJLENBQUMsYUFBYSxHQUFHLFdBQVcsQ0FBQyxHQUFHLElBQUEsMEJBQWtCLEVBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7b0JBQUUsT0FBTyxJQUFJLENBQUE7Z0JBRTVHLElBQUksYUFBYSxDQUFDLE1BQU0sR0FBRyxDQUFDO29CQUFFLE9BQU8sSUFBSSxDQUFBO2dCQUV6QyxJQUFJLGFBQWEsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO29CQUM1QixNQUFNLG9CQUFvQixHQUFHLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQTtvQkFDN0MsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQzNDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxLQUFLLE1BQU0sSUFBSSxLQUFLLENBQUMsS0FBSyxLQUFLLElBQUksQ0FBQyxLQUFLLENBQ2xFLENBQUE7b0JBQ0QsTUFBTSxZQUFZLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBRSxDQUFBO29CQUN6RCxJQUFJLGVBQWUsR0FBRyxLQUFLLENBQUE7b0JBRTNCLHNFQUFzRTtvQkFDdEUsSUFBSSxRQUFRLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLEtBQUssS0FBSyxDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFO3dCQUNoRixlQUFlLEdBQUcsSUFBSSxDQUFBO3FCQUN6QjtvQkFFRCxzQ0FBc0M7b0JBQ3RDLElBQ0ksQ0FBQyxlQUFlO3dCQUNoQixZQUFZLENBQUMsU0FBUzt3QkFDdEIsSUFBQSx3QkFBZ0IsRUFBQyxvQkFBb0IsRUFBRSxXQUFXLEVBQUUsWUFBWSxDQUFDLEVBQ25FO3dCQUNFLGVBQWUsR0FBRyxJQUFJLENBQUE7cUJBQ3pCO29CQUVELElBQUksQ0FBQyxlQUFlO3dCQUFFLE9BQU8sSUFBSSxDQUFBO2lCQUNwQzthQUNKO1lBRUQsT0FBTyxLQUFLLENBQUE7UUFDaEIsQ0FBQztRQUVPLGdCQUFnQixDQUFDLGFBQXFCLEVBQUUsS0FBWTtZQUN4RCxNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsS0FBSyxFQUFFLElBQUksS0FBSyxNQUFNLElBQUksS0FBSyxDQUFDLEtBQUssS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7WUFFN0csTUFBTSxVQUFVLEdBQUcsSUFBQSwwQkFBa0IsRUFBQyxhQUFhLENBQUMsQ0FBQTtZQUNwRCxNQUFNLFFBQVEsR0FBRyxJQUFBLDBCQUFrQixFQUFDLFlBQVksQ0FBQyxDQUFBO1lBQ2pELE1BQU0sU0FBUyxHQUFHO2dCQUNkLElBQUksRUFBRSxRQUFRLENBQUMsSUFBSSxHQUFHLFVBQVUsQ0FBQyxJQUFJO2dCQUNyQyxJQUFJLEVBQUUsUUFBUSxDQUFDLElBQUksR0FBRyxVQUFVLENBQUMsSUFBSTthQUN4QyxDQUFBO1lBQ0QsTUFBTSxNQUFNLEdBQUc7Z0JBQ1gsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQztnQkFDL0IsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQzthQUNsQyxDQUFBO1lBRUQsSUFDSSxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUM7Z0JBQ2pCLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FBQztnQkFDakIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFDckU7Z0JBQ0UsMkRBQTJEO2dCQUMzRCxPQUFPLElBQUksQ0FBQTthQUNkO2lCQUFNO2dCQUNILE1BQU0sTUFBTSxHQUFHLElBQUEsMkJBQW1CLEVBQUMsYUFBYSxFQUFFLFlBQVksQ0FBQyxDQUFBO2dCQUUvRCxJQUFJLFFBQVEsR0FBRyxhQUFhLENBQUE7Z0JBRTVCLCtGQUErRjtnQkFDL0YsaUVBQWlFO2dCQUNqRSxNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLElBQUEsMEJBQWtCLEVBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFBO2dCQUM1RixJQUFJLGdCQUFnQixJQUFJLGdCQUFnQixDQUFDLEtBQUssS0FBSyxJQUFJLENBQUMsS0FBSyxJQUFJLGdCQUFnQixDQUFDLFNBQVMsRUFBRTtvQkFDekYsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRTt3QkFDbEQsc0NBQXNDO3dCQUN0QyxJQUFJLGdCQUFnQixDQUFDLElBQUksS0FBSyxNQUFNLElBQUksZ0JBQWdCLENBQUMsSUFBSSxLQUFLLE9BQU87NEJBQUUsT0FBTyxJQUFJLENBQUE7cUJBQ3pGO3lCQUFNO3dCQUNILGtDQUFrQzt3QkFDbEMsSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLEtBQUssUUFBUSxJQUFJLGdCQUFnQixDQUFDLElBQUksS0FBSyxPQUFPOzRCQUFFLE9BQU8sSUFBSSxDQUFBO3FCQUMzRjtvQkFFRCxNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FDeEMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLEtBQUssRUFBRSxJQUFJLEtBQUssTUFBTSxJQUFJLEtBQUssQ0FBQyxLQUFLLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FDbEUsQ0FBQTtvQkFFRCxJQUNJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEdBQUcsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFBLDBCQUFrQixFQUFDLE1BQU0sQ0FBQyxDQUFDO3dCQUMzRSxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxFQUM3Qjt3QkFDRSx1REFBdUQ7d0JBQ3ZELDZGQUE2Rjt3QkFDN0YsT0FBTyxLQUFLLENBQUE7cUJBQ2Y7aUJBQ0o7Z0JBRUQsMERBQTBEO2dCQUMxRCxPQUFPLElBQUksQ0FBQTthQUNkO1FBQ0wsQ0FBQztLQUNKO0lBNVBELHNCQTRQQzs7Ozs7O0lDN1BELE1BQWEsSUFBSTtRQUNiLFlBQ1csS0FBWSxFQUNaLGFBQXFCLEVBQ3JCLFdBQW1CLEVBQ25CLFFBQWUsRUFDZixJQUFjO1lBSmQsVUFBSyxHQUFMLEtBQUssQ0FBTztZQUNaLGtCQUFhLEdBQWIsYUFBYSxDQUFRO1lBQ3JCLGdCQUFXLEdBQVgsV0FBVyxDQUFRO1lBQ25CLGFBQVEsR0FBUixRQUFRLENBQU87WUFDZixTQUFJLEdBQUosSUFBSSxDQUFVO1FBQ3RCLENBQUM7S0FDUDtJQVJELG9CQVFDOzs7Ozs7SUNQRCxNQUFhLE1BQU8sU0FBUSxhQUFLO1FBQzdCLElBQUksWUFBWTtZQUNaLE9BQU8sR0FBRyxDQUFBO1FBQ2QsQ0FBQztRQUVELFlBQVksS0FBaUI7WUFDekIsS0FBSyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUMxQixDQUFDO1FBRUQsYUFBYSxDQUFDLGFBQXFCLEVBQUUsS0FBWSxFQUFFLG1CQUFnQztZQUMvRSxPQUFPLElBQUksQ0FBQyw2QkFBNkIsQ0FBQyxhQUFhLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxtQkFBbUIsRUFBRSxHQUFHLENBQUMsQ0FBQTtRQUN0RyxDQUFDO1FBRUQsaUJBQWlCLENBQUMsYUFBcUIsRUFBRSxLQUFZLEVBQUUsS0FBa0I7WUFDckUsSUFBSSxDQUFDLG9CQUFvQixDQUFDLGFBQWEsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQTtRQUN6RSxDQUFDO1FBRUQsSUFBSSxTQUFTO1lBQ1QsT0FBTyxJQUFJLENBQUE7UUFDZixDQUFDO0tBQ0o7SUFwQkQsd0JBb0JDO0lBRUQsTUFBTSxPQUFPLEdBQWU7UUFDeEIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUU7UUFDcEIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRTtRQUNyQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFO1FBQ3JCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRTtLQUN6QixDQUFBOzs7Ozs7SUMzQkQsTUFBYSxJQUFLLFNBQVEsYUFBSztRQUMzQixJQUFJLFlBQVk7WUFDWixPQUFPLEdBQUcsQ0FBQTtRQUNkLENBQUM7UUFFRCxZQUFZLEtBQWlCO1lBQ3pCLEtBQUssQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFDeEIsQ0FBQztRQUVELGFBQWEsQ0FBQyxhQUFxQixFQUFFLEtBQVksRUFBRSxtQkFBZ0M7WUFDL0UsTUFBTSxLQUFLLEdBQVcsRUFBRSxDQUFBO1lBRXhCLEtBQUssSUFBSSxNQUFNLElBQUksT0FBTyxFQUFFO2dCQUN4QixNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxNQUFNLENBQUMsQ0FBQTtnQkFDekQsSUFBSSxDQUFDLFVBQVUsQ0FDWCxLQUFLLEVBQ0wsYUFBYSxFQUNiLFdBQVcsRUFDWCxLQUFLLEVBQ0wsbUJBQW1CLEVBQ25CLElBQUksQ0FBQyxZQUFZLEVBQ2pCLENBQUMsUUFBUSxFQUFFLEVBQUU7b0JBQ1QsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7b0JBQ2hELFNBQVMsQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFBO29CQUMzQixTQUFTLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQTtnQkFDOUIsQ0FBQyxDQUNKLENBQUE7YUFDSjtZQUVELFdBQVc7WUFDWCxNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtZQUM3QyxJQUFJLFNBQVMsQ0FBQyxTQUFTLEVBQUU7Z0JBQ3JCLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxFQUFFLG1CQUFtQixFQUFFLGFBQWEsRUFBRTtvQkFDaEYsYUFBYSxHQUFHLENBQUM7b0JBQ2pCLGFBQWEsR0FBRyxDQUFDO29CQUNqQixhQUFhLEdBQUcsQ0FBQztpQkFDcEIsQ0FBQyxDQUFBO2dCQUNGLElBQUksV0FBVyxFQUFFO29CQUNiLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLGFBQWEsRUFBRSxJQUFJLENBQUMsQ0FBQTtvQkFDNUQsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtpQkFDbkI7YUFDSjtZQUNELElBQUksU0FBUyxDQUFDLFFBQVEsRUFBRTtnQkFDcEIsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsbUJBQW1CLEVBQUUsYUFBYSxFQUFFO29CQUNoRixhQUFhLEdBQUcsQ0FBQztvQkFDakIsYUFBYSxHQUFHLENBQUM7aUJBQ3BCLENBQUMsQ0FBQTtnQkFDRixJQUFJLFdBQVcsRUFBRTtvQkFDYixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUE7b0JBQzdELEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7aUJBQ25CO2FBQ0o7WUFFRCxPQUFPLEtBQUssQ0FBQTtRQUNoQixDQUFDO1FBRU8sZUFBZSxDQUNuQixLQUFZLEVBQ1osbUJBQWdDLEVBQ2hDLGFBQXFCLEVBQ3JCLFNBQW1CO1lBRW5CLE9BQU8sQ0FDSCxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ3ZELENBQUMsYUFBYSxFQUFFLEdBQUcsU0FBUyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUNwRyxDQUFBO1FBQ0wsQ0FBQztRQUVPLGNBQWMsQ0FBQyxVQUFpQixFQUFFLGFBQXFCLEVBQUUsWUFBcUI7WUFDbEYsTUFBTSxRQUFRLEdBQUcsSUFBSSxhQUFLLENBQUMsVUFBVSxFQUFFLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQTtZQUNuRixRQUFRLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEdBQUcsS0FBSyxDQUFBO1lBRS9FLE1BQU0saUJBQWlCLEdBQUcsYUFBYSxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFDakUsTUFBTSxXQUFXLEdBQUcsYUFBYSxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFFM0QsUUFBUSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFBO1lBQy9ELFFBQVEsQ0FBQyxPQUFPLENBQUMsV0FBVyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUE7WUFDN0YsUUFBUSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsR0FBRyxJQUFJLENBQUE7WUFDdEMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLElBQUksQ0FBQTtZQUUxQyxNQUFNLFlBQVksR0FBRyxZQUFZLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFBO1lBQ25ELE9BQU8sSUFBSSxXQUFJLENBQ1gsVUFBVSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUUsRUFDbEMsYUFBYSxFQUNiLFdBQVcsRUFDWCxRQUFRLEVBQ1IsWUFBWSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FDOUMsQ0FBQTtRQUNMLENBQUM7UUFFRCxpQkFBaUIsQ0FBQyxhQUFxQixFQUFFLEtBQVksRUFBRSxLQUFrQjtZQUNyRSxJQUFJLENBQUMsb0JBQW9CLENBQUMsYUFBYSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQzFFLENBQUM7UUFFRCxJQUFJLFNBQVM7WUFDVCxPQUFPLEtBQUssQ0FBQTtRQUNoQixDQUFDO0tBQ0o7SUFqR0Qsb0JBaUdDO0lBRUQsTUFBTSxPQUFPLEdBQWU7UUFDeEIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUU7UUFDcEIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUU7UUFDcEIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRTtRQUNyQixFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRTtRQUNwQixFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFO1FBQ3JCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUU7UUFDckIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRTtRQUNyQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUU7S0FDekIsQ0FBQTs7Ozs7O0lDNUdELE1BQWEsTUFBTyxTQUFRLGFBQUs7UUFDN0IsSUFBSSxZQUFZO1lBQ1osT0FBTyxHQUFHLENBQUE7UUFDZCxDQUFDO1FBRUQsWUFBWSxLQUFpQjtZQUN6QixLQUFLLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQzFCLENBQUM7UUFFRCxhQUFhLENBQUMsYUFBcUIsRUFBRSxLQUFZLEVBQUUsbUJBQWdDO1lBQy9FLE1BQU0sS0FBSyxHQUFXLEVBQUUsQ0FBQTtZQUV4QixLQUFLLElBQUksTUFBTSxJQUFJLE9BQU8sRUFBRTtnQkFDeEIsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsTUFBTSxDQUFDLENBQUE7Z0JBQ3pELElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLGFBQWEsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLG1CQUFtQixFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQTthQUNwRztZQUNELE9BQU8sS0FBSyxDQUFBO1FBQ2hCLENBQUM7UUFFRCxpQkFBaUIsQ0FBQyxhQUFxQixFQUFFLEtBQVksRUFBRSxLQUFrQjtZQUNyRSxJQUFJLENBQUMsb0JBQW9CLENBQUMsYUFBYSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQzFFLENBQUM7UUFFRCxJQUFJLFNBQVM7WUFDVCxPQUFPLEtBQUssQ0FBQTtRQUNoQixDQUFDO0tBQ0o7SUExQkQsd0JBMEJDO0lBRUQsTUFBTSxPQUFPLEdBQXFDO1FBQzlDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFO1FBQ3BCLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFO1FBQ3BCLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUU7UUFDckIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRTtRQUNyQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUU7UUFDdEIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFO1FBQ3RCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUU7UUFDckIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRTtLQUN4QixDQUFBOzs7Ozs7SUNyQ0QsTUFBYSxLQUFNLFNBQVEsYUFBSztRQUM1QixJQUFJLFlBQVk7WUFDWixPQUFPLEdBQUcsQ0FBQTtRQUNkLENBQUM7UUFFRCxZQUFZLEtBQWlCO1lBQ3pCLEtBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFDekIsQ0FBQztRQUVELGFBQWEsQ0FBQyxhQUFxQixFQUFFLEtBQVksRUFBRSxtQkFBZ0M7WUFDL0UsT0FBTyxJQUFJLENBQUMsNkJBQTZCLENBQUMsYUFBYSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsbUJBQW1CLEVBQUUsR0FBRyxDQUFDLENBQUE7UUFDdEcsQ0FBQztRQUVELGlCQUFpQixDQUFDLGFBQXFCLEVBQUUsS0FBWSxFQUFFLEtBQWtCO1lBQ3JFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxhQUFhLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUE7UUFDekUsQ0FBQztRQUVELElBQUksU0FBUztZQUNULE9BQU8sSUFBSSxDQUFBO1FBQ2YsQ0FBQztLQUNKO0lBcEJELHNCQW9CQztJQUVELE1BQU0sT0FBTyxHQUFHO1FBQ1osRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUU7UUFDcEIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUU7UUFDcEIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRTtRQUNyQixFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRTtRQUNwQixFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFO1FBQ3JCLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUU7UUFDckIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRTtRQUNyQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUU7S0FDekIsQ0FBQTs7Ozs7O0lDN0JELE1BQWEsSUFBSyxTQUFRLGFBQUs7UUFDM0IsSUFBSSxZQUFZO1lBQ1osT0FBTyxFQUFFLENBQUE7UUFDYixDQUFDO1FBRUQsWUFBWSxLQUFpQjtZQUN6QixLQUFLLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQ3hCLENBQUM7UUFFRCxhQUFhLENBQUMsYUFBcUIsRUFBRSxLQUFZLEVBQUUsbUJBQWdDO1lBQy9FLE1BQU0sS0FBSyxHQUFXLEVBQUUsQ0FBQTtZQUV4QixjQUFjO1lBQ2QsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxJQUFBLDBCQUFrQixFQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQTtZQUNsRyxNQUFNLHFCQUFxQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLElBQUEsMEJBQWtCLEVBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFBO1lBQ3BHLE1BQU0sRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEdBQUcsSUFBQSwwQkFBa0IsRUFBQyxhQUFhLENBQUMsQ0FBQTtZQUM3RCxNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQyxLQUFLLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUV6RCxJQUFJLG9CQUFvQixLQUFLLElBQUksSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLEtBQUssSUFBSSxFQUFFO2dCQUMvRSxtREFBbUQ7Z0JBQ25ELElBQUksU0FBUyxLQUFLLGtCQUFrQixFQUFFO29CQUNsQyxJQUFJLENBQUMsVUFBVSxDQUNYLEtBQUssRUFDTCxhQUFhLEVBQ2Isb0JBQW9CLEVBQ3BCLEtBQUssRUFDTCxtQkFBbUIsRUFDbkIsSUFBSSxDQUFDLFlBQVksQ0FDcEIsQ0FBQTtpQkFDSjtnQkFFRCxzQkFBc0I7Z0JBQ3RCLElBQ0kscUJBQXFCLEtBQUssSUFBSTtvQkFDOUIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLElBQUk7b0JBQzdDLENBQUMsSUFBSSxDQUFDLEtBQUssS0FBSyxPQUFPLENBQUMsQ0FBQyxDQUFDLFNBQVMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsS0FBSyxDQUFDLENBQUMsRUFDOUQ7b0JBQ0UsSUFBSSxDQUFDLFVBQVUsQ0FDWCxLQUFLLEVBQ0wsYUFBYSxFQUNiLHFCQUFxQixFQUNyQixLQUFLLEVBQ0wsbUJBQW1CLEVBQ25CLElBQUksQ0FBQyxZQUFZLEVBQ2pCLENBQUMsUUFBUSxFQUFFLEVBQUU7d0JBQ1QsUUFBUSxDQUFDLHVCQUF1QixHQUFHLG9CQUFvQixDQUFBO29CQUMzRCxDQUFDLENBQ0osQ0FBQTtpQkFDSjthQUNKO1lBRUQsTUFBTSxtQkFBbUIsR0FBRyxDQUFDLFdBQW1CLEVBQUUsRUFBRTtnQkFDaEQsSUFBSSxDQUFDLFVBQVUsQ0FDWCxLQUFLLEVBQ0wsYUFBYSxFQUNiLFdBQVcsRUFDWCxLQUFLLEVBQ0wsbUJBQW1CLEVBQ25CLElBQUksQ0FBQyxZQUFZLEVBQ2pCLENBQUMsUUFBUSxFQUFFLEVBQUU7b0JBQ1QsUUFBUSxDQUFDLE9BQU8sQ0FBQyxXQUFZLENBQUMsR0FBRyxJQUFJLGFBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7Z0JBQzFELENBQUMsRUFDRCxJQUFJLENBQ1AsQ0FBQTtZQUNMLENBQUMsQ0FBQTtZQUVELGdHQUFnRztZQUNoRyxJQUNJLG9CQUFvQixLQUFLLElBQUk7Z0JBQzdCLEtBQUssQ0FBQyxPQUFPLENBQUMsb0JBQW9CLENBQUMsS0FBSyxJQUFJO2dCQUM1QyxTQUFTLEtBQUssa0JBQWtCLEVBQ2xDO2dCQUNFLG1CQUFtQixDQUFDLG9CQUFvQixDQUFDLENBQUE7YUFDNUM7WUFFRCxpQkFBaUI7WUFDakIsS0FBSyxJQUFJLE1BQU0sSUFBSSxJQUFJLENBQUMsY0FBYyxFQUFFO2dCQUNwQyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLGFBQWEsRUFBRSxNQUFNLENBQUMsQ0FBQTtnQkFFekQsSUFDSSxXQUFXLEtBQUssSUFBSTtvQkFDcEIsS0FBSyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUM7b0JBQzFCLEtBQUssQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFFLENBQUMsS0FBSyxLQUFLLElBQUksQ0FBQyxLQUFLLEVBQ2xEO29CQUNFLElBQUksU0FBUyxLQUFLLGtCQUFrQixFQUFFO3dCQUNsQyxtQkFBbUIsQ0FBQyxXQUFXLENBQUMsQ0FBQTtxQkFDbkM7eUJBQU07d0JBQ0gsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxLQUFLLEVBQUUsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFBO3FCQUNwRztpQkFDSjthQUNKO1lBRUQsc0JBQXNCO1lBQ3RCLElBQUksS0FBSyxDQUFDLHVCQUF1QixLQUFLLElBQUksRUFBRTtnQkFDeEMsTUFBTSx1QkFBdUIsR0FBRyxLQUFLLENBQUMsdUJBQXVCLENBQUE7Z0JBQzdELE1BQU0sY0FBYyxHQUFHLHVCQUF1QixHQUFHLGFBQWEsQ0FBQTtnQkFDOUQsSUFBSSxjQUFjLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLElBQUksY0FBYyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFO29CQUNoRixJQUFJLENBQUMsVUFBVSxDQUNYLEtBQUssRUFDTCxhQUFhLEVBQ2IsdUJBQXVCLEVBQ3ZCLEtBQUssRUFDTCxtQkFBbUIsRUFDbkIsSUFBSSxDQUFDLFlBQVksRUFDakIsQ0FBQyxRQUFRLEVBQUUsRUFBRTt3QkFDVCxRQUFRLENBQUMsT0FBTyxDQUFDLHVCQUF1QixHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsSUFBSSxDQUFBO29CQUN6RSxDQUFDLENBQ0osQ0FBQTtpQkFDSjthQUNKO1lBRUQsT0FBTyxLQUFLLENBQUE7UUFDaEIsQ0FBQztRQUVELGlCQUFpQixDQUFDLGFBQXFCLEVBQUUsS0FBWSxFQUFFLEtBQWtCO1lBQ3JFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxhQUFhLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsY0FBYyxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQ3RGLENBQUM7UUFFRCxJQUFJLFNBQVM7WUFDVCxPQUFPLEtBQUssQ0FBQTtRQUNoQixDQUFDO1FBRUQsSUFBWSxTQUFTO1lBQ2pCLE9BQU8sSUFBSSxDQUFDLEtBQUssS0FBSyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDMUMsQ0FBQztRQUVELElBQVksY0FBYztZQUN0QixPQUFPO2dCQUNILEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFO2dCQUNsQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUU7YUFDcEMsQ0FBQTtRQUNMLENBQUM7S0FDSjtJQXBJRCxvQkFvSUM7Ozs7OztJQ3RJRCxNQUFhLElBQUssU0FBUSxhQUFLO1FBQzNCLElBQUksWUFBWTtZQUNaLE9BQU8sR0FBRyxDQUFBO1FBQ2QsQ0FBQztRQUVELFlBQVksS0FBaUI7WUFDekIsS0FBSyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUN4QixDQUFDO1FBRUQsYUFBYSxDQUFDLGFBQXFCLEVBQUUsS0FBWSxFQUFFLG1CQUFnQztZQUMvRSxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsNkJBQTZCLENBQUMsYUFBYSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsbUJBQW1CLEVBQUUsR0FBRyxDQUFDLENBQUE7WUFFekcsTUFBTSxhQUFhLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxLQUFLLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxhQUFhLENBQUE7WUFDekUsTUFBTSxZQUFZLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxLQUFLLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxhQUFhLENBQUE7WUFDeEUsSUFBSSxhQUFhLElBQUksWUFBWSxFQUFFO2dCQUMvQixLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUU7b0JBQ25CLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEdBQUcsS0FBSyxDQUFBO2dCQUN6RixDQUFDLENBQUMsQ0FBQTthQUNMO1lBRUQsT0FBTyxLQUFLLENBQUE7UUFDaEIsQ0FBQztRQUVELEtBQUssQ0FBQyxLQUFZO1lBQ2QsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLE9BQU8sRUFBRTtnQkFDeEIsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUk7b0JBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQTtnQkFDNUUsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQUk7b0JBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQTthQUM5RTtpQkFBTTtnQkFDSCxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEtBQUssSUFBSTtvQkFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFBO2dCQUM3RSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEtBQUssSUFBSTtvQkFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFBO2FBQy9FO1FBQ0wsQ0FBQztRQUVELGlCQUFpQixDQUFDLGFBQXFCLEVBQUUsS0FBWSxFQUFFLEtBQWtCO1lBQ3JFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxhQUFhLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUE7UUFDekUsQ0FBQztRQUVELElBQUksU0FBUztZQUNULE9BQU8sSUFBSSxDQUFBO1FBQ2YsQ0FBQztLQUNKO0lBeENELG9CQXdDQztJQUVELE1BQU0sT0FBTyxHQUFHO1FBQ1osRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUU7UUFDcEIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUU7UUFDcEIsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRTtRQUNyQixFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFO0tBQ3hCLENBQUE7Ozs7OztJQ3pDRCxNQUFhLEtBQUs7UUFnQmQsWUFBWSxVQUEyQixFQUFFLE9BQTJEO1lBWjdGLGdCQUFXLEdBQWUsT0FBTyxDQUFBO1lBQ2pDLGNBQVMsR0FBYztnQkFDMUIsS0FBSyxFQUFFLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFO2dCQUM1QyxLQUFLLEVBQUUsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUU7YUFDL0MsQ0FBQTtZQUNNLDRCQUF1QixHQUFrQixJQUFJLENBQUE7WUFRaEQsSUFBSSxPQUFPLFVBQVUsS0FBSyxRQUFRLEVBQUU7Z0JBQ2hDLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO2dCQUN2QyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFBO2FBQzdCO2lCQUFNLElBQUksVUFBVSxFQUFFO2dCQUNuQixNQUFNLEtBQUssR0FBRyxVQUFVLENBQUE7Z0JBQ3hCLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQTtnQkFDakMsSUFBSSxDQUFDLFdBQVcsR0FBRyxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFBLG1CQUFXLEVBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFBO2dCQUM1RixJQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsS0FBSyxFQUFFLEVBQUUsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFBO2dCQUM3RixJQUFJLENBQUMsdUJBQXVCLEdBQUcsT0FBTyxFQUFFLGNBQWMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsdUJBQXVCLENBQUE7YUFDaEc7aUJBQU07Z0JBQ0gsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7Z0JBQ3ZDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFBO2FBQ3RDO1FBQ0wsQ0FBQztRQUVNLFNBQVMsQ0FBQyxHQUFXO1lBQ3hCLE1BQU0sUUFBUSxHQUFHLEVBQUUsQ0FBQyxFQUFFLFdBQUksRUFBRSxDQUFDLEVBQUUsZUFBTSxFQUFFLENBQUMsRUFBRSxlQUFNLEVBQUUsQ0FBQyxFQUFFLGFBQUssRUFBRSxDQUFDLEVBQUUsV0FBSSxFQUFFLENBQUMsRUFBRSxXQUFJLEVBQUUsQ0FBQTtZQUM5RSxNQUFNLENBQUMsU0FBUyxFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUUscUJBQXFCLENBQUMsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBRWpGLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO1lBQ3ZDLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsWUFBWSxFQUFFLEtBQUssRUFBRSxFQUFFO2dCQUNqRCxNQUFNLElBQUksR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFBO2dCQUN0QixJQUFJLElBQUksR0FBRyxDQUFDLENBQUE7Z0JBQ1osS0FBSyxJQUFJLElBQUksSUFBSSxZQUFZLEVBQUU7b0JBQzNCLElBQUksSUFBSSxHQUFHLEdBQUcsRUFBRTt3QkFDWixNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUE7d0JBQzVCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHOzRCQUMxRSxNQUFNLGVBQWUsQ0FBQTt3QkFFekIsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFBO3dCQUN6QixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUEsMEJBQWtCLEVBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUE7d0JBQzVGLElBQUksRUFBRSxDQUFBO3FCQUNUO3lCQUFNO3dCQUNILElBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQTt3QkFDekIsT0FBTyxNQUFNLEdBQUcsQ0FBQyxFQUFFOzRCQUNmLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBQSwwQkFBa0IsRUFBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFBOzRCQUN2RCxNQUFNLEVBQUUsQ0FBQTs0QkFDUixJQUFJLEVBQUUsQ0FBQTt5QkFDVDtxQkFDSjtpQkFDSjtZQUNMLENBQUMsQ0FBQyxDQUFBO1lBRUYsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQTtZQUUxRCxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxRQUFRLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUN2RCxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUN4RCxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxRQUFRLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUN2RCxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUV4RCxJQUFJLENBQUMsdUJBQXVCO2dCQUN4QixxQkFBcUIsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBQSw2QkFBcUIsRUFBQyxxQkFBb0MsQ0FBQyxDQUFBO1FBQzFHLENBQUM7UUFFTSxhQUFhO1lBQ2hCLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixFQUFFLENBQUE7WUFDNUQsSUFBSSxLQUFLLEdBQVcsRUFBRSxDQUFBO1lBQ3RCLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxFQUFFO2dCQUNyQyxJQUFJLEtBQUssSUFBSSxLQUFLLENBQUMsS0FBSyxLQUFLLElBQUksQ0FBQyxXQUFXLEVBQUU7b0JBQzNDLEtBQUssR0FBRyxDQUFDLEdBQUcsS0FBSyxFQUFFLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLG1CQUFtQixDQUFDLENBQUMsQ0FBQTtpQkFDbEY7WUFDTCxDQUFDLENBQUMsQ0FBQTtZQUNGLE9BQU8sS0FBSyxDQUFBO1FBQ2hCLENBQUM7UUFFRCxJQUFJLFNBQVM7WUFDVCxJQUFJLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO2dCQUNuQyxPQUFPLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUE7YUFDdEQ7O2dCQUFNLE9BQU8sSUFBSSxDQUFBO1FBQ3RCLENBQUM7UUFFTSxTQUFTLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDLHlCQUF5QixFQUFFO1lBQ25FLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUN2QyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsS0FBSyxFQUFFLElBQUksS0FBSyxNQUFNLElBQUksS0FBSyxDQUFDLEtBQUssS0FBSyxJQUFJLENBQUMsV0FBVyxDQUN4RSxDQUFBO1lBQ0QsT0FBTyxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsWUFBWSxDQUFDLENBQUE7UUFDNUQsQ0FBQztRQUVNLHlCQUF5QjtZQUM1QixNQUFNLEtBQUssR0FBZ0IsSUFBQSw4QkFBc0IsR0FBRSxDQUFBO1lBRW5ELEtBQUssSUFBSSxRQUFRLEdBQUcsQ0FBQyxFQUFFLFFBQVEsR0FBRyxFQUFFLEVBQUUsUUFBUSxFQUFFLEVBQUU7Z0JBQzlDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUE7Z0JBQ3BDLElBQUksS0FBSyxJQUFJLEtBQUssQ0FBQyxLQUFLLEtBQUssSUFBSSxDQUFDLFdBQVcsRUFBRTtvQkFDM0MsS0FBSyxDQUFDLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUE7aUJBQ2pEO2FBQ0o7WUFFRCxPQUFPLEtBQUssQ0FBQTtRQUNoQixDQUFDO1FBRUQsS0FBSztZQUNELElBQUksVUFBVSxHQUFHLEVBQUUsQ0FBQTtZQUVuQixLQUFLLElBQUksSUFBSSxHQUFHLENBQUMsRUFBRSxJQUFJLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFO2dCQUNqQyxZQUFZO2dCQUNaLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUE7Z0JBQ3JCLEtBQUssSUFBSSxJQUFJLEdBQUcsQ0FBQyxFQUFFLElBQUksR0FBRyxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUU7b0JBQ2pDLFlBQVk7b0JBQ1osVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQTtpQkFDdkQ7YUFDSjtZQUVELE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUE7UUFDM0IsQ0FBQzs7SUF6SEwsc0JBMEhDO0lBekhpQixtQkFBYSxHQUFHLDBEQUEwRCxBQUE3RCxDQUE2RDs7Ozs7O0lDUjVGLE1BQWEsSUFBSTtRQUtiLFlBQVksR0FBWTtZQUhoQixXQUFNLEdBQVcsRUFBRSxDQUFBO1lBQ25CLFlBQU8sR0FBVyxDQUFDLENBQUE7WUFHdkIsSUFBSSxDQUFDLGFBQWEsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksYUFBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLGFBQUssRUFBRSxDQUFBO1FBQzNELENBQUM7UUFFRCxJQUFJLEtBQUs7WUFDTCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUE7UUFDdEIsQ0FBQztRQUVELElBQUksTUFBTTtZQUNOLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQTtRQUN2QixDQUFDO1FBRUQsSUFBSSxZQUFZO1lBQ1osSUFBSSxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsRUFBRTtnQkFDbEIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFBO2FBQ2hEO2lCQUFNO2dCQUNILE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQTthQUM1QjtRQUNMLENBQUM7UUFFRCxJQUFJLFFBQVE7WUFDUixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUMsQ0FBQTtRQUMvQyxDQUFDO1FBRUQsT0FBTyxDQUFDLElBQVU7WUFDZCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7WUFDaEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUE7WUFDdEIsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFBO1FBQ2xCLENBQUM7UUFFTyxnQkFBZ0I7WUFDcEIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUE7UUFDaEMsQ0FBQztRQUVELFVBQVUsQ0FBQyxNQUFjO1lBQ3JCLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFBO1FBQ3pCLENBQUM7UUFFRCxJQUFJLE9BQU87WUFDUCxPQUFPLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFBO1FBQzNCLENBQUM7UUFFRCxJQUFJO1lBQ0EsSUFBSSxJQUFJLENBQUMsT0FBTztnQkFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUE7UUFDcEMsQ0FBQztRQUVELElBQUksT0FBTztZQUNQLE9BQU8sSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQTtRQUM1QyxDQUFDO1FBRUQsSUFBSTtZQUNBLElBQUksSUFBSSxDQUFDLE9BQU87Z0JBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFBO1FBQ3BDLENBQUM7UUFFTSxxQkFBcUIsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixFQUFFO1lBQzVELElBQUksUUFBUSxHQUFXLEVBQUUsQ0FBQTtZQUV6QixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFBO1lBQ25DLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUE7WUFDeEIsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQTtZQUU5QixtQ0FBbUM7WUFDbkMsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLGFBQWEsRUFBRTtnQkFDN0IsUUFBUSxJQUFJLEtBQUssQ0FBQTthQUNwQjtpQkFBTSxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssWUFBWSxFQUFFO2dCQUNuQyxRQUFRLElBQUksT0FBTyxDQUFBO2FBQ3RCO2lCQUFNO2dCQUNILElBQUksS0FBSyxDQUFDLElBQUksS0FBSyxNQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLFNBQVMsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLGtCQUFrQixDQUFDLEVBQUU7b0JBQ3hGLGlEQUFpRDtvQkFDakQsUUFBUSxJQUFJLElBQUEsNkJBQXFCLEVBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO2lCQUMzRDtxQkFBTTtvQkFDSCxRQUFRLElBQUksS0FBSyxDQUFDLFlBQVksQ0FBQTtpQkFDakM7YUFDSjtZQUVELDREQUE0RDtZQUM1RCxvR0FBb0c7WUFDcEcsSUFBSSxLQUFLLENBQUMsSUFBSSxLQUFLLE1BQU0sRUFBRTtnQkFDdkIsTUFBTSx1QkFBdUIsR0FBYSxFQUFFLENBQUE7Z0JBQzVDLE1BQU0sZUFBZSxHQUFHLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQTtnQkFDaEcsZUFBZSxDQUFDLGFBQWEsRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFVBQVUsRUFBRSxFQUFFO29CQUNuRCxJQUNJLFVBQVUsQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLEtBQUssQ0FBQyxJQUFJO3dCQUNwQyxVQUFVLENBQUMsV0FBVyxLQUFLLElBQUksQ0FBQyxXQUFXO3dCQUMzQyxVQUFVLENBQUMsYUFBYSxLQUFLLElBQUksQ0FBQyxhQUFhLEVBQ2pEO3dCQUNFLHVCQUF1QixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsYUFBYSxDQUFDLENBQUE7cUJBQ3pEO2dCQUNMLENBQUMsQ0FBQyxDQUFBO2dCQUVGLElBQUksdUJBQXVCLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtvQkFDcEMsTUFBTSxLQUFLLEdBQUcsdUJBQXVCLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxJQUFBLDBCQUFrQixFQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFBO29CQUMxRixNQUFNLEtBQUssR0FBRyx1QkFBdUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLElBQUEsMEJBQWtCLEVBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUE7b0JBRTFGLE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEdBQUcsSUFBQSwwQkFBa0IsRUFBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUE7b0JBQzdELE1BQU0sV0FBVyxHQUFHLElBQUEsNkJBQXFCLEVBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFBO29CQUU3RCxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsSUFBSSxLQUFLLE9BQU8sQ0FBQyxFQUFFO3dCQUM1QyxRQUFRLElBQUksV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFBO3FCQUM3Qjt5QkFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsSUFBSSxLQUFLLE9BQU8sQ0FBQyxFQUFFO3dCQUNuRCxRQUFRLElBQUksV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFBO3FCQUM3Qjt5QkFBTTt3QkFDSCxRQUFRLElBQUksV0FBVyxDQUFBO3FCQUMxQjtpQkFDSjthQUNKO1lBRUQsNENBQTRDO1lBQzVDLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxTQUFTLElBQUksSUFBSSxDQUFDLElBQUksS0FBSyxrQkFBa0IsRUFBRTtnQkFDN0QsUUFBUSxJQUFJLEdBQUcsQ0FBQTthQUNsQjtZQUVELGlDQUFpQztZQUNqQyxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssYUFBYSxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssWUFBWSxFQUFFO2dCQUMzRCxNQUFNLG9CQUFvQixHQUFHLElBQUEsNkJBQXFCLEVBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFBO2dCQUNwRSxRQUFRLElBQUksb0JBQW9CLENBQUE7YUFDbkM7WUFFRCxnREFBZ0Q7WUFDaEQsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLFdBQVcsSUFBSSxJQUFJLENBQUMsSUFBSSxLQUFLLGtCQUFrQixFQUFFO2dCQUMvRCxRQUFRLElBQUksR0FBRyxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBRSxDQUFDLFlBQVksQ0FBQTthQUNyRTtZQUVELCtDQUErQztZQUMvQyxJQUFJLFFBQVEsQ0FBQyxTQUFTLEtBQUssV0FBVyxFQUFFO2dCQUNwQyxRQUFRLElBQUksR0FBRyxDQUFBO2FBQ2xCO2lCQUFNLElBQUksUUFBUSxDQUFDLFNBQVMsRUFBRSxFQUFFO2dCQUM3QixRQUFRLElBQUksR0FBRyxDQUFBO2FBQ2xCO2lCQUFNLElBQUksUUFBUSxDQUFDLFNBQVMsS0FBSyxXQUFXLEVBQUU7Z0JBQzNDLFFBQVEsSUFBSSxHQUFHLENBQUE7YUFDbEI7WUFFRCxPQUFPLFFBQVEsQ0FBQTtRQUNuQixDQUFDO0tBQ0o7SUEzSUQsb0JBMklDOzs7Ozs7SUMvSUQsU0FBZ0IsZ0JBQWdCLENBQUMsR0FBRyxPQUFjO1FBQzlDLE1BQU0sU0FBUyxHQUFHLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUE7UUFDMUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLFNBQVMsR0FBRyxFQUFFLEdBQUcsT0FBTyxDQUFDLENBQUE7SUFDN0MsQ0FBQztJQUhELDRDQUdDO0lBRU0sS0FBSyxVQUFVLHVCQUF1QjtRQUN6QyxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUU7WUFDM0IsVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQTtRQUMxQixDQUFDLENBQUMsQ0FBQTtJQUNOLENBQUM7SUFKRCwwREFJQzs7Ozs7O0lDSFksUUFBQSxVQUFVLEdBQUcsRUFBRSxDQUFBO0lBQzVCLE1BQU0sU0FBUyxHQUFHLGtCQUFVLEdBQUcsSUFBSSxDQUFBO0lBQ25DLE1BQU0sWUFBWSxHQUFHLFNBQVMsQ0FBQTtJQUM5QixNQUFNLFdBQVcsR0FBRyxTQUFTLENBQUE7SUFFaEIsUUFBQSxNQUFNLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQXNCLENBQUE7SUFDM0UsTUFBTSxHQUFHLEdBQUcsY0FBTSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQTZCLENBQUE7SUFDL0QsY0FBTSxDQUFDLEtBQUssR0FBRyxrQkFBVSxHQUFHLENBQUMsQ0FBQTtJQUM3QixjQUFNLENBQUMsTUFBTSxHQUFHLGtCQUFVLEdBQUcsQ0FBQyxDQUFBO0lBRTlCLG1GQUFtRjtJQUNuRiw4QkFBOEI7SUFDOUIsSUFBSSxhQUFhLEdBQUcsQ0FBQyxDQUFBO0lBQ3JCLE1BQU0sWUFBWSxHQUE0RDtRQUMxRSxLQUFLLEVBQUU7WUFDSCxJQUFJLEVBQUUsYUFBYSxDQUNmLHd0REFBd3RELENBQzN0RDtZQUNELElBQUksRUFBRSxhQUFhLENBQ2Ysb3ZDQUFvdkMsQ0FDdnZDO1lBQ0QsTUFBTSxFQUFFLGFBQWEsQ0FDakIsZytFQUFnK0UsQ0FDbitFO1lBQ0QsTUFBTSxFQUFFLGFBQWEsQ0FDakIsd2pGQUF3akYsQ0FDM2pGO1lBQ0QsS0FBSyxFQUFFLGFBQWEsQ0FDaEIsbzlHQUFvOUcsQ0FDdjlHO1lBQ0QsSUFBSSxFQUFFLGFBQWEsQ0FDZix3L0ZBQXcvRixDQUMzL0Y7U0FDSjtRQUNELEtBQUssRUFBRTtZQUNILElBQUksRUFBRSxhQUFhLENBQ2YsZ2tDQUFna0MsQ0FDbmtDO1lBQ0QsSUFBSSxFQUFFLGFBQWEsQ0FDZixnK0JBQWcrQixDQUNuK0I7WUFDRCxNQUFNLEVBQUUsYUFBYSxDQUNqQixnZ0VBQWdnRSxDQUNuZ0U7WUFDRCxNQUFNLEVBQUUsYUFBYSxDQUNqQix3cURBQXdxRCxDQUMzcUQ7WUFDRCxLQUFLLEVBQUUsYUFBYSxDQUNoQix3K0ZBQXcrRixDQUMzK0Y7WUFDRCxJQUFJLEVBQUUsYUFBYSxDQUNmLDR3R0FBNHdHLENBQy93RztTQUNKO0tBQ0osQ0FBQTtJQUVELFNBQVMsYUFBYSxDQUFDLElBQVk7UUFDL0IsTUFBTSxLQUFLLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQTtRQUN6QixhQUFhLEVBQUUsQ0FBQTtRQUNmLEtBQUssQ0FBQyxNQUFNLEdBQUcsR0FBRyxFQUFFLENBQUMsYUFBYSxFQUFFLENBQUE7UUFDcEMsS0FBSyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUE7UUFDaEIsT0FBTyxLQUFLLENBQUE7SUFDaEIsQ0FBQztJQUVELFNBQVMsWUFBWSxDQUFDLFFBQWdCO1FBQ2xDLE9BQU87WUFDSCxDQUFDLEVBQUUsa0JBQVUsR0FBRyxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7WUFDOUIsQ0FBQyxFQUFFLGNBQU0sQ0FBQyxNQUFNLEdBQUcsa0JBQVUsR0FBRyxrQkFBVSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQztTQUN4RSxDQUFBO0lBQ0wsQ0FBQztJQUVELFNBQWdCLFNBQVMsQ0FDckIsSUFBVSxFQUNWLGdCQUErQixFQUMvQixvQkFBK0IsRUFDL0IsUUFBcUI7UUFFckIsS0FBSyxJQUFJLFFBQVEsR0FBRyxDQUFDLEVBQUUsUUFBUSxHQUFHLEVBQUUsRUFBRSxRQUFRLEVBQUUsRUFBRTtZQUM5QyxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLFlBQVksQ0FBQyxRQUFRLENBQUMsQ0FBQTtZQUN2QyxHQUFHLENBQUMsU0FBUyxHQUFHLGNBQWMsQ0FBQyxRQUFRLENBQUMsS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFBO1lBQ2hGLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxrQkFBVSxFQUFFLGtCQUFVLENBQUMsQ0FBQTtZQUUxQyxJQUFJLGdCQUFnQixLQUFLLFFBQVEsRUFBRTtnQkFDL0IsR0FBRyxDQUFDLFNBQVMsR0FBRyx3QkFBd0IsQ0FBQTtnQkFDeEMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLGtCQUFVLEVBQUUsa0JBQVUsQ0FBQyxDQUFBO2FBQzdDO1lBQ0QsSUFBSSxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDaEMsR0FBRyxDQUFDLFNBQVMsR0FBRyx5QkFBeUIsQ0FBQTtnQkFDekMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLGtCQUFVLEVBQUUsa0JBQVUsQ0FBQyxDQUFBO2FBQzdDO1lBQ0QsSUFBSSxRQUFRLEVBQUUsYUFBYSxLQUFLLFFBQVEsSUFBSSxRQUFRLEVBQUUsV0FBVyxLQUFLLFFBQVEsRUFBRTtnQkFDNUUsR0FBRyxDQUFDLFNBQVMsR0FBRywyQkFBMkIsQ0FBQTtnQkFDM0MsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLGtCQUFVLEVBQUUsa0JBQVUsQ0FBQyxDQUFBO2FBQzdDO1NBQ0o7UUFDRCxlQUFlLEVBQUUsQ0FBQTtRQUNqQixJQUFJLFFBQVE7WUFBRSxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQUMzQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDaEIsSUFBSSxnQkFBZ0IsS0FBSyxJQUFJO1lBQUUsaUJBQWlCLENBQUMsSUFBSSxFQUFFLGdCQUFnQixDQUFDLENBQUE7SUFDNUUsQ0FBQztJQTVCRCw4QkE0QkM7SUFFRCxTQUFTLGlCQUFpQixDQUFDLElBQVUsRUFBRSxnQkFBd0I7UUFDM0QsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUUsQ0FBQTtRQUMxRCxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsYUFBYSxDQUM3QixnQkFBZ0IsRUFDaEIsSUFBSSxDQUFDLFlBQVksRUFDakIsSUFBSSxDQUFDLFlBQVksQ0FBQyx5QkFBeUIsRUFBRSxDQUNoRCxDQUFBO1FBRUQsS0FBSyxJQUFJLElBQUksSUFBSSxLQUFLLEVBQUU7WUFDcEIsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFBO1lBQy9DLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxJQUFJLENBQUE7WUFFdkUsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFBO1lBQ2YsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsa0JBQVUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGtCQUFVLEdBQUcsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsa0JBQVUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLGtCQUFVLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFBO1lBQzdHLEdBQUcsQ0FBQyxTQUFTLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUE7WUFDNUUsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFBO1NBQ2I7SUFDTCxDQUFDO0lBRUQsU0FBUyxtQkFBbUIsQ0FBQyxJQUFVO1FBQ25DLE1BQU0sYUFBYSxHQUFHLElBQUEsMEJBQWtCLEVBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFBO1FBQzVELE1BQU0sV0FBVyxHQUFHLElBQUEsMEJBQWtCLEVBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFBO1FBQ3hELE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQTtRQUNmLE1BQU0sS0FBSyxHQUFHLHNCQUFzQixDQUFBO1FBRXBDLE1BQU0sZ0JBQWdCLEdBQUc7WUFDckIsS0FBSyxFQUFFLGFBQWEsQ0FBQyxJQUFJLEdBQUcsa0JBQVUsR0FBRyxrQkFBVSxHQUFHLENBQUM7WUFDdkQsS0FBSyxFQUFFLENBQUMsQ0FBQyxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsR0FBRyxrQkFBVSxHQUFHLGtCQUFVLEdBQUcsQ0FBQztTQUNoRSxDQUFBO1FBQ0QsTUFBTSxjQUFjLEdBQUc7WUFDbkIsR0FBRyxFQUFFLFdBQVcsQ0FBQyxJQUFJLEdBQUcsa0JBQVUsR0FBRyxrQkFBVSxHQUFHLENBQUM7WUFDbkQsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxrQkFBVSxHQUFHLGtCQUFVLEdBQUcsQ0FBQztTQUM1RCxDQUFBO1FBRUQsU0FBUyxDQUFDLGdCQUFnQixFQUFFLGNBQWMsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUE7SUFDN0QsQ0FBQztJQUVELFNBQVMsU0FBUyxDQUNkLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBb0MsRUFDbEQsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFnQyxFQUMxQyxLQUFhLEVBQ2IsS0FBYTtRQUViLDhDQUE4QztRQUM5QyxJQUFJLE9BQU8sR0FBRyxLQUFLLEdBQUcsQ0FBQyxDQUFBO1FBQ3ZCLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLEtBQUssRUFBRSxHQUFHLEdBQUcsS0FBSyxDQUFDLENBQUE7UUFFaEQsR0FBRyxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUE7UUFFdkIsMkZBQTJGO1FBQzNGLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQTtRQUNmLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQ3hCLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFBO1FBQ3BCLEdBQUcsQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFBO1FBQ3JCLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQTtRQUVaLGlGQUFpRjtRQUNqRixHQUFHLENBQUMsU0FBUyxFQUFFLENBQUE7UUFDZixHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQTtRQUNwQixHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxHQUFHLEdBQUcsT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUV4RyxnRUFBZ0U7UUFDaEUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLEVBQUUsR0FBRyxHQUFHLE9BQU8sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFFeEcsa0dBQWtHO1FBQ2xHLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFBO1FBQ3BCLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxHQUFHLE9BQU8sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxFQUFFLEdBQUcsR0FBRyxPQUFPLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBRXhHLCtCQUErQjtRQUMvQixHQUFHLENBQUMsTUFBTSxFQUFFLENBQUE7SUFDaEIsQ0FBQztJQUVELFNBQVMsY0FBYyxDQUFDLFFBQWdCO1FBQ3BDLE9BQU8sQ0FBQyxDQUFDLFFBQVEsSUFBSSxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQTtJQUNwRSxDQUFDO0lBRUQsU0FBUyxlQUFlO1FBQ3BCLE1BQU0sUUFBUSxHQUFHLEVBQUUsQ0FBQTtRQUNuQixHQUFHLENBQUMsSUFBSSxHQUFHLEdBQUcsUUFBUSxVQUFVLENBQUE7UUFFaEMsS0FBSyxJQUFJLElBQUksR0FBRyxDQUFDLEVBQUUsSUFBSSxHQUFHLENBQUMsRUFBRSxJQUFJLEVBQUUsRUFBRTtZQUNqQyxHQUFHLENBQUMsU0FBUyxHQUFHLGNBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFBO1lBQzVFLEdBQUcsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsa0JBQVUsR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsR0FBRyxRQUFRLEVBQUUsY0FBTSxDQUFDLE1BQU0sR0FBRyxRQUFRLEdBQUcsR0FBRyxDQUFDLENBQUE7U0FDbkg7UUFFRCxLQUFLLElBQUksSUFBSSxHQUFHLENBQUMsRUFBRSxJQUFJLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFO1lBQ2pDLEdBQUcsQ0FBQyxTQUFTLEdBQUcsY0FBYyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFBO1lBQ2hGLEdBQUcsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsRUFBRSxRQUFRLEdBQUcsR0FBRyxFQUFFLGtCQUFVLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsUUFBUSxHQUFHLEdBQUcsQ0FBQyxDQUFBO1NBQzNGO0lBQ0wsQ0FBQztJQUVELEtBQUssVUFBVSxVQUFVLENBQUMsSUFBVTtRQUNoQyxPQUFPLGFBQWEsR0FBRyxDQUFDLEVBQUU7WUFDdEIsTUFBTSxJQUFBLCtCQUF1QixHQUFFLENBQUE7U0FDbEM7UUFFRCxLQUFLLElBQUksUUFBUSxHQUFHLENBQUMsRUFBRSxRQUFRLEdBQUcsRUFBRSxFQUFFLFFBQVEsRUFBRSxFQUFFO1lBQzlDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFBO1lBQ2pELElBQUksQ0FBQyxLQUFLO2dCQUFFLFNBQVE7WUFDcEIsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxZQUFZLENBQUMsUUFBUSxDQUFDLENBQUE7WUFFdkMsTUFBTSxLQUFLLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUE7WUFDbkQsTUFBTSxNQUFNLEdBQUcsQ0FBQyxrQkFBVSxHQUFHLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUMzQyxHQUFHLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFBO1NBQ3JFO0lBQ0wsQ0FBQzs7Ozs7O0lDbE5ELE1BQXNCLFNBQVM7UUFDM0IsWUFBbUIsS0FBWTtZQUFaLFVBQUssR0FBTCxLQUFLLENBQU87UUFBRyxDQUFDO0tBR3RDO0lBSkQsOEJBSUM7Ozs7OztJQ0ZELG1GQUFtRjtJQUVuRixNQUFhLHlCQUEwQixTQUFRLHFCQUFTO1FBQ3BELGlDQUFpQztRQUVqQyxHQUFHO1lBQ0MsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFBO1lBRWxCLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsRUFBRTtnQkFDM0MsUUFBUSxLQUFLLEVBQUUsSUFBSSxFQUFFO29CQUNqQixLQUFLLElBQUk7d0JBQ0wsT0FBTTtvQkFDVixLQUFLLE1BQU07d0JBQ1AsVUFBVSxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQTt3QkFDeEQsT0FBTTtvQkFDVixLQUFLLFFBQVE7d0JBQ1QsVUFBVSxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFBO3dCQUMxRCxPQUFNO29CQUNWLEtBQUssUUFBUTt3QkFDVCxVQUFVLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUE7d0JBQzFELE9BQU07b0JBQ1YsS0FBSyxNQUFNO3dCQUNQLFVBQVUsSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUE7d0JBQ3hELE9BQU07b0JBQ1YsS0FBSyxPQUFPO3dCQUNSLFVBQVUsSUFBSSxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUE7d0JBQ3pELE9BQU07b0JBQ1YsS0FBSyxNQUFNO3dCQUNQLFVBQVUsSUFBSSxJQUFJLENBQUMsY0FBYyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUE7d0JBQ3hELE9BQU07aUJBQ2I7WUFDTCxDQUFDLENBQUMsQ0FBQTtZQUVGLE9BQU8sVUFBVSxDQUFBO1FBQ3JCLENBQUM7UUFFTyxlQUFlLENBQUMsUUFBZ0IsRUFBRSxLQUFhLEVBQUUsWUFBd0IsRUFBRSxLQUFpQjtZQUNoRyxNQUFNLGVBQWUsR0FBRyxLQUFLLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQ2xELE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEdBQUcsSUFBQSwwQkFBa0IsRUFBQyxRQUFRLENBQUMsQ0FBQTtZQUNuRCxNQUFNLFdBQVcsR0FBRyxZQUFZLENBQUMsS0FBSyxLQUFLLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxLQUFLLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUE7WUFDMUcsT0FBTyxDQUFDLEtBQUssR0FBRyxXQUFXLENBQUMsR0FBRyxlQUFlLENBQUE7UUFDbEQsQ0FBQztRQUVPLGNBQWMsQ0FBQyxRQUFnQixFQUFFLEtBQWlCO1lBQ3RELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQTtZQUNqQixNQUFNLFlBQVksR0FBRztnQkFDakIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUN4QixDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7Z0JBQ2hDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDaEMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUM1QixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQzFCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUM5QixDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUNoQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7YUFDM0IsQ0FBQTtZQUNELE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUNyRSxDQUFDO1FBRU8sZ0JBQWdCLENBQUMsUUFBZ0IsRUFBRSxLQUFpQjtZQUN4RCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUE7WUFDakIsTUFBTSxZQUFZLEdBQUc7Z0JBQ2pCLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO2dCQUNoQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO2dCQUNoQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO2dCQUNoQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO2dCQUNoQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO2dCQUNoQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQztnQkFDaEMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQzthQUMzQyxDQUFBO1lBQ0QsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQ3JFLENBQUM7UUFFTyxnQkFBZ0IsQ0FBQyxRQUFnQixFQUFFLEtBQWlCO1lBQ3hELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQTtZQUNqQixNQUFNLFlBQVksR0FBRztnQkFDakIsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQztnQkFDeEMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztnQkFDNUIsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztnQkFDOUIsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztnQkFDOUIsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztnQkFDaEMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQztnQkFDbEMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztnQkFDNUIsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQzthQUMzQyxDQUFBO1lBQ0QsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQ3JF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NUIsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQzthQUN6QyxDQUFBO1lBQ0QsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQ3JFLENBQUM7UUFFTyxjQUFjLENBQUMsUUFBZ0IsRUFBRSxLQUFpQjtZQUN0RCxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUE7WUFDbkIsTUFBTSxZQUFZLEdBQUc7Z0JBQ2pCLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDNUIsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDO2FBQ2pDLENBQUE7WUFDRCxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsS0FBSyxDQUFDLENBQUE7UUFDckUsQ0FBQztLQUNKO0lBbElELDhEQWtJQzs7Ozs7O0lDcklELE1BQXNCLEdBQUc7UUFDckIsWUFBbUIsS0FBWSxFQUFTLEtBQW9CO1lBQXpDLFVBQUssR0FBTCxLQUFLLENBQU87WUFBUyxVQUFLLEdBQUwsS0FBSyxDQUFlO1FBQUcsQ0FBQztLQUduRTtJQUpELGtCQUlDOzs7Ozs7SUNERCxNQUFhLFNBQVUsU0FBUSxTQUFHO1FBQWxDOztZQUNZLG1CQUFjLEdBQUcsU0FBUyxDQUFBO1lBRWxDLGtFQUFrRTtZQUMxRCxjQUFTLEdBQUcsQ0FBQyxDQUFBO1lBRWIsZ0JBQVcsR0FBRyxDQUFDLENBQUE7WUFDZixrQkFBYSxHQUFHLENBQUMsQ0FBQTtZQUVqQix3QkFBbUIsR0FBRyxDQUFDLENBQUE7WUFDdkIsMEJBQXFCLEdBQUcsQ0FBQyxDQUFBO1FBeUZyQyxDQUFDO1FBdkZHLEdBQUc7WUFDQyxJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQTtZQUNsQixNQUFNLGNBQWMsR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUE7WUFFeEMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLEVBQUUsQ0FBQTtZQUN4QyxNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsS0FBSyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFFbkUsSUFBSSxRQUFRLEdBQWdCLElBQUksQ0FBQTtZQUNoQyxJQUFJLGNBQWMsR0FBRyxDQUFDLFFBQVEsQ0FBQTtZQUM5QixLQUFLLElBQUksSUFBSSxJQUFJLEtBQUssRUFBRTtnQkFDcEIsTUFBTSxVQUFVLEdBQ1osSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxLQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDO29CQUN2RixlQUFlLENBQUE7Z0JBRW5CLElBQUksVUFBVSxJQUFJLGNBQWMsRUFBRTtvQkFDOUIsUUFBUSxHQUFHLElBQUksQ0FBQTtvQkFDZixjQUFjLEdBQUcsVUFBVSxDQUFBO2lCQUM5QjthQUNKO1lBQ0QsY0FBYyxJQUFJLGVBQWUsQ0FBQTtZQUVqQyxNQUFNLFlBQVksR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUE7WUFDdEMsT0FBTyxDQUFDLEdBQUcsQ0FDUCxPQUFPLEVBQ1AsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLEdBQUcsY0FBYyxDQUFDLEVBQ3pDLElBQUksR0FBRyxtQkFBbUIsRUFDMUIsSUFBSSxDQUFDLFNBQVMsRUFDZCxzQ0FBc0MsRUFDdEMsQ0FBQyxDQUFDLFlBQVksR0FBRyxjQUFjLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsSUFBSSxDQUM1RCxDQUFBO1lBQ0QsT0FBTyxDQUFDLEdBQUcsQ0FDUCw2QkFBNkIsRUFDN0IsQ0FBQyxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxJQUFJLEVBQzlDLHNDQUFzQyxFQUN0QyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsR0FBRyxJQUFJLENBQUMsbUJBQW1CLENBQUMsR0FBRyxJQUFJLENBQ2pFLENBQUE7WUFFRCxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxRQUFRLEVBQUUsYUFBYSxFQUFFLGNBQWMsQ0FBQyxDQUFBO1lBQ2xFLE9BQU8sUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLGNBQWMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUE7UUFDM0UsQ0FBQztRQUVPLE9BQU8sQ0FBQyxLQUFZLEVBQUUsY0FBc0IsRUFBRSxLQUFhLEVBQUUsSUFBWTtZQUM3RSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUE7WUFFaEIsSUFBSSxjQUFjLEtBQUssQ0FBQyxFQUFFO2dCQUN0QixNQUFNLGNBQWMsR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUE7Z0JBQ3hDLE1BQU0sVUFBVSxHQUFHLElBQUkscURBQXlCLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUE7Z0JBQzdELE1BQU0sWUFBWSxHQUFHLFdBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtnQkFDdEMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFBO2dCQUNsQixJQUFJLENBQUMsYUFBYSxJQUFJLFlBQVksR0FBRyxjQUFjLENBQUE7Z0JBQ25ELE9BQU8sVUFBVSxDQUFBO2FBQ3BCO1lBRUQsSUFBSSxLQUFLLENBQUMsU0FBUyxLQUFLLFdBQVcsRUFBRTtnQkFDakMsT0FBTyxLQUFLLENBQUMsV0FBVyxLQUFLLE9BQU87b0JBQ2hDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxjQUFjLEdBQUcsY0FBYztvQkFDdkMsQ0FBQyxDQUFDLElBQUksQ0FBQyxjQUFjLEdBQUcsY0FBYyxDQUFBO2FBQzdDO2lCQUFNLElBQUksS0FBSyxDQUFDLFNBQVMsS0FBSyxXQUFXLEVBQUU7Z0JBQ3hDLE9BQU8sQ0FBQyxDQUFBO2FBQ1g7WUFFRCxNQUFNLGNBQWMsR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUE7WUFDeEMsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLGFBQWEsRUFBRSxDQUFBO1lBQ25DLE1BQU0sWUFBWSxHQUFHLFdBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQTtZQUN0QyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQTtZQUMxQixJQUFJLENBQUMscUJBQXFCLElBQUksWUFBWSxHQUFHLGNBQWMsQ0FBQTtZQUUzRCxJQUFJLEtBQUssQ0FBQyxXQUFXLEtBQUssT0FBTyxFQUFFO2dCQUMvQixJQUFJLGNBQWMsR0FBRyxDQUFDLFFBQVEsQ0FBQTtnQkFDOUIsS0FBSyxJQUFJLElBQUksSUFBSSxLQUFLLEVBQUU7b0JBQ3BCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxjQUFjLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQTtvQkFDL0UsY0FBYyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsY0FBYyxFQUFFLFVBQVUsQ0FBQyxDQUFBO29CQUNyRCxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUE7b0JBQ25DLElBQUksSUFBSSxJQUFJLEtBQUs7d0JBQUUsTUFBSztpQkFDM0I7Z0JBQ0QsT0FBTyxjQUFjLENBQUE7YUFDeEI7aUJBQU07Z0JBQ0gsSUFBSSxjQUFjLEdBQUcsUUFBUSxDQUFBO2dCQUM3QixLQUFLLElBQUksSUFBSSxJQUFJLEtBQUssRUFBRTtvQkFDcEIsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLGNBQWMsR0FBRyxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFBO29CQUMvRSxjQUFjLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsVUFBVSxDQUFDLENBQUE7b0JBQ3JELElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQTtvQkFDakMsSUFBSSxJQUFJLElBQUksS0FBSzt3QkFBRSxNQUFLO2lCQUMzQjtnQkFDRCxPQUFPLGNBQWMsQ0FBQTthQUN4QjtRQUNMLENBQUM7S0FDSjtJQW5HRCw4QkFtR0M7Ozs7OztJQ2pHRCxNQUFhLEtBQUs7UUFTZCxZQUFZLFdBQXFCLEtBQUs7WUFSOUIsU0FBSSxHQUFTLElBQUksV0FBSSxFQUFFLENBQUE7WUFFdkIscUJBQWdCLEdBQWtCLElBQUksQ0FBQTtZQUN0Qyx5QkFBb0IsR0FBYyxJQUFJLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7WUFNL0QsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUE7WUFDeEIscUVBQXFFO1lBQ3JFLElBQUksUUFBUSxLQUFLLEtBQUssRUFBRTtnQkFDcEIsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFBO2FBQ3hCO2lCQUFNO2dCQUNILElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQTthQUN4QjtZQUVELElBQUksQ0FBQyx1QkFBdUIsRUFBRSxDQUFBO1lBRTlCLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQTtRQUNsQixDQUFDO1FBRUQsSUFBWSxZQUFZO1lBQ3BCLE9BQU8sSUFBSSxDQUFDLFFBQVEsS0FBSyxLQUFLLENBQUE7UUFDbEMsQ0FBQztRQUVELElBQVksWUFBWTtZQUNwQixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFBO1FBQ2pDLENBQUM7UUFFTyxJQUFJO1lBQ1IsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFBO1lBQ3BCLElBQUEsZ0JBQVMsRUFDTCxJQUFJLENBQUMsSUFBSSxFQUNULElBQUksQ0FBQyxnQkFBZ0IsRUFDckIsSUFBSSxDQUFDLG9CQUFvQixFQUN6QixJQUFJLENBQUMsaUJBQWlCLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUNuRixDQUFBO1lBQ0QsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUE7WUFDdkIsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUE7WUFDdkIsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUE7UUFDM0IsQ0FBQztRQUVPLE9BQU87WUFDWCxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQTtZQUMxQixJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFBO1lBQ3JDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFBO1lBQ3hCLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQTtRQUNmLENBQUM7UUFFRCxjQUFjO1lBQ1YsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUE7UUFDOUIsQ0FBQztRQUVELGFBQWEsQ0FBQyxDQUFTLEVBQUUsQ0FBUyxFQUFFLFNBQTJCO1lBQzNELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLGlCQUFVLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsaUJBQVUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxpQkFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBRXJHLElBQUksU0FBUyxLQUFLLE1BQU0sRUFBRTtnQkFDdEIsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtnQkFFckMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUE7Z0JBQ2pELGlEQUFpRDtnQkFDakQsSUFBSSxRQUFRLEtBQUssSUFBSSxDQUFDLGdCQUFnQixFQUFFO29CQUNwQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxDQUFBO2lCQUMvQjtnQkFDRCwwQkFBMEI7cUJBQ3JCLElBQUksSUFBSSxDQUFDLGdCQUFnQixLQUFLLElBQUksSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFO29CQUMvRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBRSxDQUFBO29CQUNwQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQTtvQkFFdkIsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFBO2lCQUNqQjtnQkFDRCxxQ0FBcUM7cUJBQ2hDLElBQUksS0FBSyxLQUFLLElBQUksRUFBRTtvQkFDckIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQTtpQkFDL0I7Z0JBQ0QsaUVBQWlFO3FCQUM1RCxJQUFJLEtBQUssQ0FBQyxLQUFLLEtBQUssSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUU7b0JBQ3BELElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxRQUFRLENBQUE7aUJBQ25DO2FBQ0o7aUJBQU07Z0JBQ0gsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQTtnQkFDNUIsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFBO2FBQzdFO1lBRUQsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFBO1FBQ2YsQ0FBQztRQUVELG1CQUFtQjtZQUNmLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUE7WUFDNUIsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFBO1FBQ2YsQ0FBQztRQUVELHNFQUFzRTtRQUM5RCxPQUFPLENBQUMsV0FBbUI7WUFDL0IsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLEtBQUssSUFBSTtnQkFBRSxPQUFNO1lBQzFDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFBO1lBQzlELE1BQU0sYUFBYSxHQUFHLEtBQU0sQ0FBQyxhQUFhLENBQ3RDLElBQUksQ0FBQyxnQkFBZ0IsRUFDckIsSUFBSSxDQUFDLFlBQVksRUFDakIsSUFBSSxDQUFDLFlBQVksQ0FBQyx5QkFBeUIsRUFBRSxDQUNoRCxDQUFBO1lBQ0QsT0FBTyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxLQUFLLFdBQVcsQ0FBQyxDQUFBO1FBQ3pFLENBQUM7UUFFTyxnQkFBZ0I7WUFDcEIsTUFBTSxrQkFBa0IsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLGVBQWUsQ0FBRSxDQUFBO1lBQ3BFLE1BQU0sa0JBQWtCLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxlQUFlLENBQUUsQ0FBQTtZQUNwRSxNQUFNLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsYUFBYSxDQUFFLENBQUE7WUFFaEUsa0JBQWtCLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxnQkFBZ0IsQ0FBQyxDQUFBO1lBQzFELGtCQUFrQixDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQTtZQUMxRCxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLGdCQUFnQixDQUFDLENBQUE7WUFFeEQsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxTQUFTLENBQUE7WUFDN0MsUUFBUSxTQUFTLEVBQUU7Z0JBQ2YsS0FBSyxXQUFXO29CQUNaLE1BQU0sV0FBVyxHQUFHLElBQUEsbUJBQVcsRUFBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFBO29CQUM5RCxnQkFBZ0IsQ0FBQyxTQUFTLEdBQUcsR0FDekIsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FDN0QscUJBQXFCLENBQUE7b0JBQ3JCLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUE7b0JBQzFDLE1BQUs7Z0JBQ1QsS0FBSyxXQUFXO29CQUNaLGdCQUFnQixDQUFDLFNBQVMsR0FBRyxZQUFZLENBQUE7b0JBQ3pDLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUE7b0JBQzFDLE1BQUs7Z0JBQ1QsS0FBSyxJQUFJO29CQUNMLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxLQUFLLE9BQU8sQ0FBQTtvQkFDekQsSUFBSSxPQUFPO3dCQUFFLGtCQUFrQixDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUE7O3dCQUNwRCxrQkFBa0IsQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFBO2FBQ3hEO1FBQ0wsQ0FBQztRQUVPLGlCQUFpQjtZQUNyQixJQUFJLENBQUMsWUFBWSxFQUFFLENBQUE7WUFDbkIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLEVBQUUsQ0FBQyxDQUFBO1FBQ3JELENBQUM7UUFFTyx1QkFBdUI7WUFDM0Isc0VBQXNFO1lBQ3RFLFFBQVEsSUFBSSxDQUFDLFFBQVEsRUFBRTtnQkFDbkIsS0FBSyxLQUFLO29CQUNOLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFBO29CQUN0QyxNQUFLO2dCQUNULEtBQUssS0FBSztvQkFDTixJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxLQUFLLE9BQU87d0JBQUUsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFBO29CQUNsRSxNQUFLO2dCQUNULEtBQUssS0FBSztvQkFDTixJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQTtvQkFDdEMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFBO29CQUNuQixNQUFLO2FBQ1o7WUFFRCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUE7UUFDZixDQUFDO1FBRU8sZ0JBQWdCO1lBQ3BCLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFFLENBQUE7WUFDdEQsUUFBUSxJQUFJLENBQUMsUUFBUSxFQUFFO2dCQUNuQixLQUFLLFNBQVM7b0JBQ1YsT0FBTyxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUE7b0JBQzNCLE1BQUs7Z0JBQ1QsS0FBSyxJQUFJO29CQUNMLE9BQU8sQ0FBQyxTQUFTLEdBQUcsZUFBZSxDQUFBO29CQUNuQyxNQUFLO2dCQUNUO29CQUNJLE9BQU8sQ0FBQyxTQUFTLEdBQUcsZUFBZSxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxDQUFBO2FBQ3BFO1FBQ0wsQ0FBQztRQUVPLGNBQWM7WUFDbEIsTUFBTSxPQUFPLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUMsQ0FBQTtZQUNyRCxJQUFJLE9BQU87Z0JBQUUsT0FBTyxFQUFFLFlBQVksQ0FBQyxPQUFPLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQTtRQUNqRSxDQUFDO1FBRU8sY0FBYztZQUNsQixNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQyxDQUFBO1lBQ3JELElBQUksT0FBTztnQkFBRSxPQUFPLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxnQkFBZ0IsQ0FBQyxDQUFBO1FBQ2hFLENBQUM7UUFFTyxZQUFZO1lBQ2hCLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtnQkFDZixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFBO2dCQUNyQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUE7YUFDakI7UUFDTCxDQUFDO1FBRUQsWUFBWTtZQUNSLElBQUksSUFBSSxDQUFDLHVCQUF1QjtnQkFBRSxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsQ0FBQTtRQUN0RixDQUFDO1FBRUQsTUFBTSxDQUFDLEtBQWlCO1lBQ3BCLElBQUksQ0FBQyxRQUFRLEdBQUcsU0FBUyxDQUFBO1lBQ3pCLElBQUksQ0FBQyx1QkFBdUIsR0FBRyxtQkFBbUIsQ0FBQyxDQUFDLFFBQVEsRUFBRSxFQUFFO2dCQUM1RCxNQUFNLEdBQUcsR0FBRyxJQUFJLHFCQUFTLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQTtnQkFDL0MsSUFBSSxDQUFDLFFBQVEsR0FBRyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUE7Z0JBQ3pCLEtBQUssRUFBRSxDQUFBO1lBQ1gsQ0FBQyxDQUFDLENBQUE7UUFDTixDQUFDO1FBRUQsVUFBVSxDQUFDLE1BQWM7WUFDckIsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUE7WUFDNUIsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFBO1FBQ2xCLENBQUM7UUFFRCxJQUFJO1lBQ0EsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQTtZQUNoQixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUE7UUFDbEIsQ0FBQztRQUVELElBQUk7WUFDQSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFBO1lBQ2hCLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQTtRQUNsQixDQUFDO1FBRUQsS0FBSztZQUNELElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxXQUFJLEVBQUUsQ0FBQTtZQUN0QixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUE7UUFDbEIsQ0FBQztRQUVPLGFBQWE7WUFDakIsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU87Z0JBQUUsUUFBUSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUUsQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLENBQUE7O2dCQUM5RSxRQUFRLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBRSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLENBQUE7WUFFbEUsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU87Z0JBQUUsUUFBUSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUUsQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLENBQUE7O2dCQUM5RSxRQUFRLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBRSxDQUFDLFlBQVksQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLENBQUE7UUFDdEUsQ0FBQztRQUVPLGdCQUFnQjtZQUNwQixJQUFJLElBQUksR0FBRyxFQUFFLENBQUE7WUFDYixNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBRSxDQUFBO1lBRS9DLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRTtnQkFDakMsc0NBQXNDO2dCQUN0QyxJQUFJLEtBQUssR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFO29CQUNqQixJQUFJLElBQUksUUFBUSxLQUFLLEdBQUcsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFBO29CQUN0Qyw0RkFBNEY7aUJBQy9GO2dCQUVELElBQUk7b0JBQ0EsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxLQUFLLEtBQUs7d0JBQzFCLENBQUMsQ0FBQyxpQ0FBaUMsSUFBSSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsUUFBUTt3QkFDakYsQ0FBQyxDQUFDLHNEQUNJLEtBQUssR0FBRyxDQUNaLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFBO1lBQ2xFLENBQUMsQ0FBQyxDQUFBO1lBQ0YsS0FBSyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUE7WUFFdEIsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLHNCQUFzQixDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQ3JFLElBQUksV0FBVztnQkFBRSxXQUFXLENBQUMsY0FBYyxDQUFDLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQTtRQUN4RixDQUFDO1FBRU8sdUJBQXVCO1lBQzNCLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxFQUFVLEVBQUUsVUFBbUIsRUFBRSxFQUFFO2dCQUN6RCxRQUFRLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBRSxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQTtZQUNyRixDQUFDLENBQUE7WUFFRCxnQkFBZ0IsQ0FBQyx3QkFBd0IsRUFBRSxJQUFJLENBQUMsUUFBUSxLQUFLLEtBQUssQ0FBQyxDQUFBO1lBQ25FLGdCQUFnQixDQUFDLHFCQUFxQixFQUFFLElBQUksQ0FBQyxRQUFRLEtBQUssS0FBSyxDQUFDLENBQUE7WUFDaEUsZ0JBQWdCLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLFFBQVEsS0FBSyxLQUFLLENBQUMsQ0FBQTtRQUNqRSxDQUFDO0tBQ0o7SUF2UUQsc0JBdVFDOzs7OztJQzNRRCxJQUFJLEtBQUssR0FBRyxJQUFJLGFBQUssRUFBRSxDQUFBO0lBRXZCLGFBQU0sQ0FBQyxXQUFXLEdBQUcsQ0FBQyxLQUFpQixFQUFFLEVBQUU7UUFDdkMsTUFBTSxDQUFDLEdBQUcsS0FBSyxDQUFDLE9BQU8sR0FBRyxhQUFNLENBQUMscUJBQXFCLEVBQUUsQ0FBQyxDQUFDLEdBQUcsYUFBTSxDQUFDLFVBQVUsQ0FBQTtRQUM5RSxNQUFNLENBQUMsR0FBRyxLQUFLLENBQUMsT0FBTyxHQUFHLGFBQU0sQ0FBQyxxQkFBcUIsRUFBRSxDQUFDLENBQUMsR0FBRyxhQUFNLENBQUMsU0FBUyxDQUFBO1FBQzdFLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxpQkFBVSxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsaUJBQVUsR0FBRyxDQUFDLEVBQUU7WUFDOUQsS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1NBQ25FO0lBQ0wsQ0FBQyxDQUFBO0lBRUQsTUFBTSxDQUFDLFdBQVcsR0FBRyxDQUFDLEtBQWlCLEVBQUUsRUFBRTtRQUN2QyxJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssYUFBTSxFQUFFO1lBQ3pCLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQTtTQUN6QjtJQUNMLENBQUMsQ0FBQTtJQUVELE1BQU0sV0FBVyxHQUFHLENBQUMsa0JBQWtCLEVBQUUsZUFBZSxFQUFFLFlBQVksQ0FBQyxDQUFBO0lBQ3ZFLE1BQU0sWUFBWSxHQUFnQztRQUM5QyxnQkFBZ0IsRUFBRSxLQUFLO1FBQ3ZCLGFBQWEsRUFBRSxLQUFLO1FBQ3BCLFVBQVUsRUFBRSxLQUFLO0tBQ3BCLENBQUE7SUFFRCxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUU7UUFDdkIsUUFBUSxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUUsQ0FBQyxPQUFPLEdBQUcsR0FBRyxFQUFFO1lBQ3hDLEtBQUssQ0FBQyxZQUFZLEVBQUUsQ0FBQTtZQUNwQixLQUFLLEdBQUcsSUFBSSxhQUFLLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFDdkMsQ0FBQyxDQUFBO0lBQ0wsQ0FBQyxDQUFDLENBQUE7SUFFRixRQUFRLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBRSxDQUFDLE9BQU8sR0FBRyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUE7SUFDN0QsUUFBUSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUUsQ0FBQyxPQUFPLEdBQUcsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFBO0lBQzdELFFBQVEsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFFLENBQUMsT0FBTyxHQUFHLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQTtJQUUvRCxhQUFNLENBQUMsZ0JBQWdCLENBQUMsYUFBYSxFQUFFLENBQUMsS0FBaUIsRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUE7SUFFckYsUUFBUSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxDQUFDLEtBQW9CLEVBQUUsRUFBRTtRQUMxRCxJQUFJLEtBQUssQ0FBQyxHQUFHLEtBQUssV0FBVztZQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQTtRQUMzQyxJQUFJLEtBQUssQ0FBQyxHQUFHLEtBQUssWUFBWTtZQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQTtJQUNoRCxDQUFDLENBQUMsQ0FBQTtJQUVGLFlBQVk7SUFDWixNQUFNLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQTs7Ozs7SUMxQ3BCLFFBQVEsQ0FBQyxXQUFXLEVBQUUsR0FBRyxFQUFFO1FBQ3ZCLEVBQUUsQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFO1lBQ3JCLE1BQU0sS0FBSyxHQUFHLElBQUksYUFBSyxDQUFDLHdDQUF3QyxDQUFDLENBQUE7WUFDakUsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQ2hELENBQUMsQ0FBQyxDQUFBO1FBRUYsRUFBRSxDQUFDLHFCQUFxQixFQUFFLEdBQUcsRUFBRTtZQUMzQixNQUFNLEtBQUssR0FBRyxJQUFJLGFBQUssQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFBO1lBQzdELE1BQU0sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsS0FBSyxLQUFLLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUN0RSxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUMxQyxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLGFBQWEsQ0FBWTtnQkFDN0MsS0FBSyxFQUFFO29CQUNILFFBQVEsRUFBRSxLQUFLO29CQUNmLFNBQVMsRUFBRSxLQUFLO2lCQUNuQjtnQkFDRCxLQUFLLEVBQUU7b0JBQ0gsUUFBUSxFQUFFLEtBQUs7b0JBQ2YsU0FBUyxFQUFFLEtBQUs7aUJBQ25CO2FBQ0osQ0FBQyxDQUFBO1lBQ0YsTUFBTSxDQUFDLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUNsRCxDQUFDLENBQUMsQ0FBQTtJQUNOLENBQUMsQ0FBQyxDQUFBO0lBRUYsUUFBUSxDQUFDLFdBQVcsRUFBRSxHQUFHLEVBQUU7UUFDdkIsTUFBTSxTQUFTLEdBQUcsQ0FBQyxHQUFXLEVBQVcsRUFBRTtZQUN2QyxNQUFNLEtBQUssR0FBRyxJQUFJLGFBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUM1QixPQUFPLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQTtRQUM1QixDQUFDLENBQUE7UUFFRCxFQUFFLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsd0NBQXdDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFBO1FBRWpHLEVBQUUsQ0FBQywyQkFBMkIsRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLCtCQUErQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQTtJQUN6RyxDQUFDLENBQUMsQ0FBQTtJQUVGLFFBQVEsQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFO1FBQzNCLE1BQU0sYUFBYSxHQUFHLENBQUMsR0FBVyxFQUFVLEVBQUU7WUFDMUMsTUFBTSxLQUFLLEdBQUcsSUFBSSxhQUFLLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDNUIsT0FBTyxLQUFLLENBQUMsYUFBYSxFQUFFLENBQUE7UUFDaEMsQ0FBQyxDQUFBO1FBRUQsTUFBTSxPQUFPLEdBQUcsQ0FBQyxHQUFXLEVBQVUsRUFBRTtZQUNwQyxPQUFPLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUE7UUFDcEMsQ0FBQyxDQUFBO1FBRUQsRUFBRSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLHlDQUF5QyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUVuRixFQUFFLENBQUMsNEJBQTRCLEVBQUUsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFFeEcsRUFBRSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLDREQUE0RCxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQTtRQUV2RyxFQUFFLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsb0VBQW9FLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBRTlHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxpRUFBaUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFFNUcsd0lBQXdJO1FBRXhJLEVBQUUsQ0FBQyw2REFBNkQsRUFBRSxHQUFHLEVBQUU7WUFDbkUsTUFBTSxDQUNGLGFBQWEsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxLQUFLLE9BQU8sQ0FBQyxDQUM1RyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUNoQixDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyx3RUFBd0UsRUFBRSxHQUFHLEVBQUU7WUFDOUUsTUFBTSxDQUNGLGFBQWEsQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxLQUFLLE9BQU8sQ0FBQyxDQUM3RyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTtRQUNoQixDQUFDLENBQUMsQ0FBQTtRQUVGLEVBQUUsQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFFOUUsRUFBRSxDQUFDLCtDQUErQyxFQUFFLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsNkJBQTZCLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBRXBILFFBQVEsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFO1lBQ2xCLEVBQUUsQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQywrQkFBK0IsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFFdEYsRUFBRSxDQUFDLHVGQUF1RixFQUFFLEdBQUcsRUFBRTtnQkFDN0YsTUFBTSxDQUFDLE9BQU8sQ0FBQywrQkFBK0IsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQy9ELENBQUMsQ0FBQyxDQUFBO1lBRUYsRUFBRSxDQUFDLDZDQUE2QyxFQUFFLEdBQUcsRUFBRTtnQkFDbkQsTUFBTSxDQUFDLE9BQU8sQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1lBQ2pFLENBQUMsQ0FBQyxDQUFBO1lBRUYsUUFBUSxDQUFDLFlBQVksRUFBRSxHQUFHLEVBQUU7Z0JBQ3hCLEVBQUUsQ0FBQyxnRUFBZ0UsRUFBRSxHQUFHLEVBQUU7b0JBQ3RFLE1BQU0sQ0FBQyxPQUFPLENBQUMsa0NBQWtDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQTtnQkFDbEUsQ0FBQyxDQUFDLENBQUE7Z0JBRUYsRUFBRSxDQUFDLG1FQUFtRSxFQUFFLEdBQUcsRUFBRTtvQkFDekUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxtQ0FBbUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFBO2dCQUNuRSxDQUFDLENBQUMsQ0FBQTtnQkFFRixFQUFFLENBQUMsbUVBQW1FLEVBQUUsR0FBRyxFQUFFO29CQUN6RSxNQUFNLENBQUMsT0FBTyxDQUFDLGtDQUFrQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUE7Z0JBQ2xFLENBQUMsQ0FBQyxDQUFBO1lBQ04sQ0FBQyxDQUFDLENBQUE7WUFFRixRQUFRLENBQUMsOEJBQThCLEVBQUUsR0FBRyxFQUFFO2dCQUMxQyxFQUFFLENBQUMsMkNBQTJDLEVBQUUsR0FBRyxFQUFFO29CQUNqRCxNQUFNLENBQUMsT0FBTyxDQUFDLDhCQUE4QixDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUE7Z0JBQzlELENBQUMsQ0FBQyxDQUFBO2dCQUVGLEVBQUUsQ0FBQyw2Q0FBNkMsRUFBRSxHQUFHLEVBQUU7b0JBQ25ELE1BQU0sQ0FBQyxPQUFPLENBQUMsaUNBQWlDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQTtnQkFDbEUsQ0FBQyxDQUFDLENBQUE7Z0JBRUYsRUFBRSxDQUFDLDJDQUEyQyxFQUFFLEdBQUcsRUFBRTtvQkFDakQsTUFBTSxDQUFDLE9BQU8sQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFBO2dCQUNsRSxDQUFDLENBQUMsQ0FBQTtZQUNOLENBQUMsQ0FBQyxDQUFBO1FBQ04sQ0FBQyxDQUFDLENBQUE7SUFDTixDQUFDLENBQUMsQ0FBQTtJQUVGLFFBQVEsQ0FBQyxXQUFXLEVBQUUsR0FBRyxFQUFFO1FBQ3ZCLE1BQU0sU0FBUyxHQUFHLENBQUMsR0FBVyxFQUFvQixFQUFFO1lBQ2hELE1BQU0sS0FBSyxHQUFHLElBQUksYUFBSyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQzVCLE9BQU8sS0FBSyxDQUFDLFNBQVMsQ0FBQTtRQUMxQixDQUFDLENBQUE7UUFFRCxFQUFFLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUE7UUFDbEcsRUFBRSxDQUFDLGlCQUFpQixFQUFFLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsaUNBQWlDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFBO1FBQ25HLEVBQUUsQ0FBQyxpQ0FBaUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLCtCQUErQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQTtJQUM5RyxDQUFDLENBQUMsQ0FBQTtJQUVGLFFBQVEsQ0FBQyxzQ0FBc0MsRUFBRSxHQUFHLEVBQUU7UUFDbEQsTUFBTSxhQUFhLEdBQUcsQ0FBQyxHQUFXLEVBQVksRUFBRTtZQUM1QyxNQUFNLEtBQUssR0FBRyxJQUFJLGFBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUM1QixPQUFPLEtBQUssQ0FBQyx5QkFBeUIsRUFBRSxDQUFDLGFBQWEsQ0FBQTtRQUMxRCxDQUFDLENBQUE7UUFFRCxFQUFFLENBQUMsd0NBQXdDLEVBQUUsR0FBRyxFQUFFO1lBQzlDLE1BQU0sQ0FBQyxhQUFhLENBQUMsK0JBQStCLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFDeEUsQ0FBQyxDQUFDLENBQUE7SUFDTixDQUFDLENBQUMsQ0FBQTs7Ozs7SUN4SUYsUUFBUSxDQUFDLDRCQUE0QixFQUFFLEdBQUcsRUFBRTtRQUN4QyxNQUFNLFFBQVEsR0FBRyxDQUFDLEdBQVcsRUFBRSxhQUFxQixFQUFFLFdBQW1CLEVBQVUsRUFBRTtZQUNqRixNQUFNLElBQUksR0FBRyxJQUFJLFdBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUMxQixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLGFBQWEsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFO2dCQUN6RCxPQUFPLElBQUksQ0FBQyxhQUFhLEtBQUssYUFBYSxJQUFJLElBQUksQ0FBQyxXQUFXLEtBQUssV0FBVyxDQUFBO1lBQ25GLENBQUMsQ0FBQyxDQUFBO1lBQ0YsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFLLENBQUMsQ0FBQTtZQUNuQixPQUFPLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFBO1FBQ3ZDLENBQUMsQ0FBQTtRQUVELFFBQVEsQ0FBQyxZQUFZLEVBQUUsR0FBRyxFQUFFO1lBQ3hCLEVBQUUsQ0FBQyx1Q0FBdUMsRUFBRSxHQUFHLEVBQUU7Z0JBQzdDLE1BQU0sQ0FBQyxRQUFRLENBQUMsOEJBQThCLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO1lBQ3RFLENBQUMsQ0FBQyxDQUFBO1lBQ0YsRUFBRSxDQUFDLDBDQUEwQyxFQUFFLEdBQUcsRUFBRTtnQkFDaEQsTUFBTSxDQUFDLFFBQVEsQ0FBQyxnQ0FBZ0MsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7WUFDMUUsQ0FBQyxDQUFDLENBQUE7WUFDRixFQUFFLENBQUMsNkNBQTZDLEVBQUUsR0FBRyxFQUFFO2dCQUNuRCxNQUFNLENBQUMsUUFBUSxDQUFDLGdDQUFnQyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtZQUMzRSxDQUFDLENBQUMsQ0FBQTtZQUNGLEVBQUUsQ0FBQyw0Q0FBNEMsRUFBRSxHQUFHLEVBQUU7Z0JBQ2xELE1BQU0sQ0FBQyxRQUFRLENBQUMsOEJBQThCLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1lBQ3pFLENBQUMsQ0FBQyxDQUFBO1FBQ04sQ0FBQyxDQUFDLENBQUE7UUFFRixRQUFRLENBQUMsY0FBYyxFQUFFLEdBQUcsRUFBRTtZQUMxQixFQUFFLENBQUMseUNBQXlDLEVBQUUsR0FBRyxFQUFFO2dCQUMvQyxNQUFNLENBQUMsUUFBUSxDQUFDLDhCQUE4QixFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtZQUN2RSxDQUFDLENBQUMsQ0FBQTtZQUNGLEVBQUUsQ0FBQyw0Q0FBNEMsRUFBRSxHQUFHLEVBQUU7Z0JBQ2xELE1BQU0sQ0FBQyxRQUFRLENBQUMsZ0NBQWdDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1lBQzFFLENBQUMsQ0FBQyxDQUFBO1FBQ04sQ0FBQyxDQUFDLENBQUE7UUFFRixRQUFRLENBQUMsY0FBYyxFQUFFLEdBQUcsRUFBRTtZQUMxQixFQUFFLENBQUMsNENBQTRDLEVBQUUsR0FBRyxFQUFFO2dCQUNsRCxNQUFNLENBQUMsUUFBUSxDQUFDLGdDQUFnQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtZQUN6RSxDQUFDLENBQUMsQ0FBQTtRQUNOLENBQUMsQ0FBQyxDQUFBO1FBRUYsUUFBUSxDQUFDLFlBQVksRUFBRSxHQUFHLEVBQUU7WUFDeEIsRUFBRSxDQUFDLHVDQUF1QyxFQUFFLEdBQUcsRUFBRTtnQkFDN0MsTUFBTSxDQUFDLFFBQVEsQ0FBQyw4QkFBOEIsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUE7WUFDdEUsQ0FBQyxDQUFDLENBQUE7UUFDTixDQUFDLENBQUMsQ0FBQTtRQUVGLFFBQVEsQ0FBQyxhQUFhLEVBQUUsR0FBRyxFQUFFO1lBQ3pCLEVBQUUsQ0FBQyx3Q0FBd0MsRUFBRSxHQUFHLEVBQUU7Z0JBQzlDLE1BQU0sQ0FBQyxRQUFRLENBQUMsOEJBQThCLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFBO1lBQ3RFLENBQUMsQ0FBQyxDQUFBO1FBQ04sQ0FBQyxDQUFDLENBQUE7UUFFRixRQUFRLENBQUMsWUFBWSxFQUFFLEdBQUcsRUFBRTtZQUN4QixFQUFFLENBQUMsdUNBQXVDLEVBQUUsR0FBRyxFQUFFO2dCQUM3QyxNQUFNLENBQUMsUUFBUSxDQUFDLDZCQUE2QixFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQTtZQUNyRSxDQUFDLENBQUMsQ0FBQTtRQUNOLENBQUMsQ0FBQyxDQUFBO1FBRUYsUUFBUSxDQUFDLGlCQUFpQixFQUFFLEdBQUcsRUFBRTtZQUM3QixRQUFRLENBQUMsa0RBQWtELEVBQUUsR0FBRyxFQUFFO2dCQUM5RCxFQUFFLENBQUMsNkNBQTZDLEVBQUUsR0FBRyxFQUFFO29CQUNuRCxNQUFNLENBQUMsUUFBUSxDQUFDLGdDQUFnQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtnQkFDMUUsQ0FBQyxDQUFDLENBQUE7Z0JBRUYsRUFBRSxDQUFDLDZDQUE2QyxFQUFFLEdBQUcsRUFBRTtvQkFDbkQsTUFBTSxDQUFDLFFBQVEsQ0FBQywrQkFBK0IsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7Z0JBQ3pFLENBQUMsQ0FBQyxDQUFBO2dCQUVGLEVBQUUsQ0FBQyx3REFBd0QsRUFBRSxHQUFHLEVBQUU7b0JBQzlELE1BQU0sQ0FBQyxRQUFRLENBQUMsaUNBQWlDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFBO2dCQUM1RSxDQUFDLENBQUMsQ0FBQTtnQkFFRixFQUFFLENBQUMsK0RBQStELEVBQUUsR0FBRyxFQUFFO29CQUNyRSxNQUFNLENBQUMsUUFBUSxDQUFDLGlDQUFpQyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQTtnQkFDNUUsQ0FBQyxDQUFDLENBQUE7WUFDTixDQUFDLENBQUMsQ0FBQTtRQUNOLENBQUMsQ0FBQyxDQUFBO0lBQ04sQ0FBQyxDQUFDLENBQUE7Ozs7O0lDN0VGLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLEVBQUU7UUFDOUIsRUFBRSxDQUFDLHNEQUFzRCxFQUFFLEdBQUcsRUFBRTtZQUM1RCxNQUFNLENBQUMsSUFBQSx3QkFBZ0IsRUFBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ2xELENBQUMsQ0FBQyxDQUFBO1FBQ0YsRUFBRSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBQSx3QkFBZ0IsRUFBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUE7UUFDM0QsRUFBRSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBQSx3QkFBZ0IsRUFBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUE7UUFDNUQsRUFBRSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBQSx3QkFBZ0IsRUFBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUE7UUFDN0QsRUFBRSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBQSx3QkFBZ0IsRUFBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUE7UUFDOUQsRUFBRSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBQSx3QkFBZ0IsRUFBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUE7UUFDOUQsRUFBRSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBQSx3QkFBZ0IsRUFBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUE7SUFDbEUsQ0FBQyxDQUFDLENBQUE7Ozs7OztJQ1BGLE1BQWEsV0FBWSxTQUFRLFNBQUc7UUFDaEMsR0FBRztZQUNDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFLENBQUE7WUFDeEMsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLEtBQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBRW5FLElBQUksUUFBUSxHQUFnQixJQUFJLENBQUE7WUFDaEMsSUFBSSxjQUFjLEdBQUcsQ0FBQyxRQUFRLENBQUE7WUFDOUIsS0FBSyxJQUFJLElBQUksSUFBSSxLQUFLLEVBQUU7Z0JBQ3BCLE1BQU0sU0FBUyxHQUFHLElBQUkscURBQXlCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFBO2dCQUM5RCxNQUFNLFVBQVUsR0FBRyxTQUFTLENBQUMsR0FBRyxFQUFFLEdBQUcsZUFBZSxDQUFBO2dCQUVwRCxJQUFJLFVBQVUsR0FBRyxjQUFjLEVBQUU7b0JBQzdCLFFBQVEsR0FBRyxJQUFJLENBQUE7b0JBQ2YsY0FBYyxHQUFHLFVBQVUsQ0FBQTtpQkFDOUI7YUFDSjtZQUVELE9BQU8sUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLGNBQWMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUE7UUFDM0UsQ0FBQztLQUNKO0lBbkJELGtDQW1CQzs7Ozs7SUNyQkQsUUFBUSxDQUFDLDJCQUEyQixFQUFFLEdBQUcsRUFBRTtRQUN2QyxNQUFNLFFBQVEsR0FBRyxDQUFDLEdBQVcsRUFBVSxFQUFFO1lBQ3JDLE1BQU0sS0FBSyxHQUFHLElBQUksYUFBSyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQzVCLE1BQU0sU0FBUyxHQUFHLElBQUkscURBQXlCLENBQUMsS0FBSyxDQUFDLENBQUE7WUFDdEQsT0FBTyxTQUFTLENBQUMsR0FBRyxFQUFFLENBQUE7UUFDMUIsQ0FBQyxDQUFBO1FBRUQsRUFBRSxDQUFDLHNDQUFzQyxFQUFFLEdBQUcsRUFBRTtZQUM1QyxNQUFNLENBQUMsUUFBUSxDQUFDLDBEQUEwRCxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDL0YsQ0FBQyxDQUFDLENBQUE7UUFFRixRQUFRLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRTtZQUNsQixFQUFFLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRTtnQkFDUixNQUFNLENBQUMsUUFBUSxDQUFDLGdDQUFnQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQTtZQUN4RSxDQUFDLENBQUMsQ0FBQTtRQUNOLENBQUMsQ0FBQyxDQUFBO1FBRUYsUUFBUSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUU7WUFDbkIsRUFBRSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUU7Z0JBQ1IsTUFBTSxDQUFDLFFBQVEsQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQ3hFLENBQUMsQ0FBQyxDQUFBO1lBRUYsRUFBRSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUU7Z0JBQ1IsTUFBTSxDQUFDLFFBQVEsQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDekUsQ0FBQyxDQUFDLENBQUE7UUFDTixDQUFDLENBQUMsQ0FBQTtJQUNOLENBQUMsQ0FBQyxDQUFBOzs7OztJQ3pCRixRQUFRLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO1FBQy9CLFFBQVEsQ0FBQyx3QkFBd0IsRUFBRSxHQUFHLEVBQUU7WUFDcEMsTUFBTSxLQUFLLEdBQUcsSUFBSSxhQUFLLENBQUMsbUNBQW1DLENBQUMsQ0FBQTtZQUM1RCxNQUFNLGNBQWMsR0FBRyxFQUFFLENBQUE7WUFDekIsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQTtZQUU1QyxNQUFNLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQTtZQUVuQyxNQUFNLEtBQUssR0FBZ0IsSUFBQSwrQkFBc0IsR0FBRSxDQUFBO1lBQ25ELE1BQU0sRUFBRSxpQkFBaUIsQ0FBQyxjQUFjLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFBO1lBRXZELEVBQUUsQ0FBQyx1Q0FBdUMsRUFBRSxHQUFHLEVBQUU7Z0JBQzdDLE1BQU0sQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTSxLQUFLLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQTtZQUNyRixDQUFDLENBQUMsQ0FBQTtZQUVGLEVBQUUsQ0FBQyxvQ0FBb0MsRUFBRSxHQUFHLEVBQUU7Z0JBQzFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUMsT0FBTyxDQUFDO29CQUMvQjt3QkFDSSxRQUFRLEVBQUUsRUFBRTt3QkFDWixNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUU7cUJBQy9CO2lCQUNKLENBQUMsQ0FBQTtZQUNOLENBQUMsQ0FBQyxDQUFBO1FBQ04sQ0FBQyxDQUFDLENBQUE7SUFDTixDQUFDLENBQUMsQ0FBQTs7Ozs7SUN4QkYsUUFBUSxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUU7UUFDM0IsRUFBRSxDQUFDLDBDQUEwQyxFQUFFLEdBQUcsRUFBRTtZQUNoRCxNQUFNLEtBQUssR0FBRyxJQUFJLGFBQUssRUFBRSxDQUFBO1lBQ3pCLEtBQUssQ0FBQyxTQUFTLENBQUMsa0NBQWtDLENBQUMsQ0FBQTtZQUVuRCxNQUFNLFlBQVksR0FBRyxFQUFFLENBQUE7WUFDdkIsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUUsQ0FBQTtZQUN6QyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQTtZQUUvRSxpR0FBaUc7WUFDakcsd0VBQXdFO1lBQ3hFLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFlBQVksRUFBRSxLQUFLLEVBQUUsSUFBQSwrQkFBc0IsR0FBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLENBQUE7UUFDdEcsQ0FBQyxDQUFDLENBQUE7SUFDTixDQUFDLENBQUMsQ0FBQTtJQUVGLFFBQVEsQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLEVBQUU7UUFDL0IsUUFBUSxDQUFDLHdCQUF3QixFQUFFLEdBQUcsRUFBRTtZQUNwQyxNQUFNLEtBQUssR0FBRyxJQUFJLGFBQUssQ0FBQyw2QkFBNkIsQ0FBQyxDQUFBO1lBQ3RELE1BQU0sWUFBWSxHQUFHLENBQUMsQ0FBQTtZQUN0QixNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFBO1lBRXhDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1lBRS9CLE1BQU0sS0FBSyxHQUFnQixJQUFBLCtCQUFzQixHQUFFLENBQUE7WUFDbkQsSUFBSSxFQUFFLGlCQUFpQixDQUFDLFlBQVksRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUE7WUFFbkQsRUFBRSxDQUFDLDZCQUE2QixFQUFFLEdBQUcsRUFBRTtnQkFDbkMsTUFBTSxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQ3BGLENBQUMsQ0FBQyxDQUFBO1FBQ04sQ0FBQyxDQUFDLENBQUE7SUFDTixDQUFDLENBQUMsQ0FBQTs7Ozs7SUM5QkYsUUFBUSxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtRQUMvQixRQUFRLENBQUMsd0JBQXdCLEVBQUUsR0FBRyxFQUFFO1lBQ3BDLE1BQU0sS0FBSyxHQUFHLElBQUksYUFBSyxDQUFDLCtCQUErQixDQUFDLENBQUE7WUFDeEQsTUFBTSxjQUFjLEdBQUcsQ0FBQyxDQUFBO1lBQ3hCLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUE7WUFFNUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUE7WUFFbkMsTUFBTSxLQUFLLEdBQWdCLElBQUEsK0JBQXNCLEdBQUUsQ0FBQTtZQUNuRCxNQUFNLEVBQUUsaUJBQWlCLENBQUMsY0FBYyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQTtZQUV2RCxFQUFFLENBQUMsNkJBQTZCLEVBQUUsR0FBRyxFQUFFO2dCQUNuQyxNQUFNLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU0sS0FBSyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFDcEYsQ0FBQyxDQUFDLENBQUE7UUFDTixDQUFDLENBQUMsQ0FBQTtJQUNOLENBQUMsQ0FBQyxDQUFBOzs7OztJQ2ZGLFFBQVEsQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLEVBQUU7UUFDL0IsUUFBUSxDQUFDLHdCQUF3QixFQUFFLEdBQUcsRUFBRTtZQUNwQyxNQUFNLEtBQUssR0FBRyxJQUFJLGFBQUssQ0FBQywrQkFBK0IsQ0FBQyxDQUFBO1lBQ3hELE1BQU0sWUFBWSxHQUFHLEVBQUUsQ0FBQTtZQUN2QixNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFBO1lBRXhDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1lBRS9CLE1BQU0sS0FBSyxHQUFnQixJQUFBLCtCQUFzQixHQUFFLENBQUE7WUFDbkQsSUFBSSxFQUFFLGlCQUFpQixDQUFDLFlBQVksRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUE7WUFFbkQsRUFBRSxDQUFDLDZCQUE2QixFQUFFLEdBQUcsRUFBRTtnQkFDbkMsTUFBTSxDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQ3BGLENBQUMsQ0FBQyxDQUFBO1FBQ04sQ0FBQyxDQUFDLENBQUE7SUFDTixDQUFDLENBQUMsQ0FBQTs7Ozs7SUNmRixRQUFRLENBQUMsbUJBQW1CLEVBQUUsR0FBRyxFQUFFO1FBQy9CLFFBQVEsQ0FBQyx3QkFBd0IsRUFBRSxHQUFHLEVBQUU7WUFDcEMsTUFBTSxLQUFLLEdBQUcsSUFBSSxjQUFLLENBQUMsK0JBQStCLENBQUMsQ0FBQTtZQUN4RCxNQUFNLGFBQWEsR0FBRyxDQUFDLENBQUE7WUFDdkIsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQTtZQUUxQyxNQUFNLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUVqQyxNQUFNLEtBQUssR0FBZ0IsSUFBQSwrQkFBc0IsR0FBRSxDQUFBO1lBQ25ELEtBQUssRUFBRSxpQkFBaUIsQ0FBQyxhQUFhLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFBO1lBRXJELEVBQUUsQ0FBQyxzQ0FBc0MsRUFBRSxHQUFHLEVBQUU7Z0JBQzVDLE1BQU0sQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTSxLQUFLLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQTtZQUNyRixDQUFDLENBQUMsQ0FBQTtZQUVGLEVBQUUsQ0FBQyxtQ0FBbUMsRUFBRSxHQUFHLEVBQUU7Z0JBQ3pDLE1BQU0sQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUMsT0FBTyxDQUFDO29CQUMvQjt3QkFDSSxRQUFRLEVBQUUsRUFBRTt3QkFDWixNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUU7cUJBQy9CO2lCQUNKLENBQUMsQ0FBQTtZQUNOLENBQUMsQ0FBQyxDQUFBO1FBQ04sQ0FBQyxDQUFDLENBQUE7SUFDTixDQUFDLENBQUMsQ0FBQTs7Ozs7SUN4QkYsUUFBUSxDQUFDLG1CQUFtQixFQUFFLEdBQUcsRUFBRTtRQUMvQixRQUFRLENBQUMsd0JBQXdCLEVBQUUsR0FBRyxFQUFFO1lBQ3BDLE1BQU0sS0FBSyxHQUFHLElBQUksY0FBSyxDQUFDLCtCQUErQixDQUFDLENBQUE7WUFDeEQsTUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFBO1lBQ3ZCLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUE7WUFFeEMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUE7WUFFL0IsTUFBTSxLQUFLLEdBQWdCLElBQUEsK0JBQXNCLEdBQUUsQ0FBQTtZQUNuRCxJQUFJLEVBQUUsaUJBQWlCLENBQUMsWUFBWSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQTtZQUVuRCxFQUFFLENBQUMscUNBQXFDLEVBQUUsR0FBRyxFQUFFO2dCQUMzQyxNQUFNLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLE1BQU0sS0FBSyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUE7WUFDckYsQ0FBQyxDQUFDLENBQUE7WUFFRixFQUFFLENBQUMsa0NBQWtDLEVBQUUsR0FBRyxFQUFFO2dCQUN4QyxNQUFNLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDLE9BQU8sQ0FBQztvQkFDL0I7d0JBQ0ksUUFBUSxFQUFFLEVBQUU7d0JBQ1osTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUU7cUJBQ2hDO2lCQUNKLENBQUMsQ0FBQTtZQUNOLENBQUMsQ0FBQyxDQUFBO1FBQ04sQ0FBQyxDQUFDLENBQUE7SUFDTixDQUFDLENBQUMsQ0FBQSJ9