## What is Free Chess?

Free Chess is an open source chess game and engine developed in Typescript by Thibault Monnier as a study project.

## How to run the program?

You can play [Free Chess](https://free-chess.netlify.app) from your browser.

To run it locally, clone this repository, and open `index.html` in your browser.

## How to change the program locally?

If you wish to make local changes:

- Install Yarn (or NPM).
- In a terminal, change directory to the project root, and run `yarn install`. This will install Typescript.
- From the terminal, run `yarn dev`. This will start Typescript in watch mode.

Every change you make to any TS file will be compiled into the `dist/main.js` file, which is used by the browser. Don't manually change this JS file.

## How does the engine work?

The engine is developed using common and well-known algorithms.

It uses the [minimax](https://en.wikipedia.org/wiki/Minimax) recursive algorithm, which ensures that all moves are searched.

It also uses [alpha-beta pruning](https://en.wikipedia.org/wiki/Alpha%E2%80%93beta_pruning), which is a powerful optimisation that cuts out branches of moves that are proven to be worse than some already explored ones, effectively speeding up the engine without losing any precision.

The engine has an evaluation function to evaluate each position, used to decide which move is the best choice.

## What next?

Many improvements to the engine are currently planned, along with improvements to the website itself, a few additional features and bug fixes.
