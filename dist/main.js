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
define("draw", ["require", "exports", "models/board"], function (require, exports, board_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.drawBoard = void 0;
    const canvas = document.getElementById('board');
    const ctx = canvas.getContext('2d');
    function getSquareColors() {
        const lightSquares = '#f0d9b5';
        const darkSquares = '#b58863';
        const squareColors = [];
        for (let i = 0; i < 64; i++) {
            let square = new board_1.Board().squares[i];
            let squareColor = ((i >> 3) + i) % 2 === 0 ? darkSquares : lightSquares;
            //@ts-ignore
            squareColors.push(squareColor);
        }
        return squareColors;
    }
    function drawBoard() {
        const squareSize = 80;
        canvas.height = squareSize * 8;
        canvas.width = squareSize * 8;
        for (let i = 0; i < 64; i++) {
            let squareColor = getSquareColors()[i];
            let y = canvas.height - squareSize - squareSize * Math.floor(i / 8);
            let x = squareSize * (i % 8);
            ctx.fillStyle = squareColor;
            ctx.fillRect(x, y, squareSize, squareSize);
        }
        drawCoordinates(squareSize);
    }
    exports.drawBoard = drawBoard;
    function drawCoordinates(interval = 80) {
        const fontSize = 18;
        const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const numbers = ['8', '7', '6', '5', '4', '3', '2', '1'];
        ctx.font = `${fontSize}px Arial`;
        for (let i = 0; i < 8; i++) {
            ctx.fillStyle =
                i === 0 ? getSquareColors()[i + 1] : getSquareColors()[i - 1];
            ctx.fillText(letters[i], interval * (i + 1) - fontSize, canvas.height - fontSize * 0.4);
            ctx.fillStyle = i === 0 ? getSquareColors()[i] : getSquareColors()[i];
            ctx.fillText(numbers[i], fontSize * 0.4, interval * i + fontSize * 1.2);
        }
    }
});
define("main", ["require", "exports", "models/board", "draw"], function (require, exports, board_2, draw_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const board = new board_2.Board();
    board.debug();
    (0, draw_1.drawBoard)();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tb2RlbHMvbW92ZS50cyIsIi4uL3NyYy9tb2RlbHMva2luZy50cyIsIi4uL3NyYy9tb2RlbHMvdXRpbHMudHMiLCIuLi9zcmMvbW9kZWxzL2JvYXJkLnRzIiwiLi4vc3JjL2RyYXcudHMiLCIuLi9zcmMvbWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0lBR0EsTUFBYSxJQUFJO1FBQ2IsWUFDVyxLQUFZLEVBQ1osYUFBcUIsRUFDckIsUUFBZSxFQUNmLFFBQWdCO1lBSGhCLFVBQUssR0FBTCxLQUFLLENBQU87WUFDWixrQkFBYSxHQUFiLGFBQWEsQ0FBUTtZQUNyQixhQUFRLEdBQVIsUUFBUSxDQUFPO1lBQ2YsYUFBUSxHQUFSLFFBQVEsQ0FBUTtRQUN4QixDQUFDO0tBQ1A7SUFQRCxvQkFPQzs7Ozs7O0lDTkQsTUFBYSxJQUFJO1FBQ2IsWUFBbUIsS0FBaUI7WUFBakIsVUFBSyxHQUFMLEtBQUssQ0FBWTtRQUFHLENBQUM7UUFFeEMsYUFBYSxDQUFDLGFBQXFCLEVBQUUsS0FBWTtZQUM3QyxNQUFNLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBO1lBQzVDLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQTtZQUNoQixLQUFLLElBQUksTUFBTSxJQUFJLE9BQU8sRUFBRTtnQkFDeEIsTUFBTSxXQUFXLEdBQUcsYUFBYSxHQUFHLE1BQU0sQ0FBQTtnQkFFMUMsSUFBSSxXQUFXLEdBQUcsQ0FBQyxJQUFJLFdBQVcsR0FBRyxFQUFFO29CQUFFLFNBQVE7Z0JBQ2pELElBQ0ksSUFBSSxDQUFDLEdBQUcsQ0FDSixJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUMsQ0FDOUQsSUFBSSxDQUFDO29CQUVOLFNBQVE7Z0JBRVosWUFBWTtnQkFDWixLQUFLLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFBO2FBQzFCO1lBQ0QsT0FBTyxLQUFLLENBQUE7UUFDaEIsQ0FBQztLQUNKO0lBdEJELG9CQXNCQzs7Ozs7Ozs7OztJRXhCRCxNQUFhLEtBQUs7UUFHZDtZQUNJLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFBO1lBQ2pCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQ3pCLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFBO2FBQzFCO1FBQ0wsQ0FBQztRQUVELEtBQUs7WUFDRCxJQUFJLFVBQVUsR0FBRyxFQUFFLENBQUE7WUFFbkIsS0FBSyxJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRTtnQkFDOUIsWUFBWTtnQkFDWixVQUFVLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFBO2dCQUNwQixLQUFLLElBQUksTUFBTSxHQUFHLENBQUMsRUFBRSxNQUFNLEdBQUcsQ0FBQyxFQUFFLE1BQU0sRUFBRSxFQUFFO29CQUN2QyxZQUFZO29CQUNaLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUE7aUJBQ3ZEO2FBQ0o7WUFFRCxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFBO1FBQzNCLENBQUM7S0FDSjtJQXhCRCxzQkF3QkM7Ozs7OztJQ3hCRCxNQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBc0IsQ0FBQTtJQUNwRSxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBNkIsQ0FBQTtJQUUvRCxTQUFTLGVBQWU7UUFDcEIsTUFBTSxZQUFZLEdBQUcsU0FBUyxDQUFBO1FBQzlCLE1BQU0sV0FBVyxHQUFHLFNBQVMsQ0FBQTtRQUM3QixNQUFNLFlBQVksR0FBRyxFQUFFLENBQUE7UUFFdkIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUN6QixJQUFJLE1BQU0sR0FBRyxJQUFJLGFBQUssRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUNuQyxJQUFJLFdBQVcsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFBO1lBQ3ZFLFlBQVk7WUFDWixZQUFZLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFBO1NBQ2pDO1FBQ0QsT0FBTyxZQUFZLENBQUE7SUFDdkIsQ0FBQztJQUVELFNBQWdCLFNBQVM7UUFDckIsTUFBTSxVQUFVLEdBQUcsRUFBRSxDQUFBO1FBRXJCLE1BQU0sQ0FBQyxNQUFNLEdBQUcsVUFBVSxHQUFHLENBQUMsQ0FBQTtRQUM5QixNQUFNLENBQUMsS0FBSyxHQUFHLFVBQVUsR0FBRyxDQUFDLENBQUE7UUFFN0IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUN6QixJQUFJLFdBQVcsR0FBRyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQTtZQUN0QyxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxHQUFHLFVBQVUsR0FBRyxVQUFVLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUE7WUFDbkUsSUFBSSxDQUFDLEdBQUcsVUFBVSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO1lBRTVCLEdBQUcsQ0FBQyxTQUFTLEdBQUcsV0FBVyxDQUFBO1lBQzNCLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUE7U0FDN0M7UUFDRCxlQUFlLENBQUMsVUFBVSxDQUFDLENBQUE7SUFDL0IsQ0FBQztJQWZELDhCQWVDO0lBRUQsU0FBUyxlQUFlLENBQUMsUUFBUSxHQUFHLEVBQUU7UUFDbEMsTUFBTSxRQUFRLEdBQUcsRUFBRSxDQUFBO1FBQ25CLE1BQU0sT0FBTyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFBO1FBQ3hELE1BQU0sT0FBTyxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFBO1FBRXhELEdBQUcsQ0FBQyxJQUFJLEdBQUcsR0FBRyxRQUFRLFVBQVUsQ0FBQTtRQUVoQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3hCLEdBQUcsQ0FBQyxTQUFTO2dCQUNULENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFBO1lBQ2pFLEdBQUcsQ0FBQyxRQUFRLENBQ1IsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUNWLFFBQVEsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxRQUFRLEVBQzdCLE1BQU0sQ0FBQyxNQUFNLEdBQUcsUUFBUSxHQUFHLEdBQUcsQ0FDakMsQ0FBQTtZQUNELEdBQUcsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQ3JFLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLFFBQVEsR0FBRyxHQUFHLEVBQUUsUUFBUSxHQUFHLENBQUMsR0FBRyxRQUFRLEdBQUcsR0FBRyxDQUFDLENBQUE7U0FDMUU7SUFDTCxDQUFDOzs7OztJQ25ERCxNQUFNLEtBQUssR0FBRyxJQUFJLGFBQUssRUFBRSxDQUFBO0lBQ3pCLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQTtJQUViLElBQUEsZ0JBQVMsR0FBRSxDQUFBIn0=