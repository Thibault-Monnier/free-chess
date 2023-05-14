define("models/king", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.King = void 0;
    class King {
        constructor(color) {
            this.color = color;
        }
    }
    exports.King = King;
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
            let board = [];
            for (let row = 0; row < 8; row++) {
                //@ts-ignore
                board[row] = [];
                for (let column = 0; column < 8; column++) {
                    //@ts-ignore
                    board[row].push(this.squares[row * 8 + column]);
                }
            }
            console.log(board);
        }
    }
    exports.Board = Board;
});
define("main", ["require", "exports", "models/board"], function (require, exports, board_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const board = new board_1.Board();
    board.debug();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tb2RlbHMva2luZy50cyIsIi4uL3NyYy9tb2RlbHMvYm9hcmQudHMiLCIuLi9zcmMvbWFpbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0lBQUEsTUFBYSxJQUFJO1FBR2IsWUFBWSxLQUF3QjtZQUNoQyxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQTtRQUN0QixDQUFDO0tBQ0o7SUFORCxvQkFNQzs7Ozs7O0lDSkQsTUFBYSxLQUFLO1FBR2Q7WUFDSSxJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQTtZQUNqQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUN6QixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQTthQUMxQjtRQUNMLENBQUM7UUFFRCxLQUFLO1lBQ0QsSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFBO1lBRWQsS0FBSyxJQUFJLEdBQUcsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRTtnQkFDOUIsWUFBWTtnQkFDWixLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFBO2dCQUNmLEtBQUssSUFBSSxNQUFNLEdBQUcsQ0FBQyxFQUFFLE1BQU0sR0FBRyxDQUFDLEVBQUUsTUFBTSxFQUFFLEVBQUU7b0JBQ3ZDLFlBQVk7b0JBQ1osS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQTtpQkFDbEQ7YUFDSjtZQUVELE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUE7UUFDdEIsQ0FBQztLQUNKO0lBeEJELHNCQXdCQzs7Ozs7SUN4QkQsTUFBTSxLQUFLLEdBQUcsSUFBSSxhQUFLLEVBQUUsQ0FBQTtJQUN6QixLQUFLLENBQUMsS0FBSyxFQUFFLENBQUEifQ==