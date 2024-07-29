# What is Free Chess?

Free Chess is an open source chess game and engine developed in Typescript by Thibault Monnier as a study project.

## How to run the program?

You can play [Free Chess](https://free-chess.netlify.app) from your browser.

To run it locally, clone this repository, then open it on a live server in your browser.

## How to change the program locally?

If you wish to make local changes:

-   Install Yarn (or NPM).
-   In a terminal, change directory to the project root, and run `yarn install`. This will install all the required dependencies.
-   From the terminal, run `yarn dev`. This will start Webpack in watch mode.
-   To run the tests, enter `yarn test` in your command terminal, or download an extension that runs them automatically.

Every change you make to any TS file will be transpiled into the `dist` folder, which is used by the browser. Don't manually change any JS file in this folder.

## How does the engine work?

The engine is developed using common and well-known algorithms.

It uses the [minimax](https://en.wikipedia.org/wiki/Minimax) recursive algorithm, which ensures that all moves that can possibly be played are searched and evaluated by the engine.

It also uses [alpha-beta pruning](https://en.wikipedia.org/wiki/Alpha%E2%80%93beta_pruning), which is a powerful optimisation that cuts out branches of moves that are proven to be worse than some already explored ones, effectively speeding up the engine without losing any precision.

The engine has an evaluation function to evaluate each position, used to decide which move is the best choice. It is currently pretty simple however, taking only into account the position and value of each piece.

The chess computer currently take less than 3 seconds to search a depth of 4 ply, or about 1,000,000 positions. However, alpha-beta pruning decreases the number of positions that need to be searched to 20,000 - 300,000 (depending on the position).

## What next?

The chess engine will eventually be replaced by a Rust-based one, by using [WebAssembly](https://webassembly.org/) to run it directly in the browser.

<br>

### GPL v3 LICENSE:

    Copyright (C), 2024, Thibault Monnier

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
