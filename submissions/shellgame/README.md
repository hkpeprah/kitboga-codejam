# Shell Game

The shell game is a game where an object is placed under one of three cups and
shuffled. After shuffling, the player has to try and identify which cup the
object is under. If they do so successfully, then they win. This game is
identical, except the cups are replaced with cans and the object is a golden
bean.

## How to Use

### Inputs

Only touch events or mouse presses are supported.

### Playing the Game

To win the game, the player has to correctly identify the "can of beans" over
three rounds. This can be done after shuffling by clicking or touching the can
to select it. Each round increases the speed of the rotations.

## Configuration

Query parameters can be used to modify the behaviour of the captcha.

| Query Parameter |  Type  | Description                                                                      |
| :-------------: | :----: | :------------------------------------------------------------------------------- |
|    `numCans`    |  `int` | Number of cans to display.                                                       |
|   `numRounds`   |  `int` | Number of rounds that must be completed.                                         |
|  `numShuffles`  |  `int` | Shuffles per round. This number is multiplied by the round number.               |
|  `shuffleSpeed` |  `int` | Shuffling speed measured in 10ms. This number is divided by the round number.    |
