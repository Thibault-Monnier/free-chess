define("models/move", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Move = void 0;
    class Move {
        constructor(piece, startPosition, endBoard, notation) {
            this.piece = piece;
            this.startPosition = startPosition;
            this.endBoard = endBoard;
            this.notation = notation;
        }
    }
    exports.Move = Move;
});
define("models/king", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.King = void 0;
    class King {
        constructor(color) {
            this.color = color;
        }
        possibleMoves(startPosition, board) {
            const OFFSETS = [-9, -8, -7, -1, 1, 7, 8, 9];
            const moves = [];
            for (let offset of OFFSETS) {
                const endPosition = startPosition + offset;
                if (endPosition < 0 || endPosition > 63)
                    continue;
                if (Math.abs(Math.floor(startPosition / 8) - Math.floor(endPosition / 8)) >= 2)
                    continue;
                //@ts-ignore
                moves.push(endPosition);
            }
            return moves;
        }
    }
    exports.King = King;
});
define("models/utils", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
});
define("models/board", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Board = void 0;
    class Board {
        constructor() {
            this.squares = [];
            for (let i = 0; i < 64; i++) {
                this.squares.push(null);
            }
        }
        debug() {
            let debugBoard = [];
            for (let row = 0; row < 8; row++) {
                //@ts-ignore
                debugBoard[row] = [];
                for (let column = 0; column < 8; column++) {
                    //@ts-ignore
                    debugBoard[row].push(this.squares[row * 8 + column]);
                }
            }
            console.log(debugBoard);
        }
    }
    exports.Board = Board;
});
define("draw", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.drawBoard = exports.initCanvas = void 0;
    const canvas = document.getElementById('board');
    const ctx = canvas.getContext('2d');
    const squareSize = 80;
    const lightSquares = '#f0d9b5';
    const darkSquares = '#b58863';
    function initCanvas() {
        canvas.height = squareSize * 8;
        canvas.width = squareSize * 8;
    }
    exports.initCanvas = initCanvas;
    function drawBoard() {
        for (let squareNb = 0; squareNb < 64; squareNb++) {
            const y = canvas.height - squareSize - squareSize * Math.floor(squareNb / 8);
            const x = squareSize * (squareNb % 8);
            ctx.fillStyle =
                getSquareColor(squareNb) === 'dark' ? darkSquares : lightSquares;
            ctx.fillRect(x, y, squareSize, squareSize);
        }
        drawCoordinates();
    }
    exports.drawBoard = drawBoard;
    function getSquareColor(squareNb) {
        return ((squareNb >> 3) + squareNb) % 2 === 0 ? 'dark' : 'light';
    }
    function drawCoordinates() {
        const fontSize = 18;
        ctx.font = `${fontSize}px Arial`;
        for (let i = 0; i < 8; i++) {
            ctx.fillStyle =
                getSquareColor(i) === 'dark' ? lightSquares : darkSquares;
            ctx.fillText(String.fromCharCode(97 + i), squareSize * (i + 1) - fontSize, canvas.height - fontSize * 0.4);
        }
        for (let i = 0; i < 8; i++) {
            ctx.fillStyle =
                getSquareColor(i * 8) === 'dark' ? lightSquares : darkSquares;
            ctx.fillText(String(i + 1), fontSize * 0.4, squareSize * (7 - i) + fontSize * 1.2);
        }
    }
});
define("main", ["require", "exports", "models/board", "draw"], function (require, exports, board_1, draw_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    new board_1.Board().debug();
    (0, draw_1.initCanvas)();
    (0, draw_1.drawBoard)();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tb2RlbHMvbW92ZS50cyIsIi4uL3NyYy9tb2RlbHMva2luZy50cyIsIi4uL3NyYy9tb2RlbHMvdXRpbHMudHMiLCIuLi9zcmMvbW9kZWxzL2JvYXJkLnRzIiwiLi4vc3JjL2RyYXcudHMiLCIuLi9zcmMvbWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0lBR0EsTUFBYSxJQUFJO1FBQ2IsWUFDVyxLQUFZLEVBQ1osYUFBcUIsRUFDckIsUUFBZSxFQUNmLFFBQWdCO1lBSGhCLFVBQUssR0FBTCxLQUFLLENBQU87WUFDWixrQkFBYSxHQUFiLGFBQWEsQ0FBUTtZQUNyQixhQUFRLEdBQVIsUUFBUSxDQUFPO1lBQ2YsYUFBUSxHQUFSLFFBQVEsQ0FBUTtRQUN4QixDQUFDO0tBQ1A7SUFQRCxvQkFPQzs7Ozs7O0lDTkQsTUFBYSxJQUFJO1FBQ2IsWUFBbUIsS0FBaUI7WUFBakIsVUFBSyxHQUFMLEtBQUssQ0FBWTtRQUFHLENBQUM7UUFFeEMsYUFBYSxDQUFDLGFBQXFCLEVBQUUsS0FBWTtZQUM3QyxNQUFNLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO1lBQzVDLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQTtZQUNoQixLQUFLLElBQUksTUFBTSxJQUFJLE9BQU8sRUFBRTtnQkFDeEIsTUFBTSxXQUFXLEdBQUcsYUFBYSxHQUFHLE1BQU0sQ0FBQTtnQkFFMUMsSUFBSSxXQUFXLEdBQUcsQ0FBQyxJQUFJLFdBQVcsR0FBRyxFQUFFO29CQUFFLFNBQVE7Z0JBQ2pELElBQ0ksSUFBSSxDQUFDLEdBQUcsQ0FDSixJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMs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