# Do Not Redeem

## Overview

To sole this captcha, the user must redeem a certain number of Google Play gift
cards before the captcha timeout runs out. If they fail to do so, or redeem a
card that is not a Google Play gift card, they will have to re-attempt the
captcha. Cards are shown for a set duration of time; this duration decreases the
closer they get to the target value.

## How to Use

### Inputs

Only touch events or mouse presses are supported.

## Configuration

Query parameters can be used to modify the behaviour of the captcha.

| Query Parameter |  Type  | Description                                                   |
| :-------------: | :----: | :------------------------------------------------------------ |
|     `amount`    |  `int` | Target amount, in dollars, to redeem to solve the captcha.    |
|     `timer`     |  `int` | Number of seconds to allow for successful captcha completion. |
|   `maxDuration` |  `int` | Number of seconds to show each gift card for initially.       |
|   `minDuration` |  `int` | Minimum number of seconds to show each gift card for.         ||
|     `expire`    | `bool` | If specifed, catpcha runs until the total time has elapsed.   |
