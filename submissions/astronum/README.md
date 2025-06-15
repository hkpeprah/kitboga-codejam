# Astronum

An asteroids-like "game". This captcha requires the user to complete a math
problem by selecting the right numbers to solve the equation. The "catch" is
that the user must manually move a ship  in order to input their numbers.

## How to Use

### Inputs

The captcha supports keyboard input (up, down, left or right arrows) as well
as touch and mouse controls. When using touch and mouse controls, the ship
will move towards the current cursor or finger position as long as the mouse
left button or finger press is detected, respectively.

### Solving the Equation

There are three values that must be input: a left operand, a right operand
and a sum. The order does not matter for the left or right operand, but does
matter for the sum. As a result, the user must input the operands first
before inputting the sum value. The two operands must sum to the inputted
sum value, otherwise the captcha will have failed.

The user is presented with six numbers, of which there are only three that
together solve the equation `X + Y = Z`. Amongst all six numbers, there is
only one set of three for which the equation will be satisfied. The position
of `X` and `Y` are interchangeable in the equation, but `Z` must always be
inputted last.

#### Incorrect Values

If any incorrect values are inputted, the user must finish the equation
before they will be given an opportunity to try again. In this instance,
inputting other values until they are presented with the `Try Again` screen.

#### Example

The available numbers are 52, 27, 1, 15, 18 and 16. The equation can be
solved by inputting either 1, 15 and 16, or 15, 1 and 16 (`1 + 15 = 16`).

### Other Controls

* To resume or start the captcha, click anywhere inside of the play area.
* Pausing can be done by clicking outside of the play area.

## Configuration

Query parameters can be used to modify the behaviour of the captcha.

| Query Parameter  |  Type  | Description                                           |
| :--------------: | :----: | :---------------------------------------------------- |
|  `asteroidCount` |  `int` | Number of asteroids (numbers) to render (default: 6). |
