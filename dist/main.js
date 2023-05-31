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
    const BLACK_BISHOP = new Image();
    BLACK_BISHOP.src =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAA6/NlyAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAN1wAADdcBQiibeAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAARpSURBVGiB7Zo/bFtVFMZ/x7EhUdN2cFSkDMSCdEnKgkSH0IAZACkgAgpL2yhCDGz8UZNgRYINhpQgQAgQIwNiARRRJJOJAVhAuEhtBUIijhpRZJyAGpw4jRMfhmcjU/XZ78XnvbhuPunIkt/1ud/ne8699517RVW5lRDZawJhY19wu2NfcLtjTwSLSEJEBkUk9P5D7VBEhkXkZyALXATyIvJcmBxQ1VAMuB8oAXoDS4XFQ8LaeIjIRWDQ5XEJSKjqlaB5hBLSItKLu1iAGPBgGFzCyuHbPbTpDJwFIQlW1Szwe4Nm34XBJcxZ+qU6z95T1V/DIBGm4C+Bj3Fm5Vr8CMyGxiKE5agTOAP8wY2XJAWKwDtAb+B8AhZ7J3C+jtDr7W/g4ZtSMHACyPkQW7Vt4PmbSjDwLHBtF2Jr7UOgo+UFA48A5SbFVu31lhYM9ABXGgmZnZ3VdDqtkUikkeAdYLiVBc97GblsNquqqn19fV5GeQk4bMXRbB0WkceAUY9t//fZAH3AK7smdh2iVo6A024PRISpqSkGB533h56eHgDm5uYoFAqsr68zMzPD2tqam4uTIvKyVsKoKRiFchfwDy5hGY/HdXt7W+thbGysUWifsOBqNcKPAt1uD1dXV0kmk/T39wPOyMbjcaanp1lZWSGfz5NOpxv18TTwbdNMjUb4DD6Wm6WlJVVVTSQSfpaoL1pp0rrNT+OtrS0AyuVyYH24wSqkY34ap1IpBgYGWF5eDqwPVxiF9DPY7Kzq2UetFNLncDb9QWLewomJYFVdBb628OWCIrBg4ciy4nEW56UhCLypqhsmnizyoiaXp7HP3XNAxIyjpeCK6LNAaWhoSHO5nG5ubvqyjY0NnZycrIr9Cjhkyc9yL11FCjja2dn5ZDwep6Ojw9ePVZVoNAqwCJxSVdcN9m5gftQiIi8CbwNEo9Eqec8ol8v/bUyAeVV9ypSgcTjfjTOjWubwaUuO1nXpUeyPTE5aOjPN4fHx8dGRkREiEbv/MZPJPCQiola5ZxjOsYWFhS01RrFY1O7u7geseFqOcGxiYiKWTCa9lm48IZPJUCgUDlj5M52lRSSPU7m0xjFVvWThyHrS+tzYH8AlwO5k0So3KpESAV6gTn3Lh5WBDzDeaQVyx0NEDgKP49ShhnHC3EtirwEXgM+AT1XVV4XAE7fdChZnZuoFjuBUI2rtQOX7OyqfvTiHa0dc3G3gFOiywJ8VywFXcS681NpV4LKqlnbF26tgETkOPAHcC9wFJPB2dyMI7OBcoVgEfgLeVdVFT7/0kJeHgE8IvoTTjJWAV6kMYF09DcR2Ad+0gCCvlgbizQh+vwVE+LXzzey0Cg2e+8VvwA/A9zhL133AceAYdvv6Qr29d8NJS0ROAW/gzLwXgF+AyzWWw1lyokBHxQRnYqnaNpBT1b9c+ujCOSWs9VH9A2p97AAHK22rdhS4BzgMvAW8pqrXXPUEsQ7vBby+UbWNYK/YvxHf7tgX3O645QT/Cym/GLJbVZClAAAAAElFTkSuQmCC';
    function initCanvas() {
        canvas.height = squareSize * 8;
        canvas.width = squareSize * 8;
        canvas.setAttribute('style', '');
    }
    exports.initCanvas = initCanvas;
    function squareNbToXY(squareNb) {
        return {
            x: squareSize * (squareNb % 8),
            y: canvas.height - squareSize - squareSize * Math.floor(squareNb / 8),
        };
    }
    function drawBoard() {
        for (let squareNb = 0; squareNb < 64; squareNb++) {
            const { x, y } = squareNbToXY(squareNb);
            ctx.fillStyle =
                getSquareColor(squareNb) === 'dark' ? darkSquares : lightSquares;
            ctx.fillRect(x, y, squareSize, squareSize);
        }
        drawCoordinates();
        drawPieces();
    }
    exports.drawBoard = drawBoard;
    function getSquareColor(squareNb) {
        return ((squareNb >> 3) + squareNb) % 2 === 0 ? 'dark' : 'light';
    }
    function drawCoordinates() {
        const fontSize = 14;
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
    function drawPieces() {
        ctx.drawImage(BLACK_BISHOP, 50, 50);
    }
});
define("main", ["require", "exports", "draw"], function (require, exports, draw_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    (0, draw_1.initCanvas)();
    (0, draw_1.drawBoard)();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tb2RlbHMvbW92ZS50cyIsIi4uL3NyYy9tb2RlbHMva2luZy50cyIsIi4uL3NyYy9tb2RlbHMvdXRpbHMudHMiLCIuLi9zcmMvbW9kZWxzL2JvYXJkLnRzIiwiLi4vc3JjL2RyYXcudHMiLCIuLi9zcmMvbWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0lBR0EsTUFBYSxJQUFJO1FBQ2IsWUFDVyxLQUFZLEVBQ1osYUFBcUIsRUFDckIsUUFBZSxFQUNmLFFBQWdCO1lBSGhCLFVBQUssR0FBTCxLQUFLLENBQU87WUFDWixrQkFBYSxHQUFiLGFBQWEsQ0FBUTtZQUNyQixhQUFRLEdBQVIsUUFBUSxDQUFPO1lBQ2YsYUFBUSxHQUFSLFFBQVEsQ0FBUTtRQUN4QixDQUFDO0tBQ1A7SUFQRCxvQkFPQzs7Ozs7O0lDTkQsTUFBYSxJQUFJO1FBQ2IsWUFBbUIsS0FBaUI7WUFBakIsVUFBSyxHQUFMLEtBQUssQ0FBWTtRQUFHLENBQUM7UUFFeEMsYUFBYSxDQUFDLGFBQXFCLEVBQUUsS0FBWTtZQUM3QyxNQUFNLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO1lBQzVDLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQTtZQUNoQixLQUFLLElBQUksTUFBTSxJQUFJLE9BQU8sRUFBRTtnQkFDeEIsTUFBTSxXQUFXLEdBQUcsYUFBYSxHQUFHLE1BQU0sQ0FBQTtnQkFFMUMsSUFBSSxXQUFXLEdBQUcsQ0FBQyxJQUFJLFdBQVcsR0FBRyxFQUFFO29CQUFFLFNBQVE7Z0JBQ2pELElBQ0ksSUFBSSxDQUFDLEdBQUcsQ0FDSixJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMs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