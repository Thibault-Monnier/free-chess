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
define("models/types", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("drawUtils", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.drawArrow = exports.cburnettPiecesImages = exports.freeChessPiecesImages = exports.imagesLoading = void 0;
    exports.imagesLoading = 0;
    // Free-chess unique pieces, no license
    exports.freeChessPiecesImages = {
        white: {
            pawn: stringToImage('src/assets/free-chess/white_pawn.svg'),
            rook: stringToImage('src/assets/free-chess/white_rook.svg'),
            knight: stringToImage('src/assets/free-chess/white_knight.svg'),
            bishop: stringToImage('src/assets/free-chess/white_bishop.svg'),
            queen: stringToImage('src/assets/free-chess/white_queen.svg'),
            king: stringToImage('src/assets/free-chess/white_king.svg'),
        },
        black: {
            pawn: stringToImage('src/assets/free-chess/black_pawn.svg'),
            rook: stringToImage('src/assets/free-chess/black_rook.svg'),
            knight: stringToImage('src/assets/free-chess/black_knight.svg'),
            bishop: stringToImage('src/assets/free-chess/black_bishop.svg'),
            queen: stringToImage('src/assets/free-chess/black_queen.svg'),
            king: stringToImage('src/assets/free-chess/black_king.svg'),
        },
    };
    // Lichess pieces https://github.com/lichess-org/lila/tree/master/public/piece/cburnett, license: https://creativecommons.org/licenses/by/3.0/
    exports.cburnettPiecesImages = {
        white: {
            pawn: stringToImage('src/assets/cburnett/wP.svg'),
            rook: stringToImage('src/assets/cburnett/wR.svg'),
            knight: stringToImage('src/assets/cburnett/wN.svg'),
            bishop: stringToImage('src/assets/cburnett/wB.svg'),
            queen: stringToImage('src/assets/cburnett/wQ.svg'),
            king: stringToImage('src/assets/cburnett/wK.svg'),
        },
        black: {
            pawn: stringToImage('src/assets/cburnett/bP.svg'),
            rook: stringToImage('src/assets/cburnett/bR.svg'),
            knight: stringToImage('src/assets/cburnett/bN.svg'),
            bishop: stringToImage('src/assets/cburnett/bB.svg'),
            queen: stringToImage('src/assets/cburnett/bQ.svg'),
            king: stringToImage('src/assets/cburnett/bK.svg'),
        },
    };
    function stringToImage(data) {
        const image = new Image();
        exports.imagesLoading++;
        image.onload = () => exports.imagesLoading--;
        image.src = data;
        return image;
    }
    function drawArrow({ fromX, fromY }, { toX, toY }, width, color, ctx) {
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
    exports.drawArrow = drawArrow;
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
define("canvas", ["require", "exports", "drawUtils", "models/utils", "utils"], function (require, exports, drawUtils_1, utils_4, utils_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Canvas = void 0;
    class Canvas {
        constructor() {
            this.canvasDOM = document.getElementById('board');
            this.ctx = this.canvasDOM.getContext('2d');
            this.squareSize = 0;
        }
        draw(board, selectedSquareNb, highlightedSquareNbs, lastMove, bestMove) {
            this.recalculateSquareSize();
            this.canvasDOM.width = document.getElementById('board').clientWidth * window.devicePixelRatio;
            this.canvasDOM.height = document.getElementById('board').clientHeight * window.devicePixelRatio;
            for (let squareNb = 0; squareNb < 64; squareNb++) {
                const { x, y } = this.squareNbToXY(squareNb);
                const squareColor = this.getSquareColor(squareNb) === 'dark' ? darkSquares : lightSquares;
                this.fillRect(x, y, this.squareSize, this.squareSize, squareColor);
                if (selectedSquareNb === squareNb) {
                    this.fillRect(x, y, this.squareSize, this.squareSize, 'rgba(255, 255, 0, 0.5)');
                }
                if (lastMove?.startSquareNb === squareNb || lastMove?.endSquareNb === squareNb) {
                    this.fillRect(x, y, this.squareSize, this.squareSize, 'rgba(150, 150, 50, 0.75)');
                }
                if (bestMove?.startSquareNb === squareNb || bestMove?.endSquareNb === squareNb) {
                    this.fillRect(x, y, this.squareSize, this.squareSize, 'rgba(100, 255, 100, 0.5)');
                }
                if (highlightedSquareNbs[squareNb]) {
                    this.fillRect(x, y, this.squareSize, this.squareSize, 'rgba(255, 80, 70,0.75)');
                }
            }
            this.drawCoordinates();
            if (bestMove)
                this.createBestMoveArrow(bestMove);
            this.drawPieces(board);
            if (selectedSquareNb !== null)
                this.drawPossibleMoves(board, selectedSquareNb);
        }
        fillRect(x, y, width, height, color) {
            this.ctx.fillStyle = color;
            this.ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(width), Math.ceil(height));
        }
        setup() {
            this.canvasDOM.addEventListener('contextmenu', (event) => event.preventDefault());
        }
        drawPossibleMoves(board, selectedSquareNb) {
            const piece = board.squares[selectedSquareNb];
            const moves = piece.possibleMoves(selectedSquareNb, board, board.createOpponentAttackTable());
            for (let move of moves) {
                const { x, y } = this.squareNbToXY(move.endSquareNb);
                const isOccupied = board.squares[move.endSquareNb] !== null;
                this.ctx.beginPath();
                this.ctx.arc(x + this.squareSize / 2, y + this.squareSize / 2, isOccupied ? this.squareSize / 2 : this.squareSize / 8, 0, Math.PI * 2);
                this.ctx.fillStyle = isOccupied ? 'rgba(30, 0, 100, 0.25)' : 'rgba(0, 0, 0, 0.2)';
                this.ctx.fill();
            }
        }
        squareNbToXY(squareNb) {
            return {
                x: this.squareSize * (squareNb % 8),
                y: this.canvasDOM.height - this.squareSize - this.squareSize * Math.floor(squareNb / 8),
            };
        }
        getSquareColor(squareNb) {
            return ((squareNb >> 3) + squareNb) % 2 === 0 ? 'dark' : 'light';
        }
        squareNbFromMouseEvent(event) {
            const cssSquareSize = this.squareSize / window.devicePixelRatio;
            const cssX = event.clientX - this.canvasDOM.getBoundingClientRect().x - this.canvasDOM.clientLeft;
            const cssY = event.clientY - this.canvasDOM.getBoundingClientRect().y - this.canvasDOM.clientTop;
            if (cssX < 0 ||
                cssY < 0 ||
                cssX * devicePixelRatio >= this.canvasDOM.width /* canvasDOM.width is in js width, but cssX isn't */ ||
                cssY * devicePixelRatio >= this.canvasDOM.height /* canvasDOM.height is in js width, but cssY isn't */)
                return null;
            return Math.floor(cssX / cssSquareSize) + Math.floor((cssSquareSize * 8 - (cssY + 1)) / cssSquareSize) * 8;
        }
        drawCoordinates() {
            const fontSize = this.squareSize / 5;
            this.ctx.font = `${fontSize}px Arial`;
            for (let file = 0; file < 8; file++) {
                this.ctx.fillStyle = this.getSquareColor(file) === 'dark' ? lightSquares : darkSquares;
                this.ctx.fillText(String.fromCharCode(97 + file), this.squareSize * (file + 1) - fontSize, this.canvasDOM.height - fontSize * 0.4);
            }
            for (let rank = 0; rank < 8; rank++) {
                this.ctx.fillStyle = this.getSquareColor(rank * 8) === 'dark' ? lightSquares : darkSquares;
                this.ctx.fillText(String(rank + 1), fontSize * 0.4, this.squareSize * (7 - rank) + fontSize * 1.2);
            }
        }
        createBestMoveArrow(move) {
            const startPosition = (0, utils_4.squareNbToFileRank)(move.startSquareNb);
            const endPosition = (0, utils_4.squareNbToFileRank)(move.endSquareNb);
            const width = this.squareSize / 12;
            const color = 'rgba(50, 150, 50, 1)';
            const startCoordinates = {
                fromX: startPosition.file * this.squareSize + this.squareSize / 2,
                fromY: (7 - startPosition.rank) * this.squareSize + this.squareSize / 2,
            };
            const endCoordinates = {
                toX: endPosition.file * this.squareSize + this.squareSize / 2,
                toY: (7 - endPosition.rank) * this.squareSize + this.squareSize / 2,
            };
            (0, drawUtils_1.drawArrow)(startCoordinates, endCoordinates, width, color, this.ctx);
        }
        async drawPieces(board) {
            while (drawUtils_1.imagesLoading > 0) {
                await (0, utils_5.waitOneMillisecondAsync)();
            }
            for (let squareNb = 0; squareNb < 64; squareNb++) {
                const piece = board.squares[squareNb];
                if (!piece)
                    continue;
                const { x, y } = this.squareNbToXY(squareNb);
                const image = drawUtils_1.freeChessPiecesImages[piece.color][piece.name];
                const offset = (this.squareSize - this.pieceSize) / 2;
                this.ctx.drawImage(image, x + offset, y + offset, this.pieceSize, this.pieceSize);
            }
        }
        get pieceSize() {
            return this.squareSize * 0.97;
        }
        recalculateSquareSize() {
            this.squareSize =
                (Math.min(document.getElementById('board').clientWidth, document.getElementById('board').clientHeight) /
                    8) *
                    window.devicePixelRatio;
        }
    }
    exports.Canvas = Canvas;
    const lightSquares = '#e5d7bf';
    const darkSquares = '#b88465';
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
define("models/evaluators/pieceSquareTableEvaluator", ["require", "exports", "models/utils", "models/evaluators/evaluator"], function (require, exports, utils_6, evaluator_1) {
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
            const { file, rank } = (0, utils_6.squareNbToFileRank)(squareNb);
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
define("models/game", ["require", "exports", "models/board", "models/utils"], function (require, exports, board_3, utils_7) {
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
                    notation += (0, utils_7.squareNbToCoordinates)(move.startSquareNb)[0];
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
                    const files = ambiguousStartSquareNbs.map((squareNb) => (0, utils_7.squareNbToFileRank)(squareNb).file);
                    const ranks = ambiguousStartSquareNbs.map((squareNb) => (0, utils_7.squareNbToFileRank)(squareNb).rank);
                    const { file, rank } = (0, utils_7.squareNbToFileRank)(move.startSquareNb);
                    const coordinates = (0, utils_7.squareNbToCoordinates)(move.startSquareNb);
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
                const endSquareCoordinates = (0, utils_7.squareNbToCoordinates)(move.endSquareNb);
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
define("chess", ["require", "exports", "canvas", "models/bots/depthNBot", "models/game", "models/utils"], function (require, exports, canvas_1, depthNBot_1, game_1, utils_8) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Chess = void 0;
    class Chess {
        constructor(playMode = '1v1') {
            this.game = new game_1.Game();
            this.selectedSquareNb = null;
            this.highlightedSquareNbs = new Array(64).fill(false);
            this.showBestMove = false;
            this.canvas = new canvas_1.Canvas();
            this.playMode = playMode;
        }
        get currentBoard() {
            return this.game.currentBoard;
        }
        setup() {
            this.canvas.setup();
            if (this.playMode === '1v1')
                this.showBestMove = true;
            if (this.playMode === '1vC')
                this.hideEvaluation();
            else
                this.showEvaluation();
            this.setActivePlayModeButton();
            this.newMove();
        }
        draw() {
            this.toggleActions();
            this.updateMovesPanel();
            this.toggleNextPlayer();
            this.updateEvaluation();
            this.drawCanvas();
        }
        drawCanvas() {
            this.canvas.draw(this.currentBoard, this.selectedSquareNb, this.highlightedSquareNbs, this.game.lastMove, this.bestMove && this.showBestMove ? this.bestMove.move : null);
        }
        newMove() {
            this.resetSelectedSquare();
            this.highlightedSquareNbs.fill(false);
            this.calculateBestMove();
            this.draw();
        }
        clicked(event) {
            if (event.target === document.getElementById('undo'))
                this.undo();
            if (event.target === document.getElementById('redo'))
                this.redo();
            if (event.target === document.getElementById('reset'))
                this.reset();
            const squareNb = this.canvas.squareNbFromMouseEvent(event);
            if (event.type === 'mousedown') {
                if (squareNb !== null) {
                    this.clickedSquare(squareNb, event.button === 0 ? 'left' : 'right');
                }
                else {
                    this.clickedOutside();
                }
            }
        }
        keydown(event) {
            if (event.key === 'ArrowLeft')
                this.undo();
            if (event.key === 'ArrowRight')
                this.redo();
        }
        windowResize() {
            this.drawCanvas();
        }
        clickedOutside() {
            this.resetSelectedSquare();
        }
        clickedSquare(squareNb, clickType) {
            if (clickType === 'left') {
                const piece = this.currentBoard.squares[squareNb];
                this.highlightedSquareNbs.fill(false);
                if (squareNb === this.selectedSquareNb) {
                    // Deselects the square if it was already selected
                    this.selectedSquareNb = null;
                }
                else if (this.selectedSquareNb !== null && this.getMove(squareNb)) {
                    // Makes a move if possible
                    const move = this.getMove(squareNb);
                    this.game.addMove(move);
                    this.newMove();
                }
                else if (piece === null) {
                    // Deselects the square if it is empty
                    this.selectedSquareNb = null;
                }
                else if (piece.color === this.currentBoard.colorToMove) {
                    // Selects the square if it contains a piece of the current player
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
            const endOfGameText = document.getElementById('end_of_game_text');
            whiteToMoveElement.setAttribute('style', 'display: none;');
            blackToMoveElement.setAttribute('style', 'display: none;');
            endOfGameElement.setAttribute('style', 'display: none;');
            const endOfGame = this.currentBoard.endOfGame;
            switch (endOfGame) {
                case 'checkmate':
                    const colorWinner = (0, utils_8.invertColor)(this.currentBoard.colorToMove);
                    endOfGameText.innerText = `${colorWinner.charAt(0).toUpperCase() + colorWinner.slice(1)} wins by checkmate!`;
                    endOfGameElement.setAttribute('style', '');
                    break;
                case 'stalemate':
                    endOfGameText.innerText = 'Stalemate!';
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
            this.stopBot();
            this.runBot(() => this.playBestMove());
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
            if (this.playMode === 'CvC' || (this.playMode === '1vC' && this.currentBoard.colorToMove === 'black')) {
                if (this.bestMove) {
                    this.game.addMove(this.bestMove.move);
                    this.newMove();
                }
            }
            this.draw();
        }
        stopBot() {
            if (this.calculateBestMoveHandle !== undefined)
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
                        : `<div class="move" onMouseDown="window.chess.jumpToMove(${index + 1})">${this.game.calculateMoveNotation(index)}</div>`;
            });
            moves.innerHTML = html;
            const currentMove = document.getElementsByClassName('currentMove')[0];
            if (currentMove) {
                if (window.matchMedia('(min-width: 50rem)').matches) {
                    currentMove.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                else {
                    moves.scrollTop = moves.scrollHeight;
                }
            }
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
define("main", ["require", "exports", "chess"], function (require, exports, chess_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    let chess = new chess_1.Chess();
    if (document.readyState === 'complete') {
        chess.setup();
    }
    else {
        document.onreadystatechange = () => document.readyState === 'complete' && chess.setup();
    }
    const playmodeIDs = ['player_vs_player', 'player_vs_bot', 'bot_vs_bot'];
    const idToPlayMode = {
        player_vs_player: '1v1',
        player_vs_bot: '1vC',
        bot_vs_bot: 'CvC',
    };
    playmodeIDs.forEach((id) => {
        document.getElementById(id).addEventListener('click', () => {
            chess.stopBot();
            chess = new chess_1.Chess(idToPlayMode[id]);
            chess.setup();
        });
    });
    document.addEventListener('click', (event) => {
        chess.clicked(event);
    });
    document.addEventListener('mousedown', (event) => {
        chess.clicked(event);
    });
    document.addEventListener('keydown', (event) => {
        chess.keydown(event);
    });
    window.addEventListener('resize', () => chess.windowResize());
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tb2RlbHMvdXRpbHMudHMiLCIuLi9zcmMvbW9kZWxzL3BpZWNlcy9waWVjZS50cyIsIi4uL3NyYy9tb2RlbHMvcGllY2VzL2Jpc2hvcC50cyIsIi4uL3NyYy9tb2RlbHMvcGllY2VzL2tpbmcudHMiLCIuLi9zcmMvbW9kZWxzL3BpZWNlcy9rbmlnaHQudHMiLCIuLi9zcmMvbW9kZWxzL3BpZWNlcy9xdWVlbi50cyIsIi4uL3NyYy9tb2RlbHMvcGllY2VzL3Bhd24udHMiLCIuLi9zcmMvbW9kZWxzL3BpZWNlcy9yb29rLnRzIiwiLi4vc3JjL21vZGVscy9ib2FyZC50cyIsIi4uL3NyYy9tb2RlbHMvbW92ZS50cyIsIi4uL3NyYy9tb2RlbHMvdHlwZXMudHMiLCIuLi9zcmMvZHJhd1V0aWxzLnRzIiwiLi4vc3JjL3V0aWxzLnRzIiwiLi4vc3JjL2NhbnZhcy50cyIsIi4uL3NyYy9tb2RlbHMvZXZhbHVhdG9ycy9ldmFsdWF0b3IudHMiLCIuLi9zcmMvbW9kZWxzL2V2YWx1YXRvcnMvcGllY2VTcXVhcmVUYWJsZUV2YWx1YXRvci50cyIsIi4uL3NyYy9tb2RlbHMvYm90cy9ib3QudHMiLCIuLi9zcmMvbW9kZWxzL2JvdHMvZGVwdGhOQm90LnRzIiwiLi4vc3JjL21vZGVscy9nYW1lLnRzIiwiLi4vc3JjL2NoZXNzLnRzIiwiLi4vc3JjL21haW4udHMiLCIuLi9zcmMvbW9kZWxzL2JvYXJkLnRlc3QudHMiLCIuLi9zcmMvbW9kZWxzL2dhbWUudGVzdC50cyIsIi4uL3NyYy9tb2RlbHMvdXRpbHMudGVzdC50cyIsIi4uL3NyYy9tb2RlbHMvYm90cy9kZXB0aE9uZUJvdC50cyIsIi4uL3NyYy9tb2RlbHMvZXZhbHVhdG9ycy9waWVjZVNxdWFyZVRhYmxlRXZhbHVhdG9yLnRlc3QudHMiLCIuLi9zcmMvbW9kZWxzL3BpZWNlcy9iaXNob3AudGVzdC50cyIsIi4uL3NyYy9tb2RlbHMvcGllY2VzL2tpbmcudGVzdC50cyIsIi4uL3NyYy9tb2RlbHMvcGllY2VzL2tuaWdodC50ZXN0LnRzIiwiLi4vc3JjL21vZGVscy9waWVjZXMvcGF3bi50ZXN0LnRzIiwiLi4vc3JjL21vZGVscy9waWVjZXMvcXVlZW4udGVzdC50cyIsIi4uL3NyYy9tb2RlbHMvcGllY2VzL3Jvb2sudGVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0lBRUEsU0FBZ0IsV0FBVyxDQUFDLEtBQWlCO1FBQ3pDLE9BQU8sS0FBSyxLQUFLLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUE7SUFDaEQsQ0FBQztJQUZELGtDQUVDO0lBRUQsU0FBZ0Isa0JBQWtCLENBQUMsUUFBZ0I7UUFDL0MsTUFBTSxJQUFJLEdBQUcsUUFBUSxHQUFHLENBQUMsQ0FBQTtRQUN6QixNQUFNLElBQUksR0FBRyxRQUFRLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLENBQUE7UUFFL0UsT0FBTztZQUNILElBQUk7WUFDSixJQUFJO1NBQ1AsQ0FBQTtJQUNMLENBQUM7SUFSRCxnREFRQztJQUVELFNBQWdCLGtCQUFrQixDQUFDLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBWTtRQUN2RCxPQUFPLElBQUksR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFBO0lBQzFCLENBQUM7SUFGRCxnREFFQztJQUVELFNBQWdCLHFCQUFxQixDQUFDLFFBQWdCO1FBQ2xELE1BQU0sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEdBQUcsa0JBQWtCLENBQUMsUUFBUSxDQUFDLENBQUE7UUFDbkQsTUFBTSxZQUFZLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FB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QUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMxQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMxQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMxQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMxQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMxQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7YUFDM0IsQ0FBQTtZQUNELE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFBRSxLQUFLLENBQUMsQ0FBQTtRQUNyRSxDQUFDO1FBRU8sZUFBZSxDQUFDLFFBQWdCLEVBQUUsS0FBaUI7WUFDdkQsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFBO1lBQ2pCLE1BQU0sWUFBWSxHQUFHO2dCQUNqQixDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO2dCQUN0QyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO2dCQUM1QixDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO2dCQUM1QixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUMxQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDekIsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztnQkFDNUIsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztnQkFDNUIsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQzthQUN6QyxDQUFBO1lBQ0QsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQ3JFLENBQUM7UUFFTyxjQUFjLENBQUMsUUFBZ0IsRUFBRSxLQUFpQjtZQUN0RCxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUE7WUFDbkIsTUFBTSxZQUFZLEdBQUc7Z0JBQ2pCLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ3hDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztnQkFDNUIsQ0FBQyxFQUFFLEVB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