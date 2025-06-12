/**
 * @brief 2-dimensional point.
 */
class Point {
    /**
     * @brief Point constructor.
     *
     * @param x {Float} X coordinate of the point.
     * @param y {Float} Y coordinate of the piont.
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
};


/**
 * @brief Arc from point to point.
 */
class Arc {
    /**
     * @brief Arc
     *
     * @param start      {Point}    Starting point of the arc.
     * @param end        {Point}    Ending point of the arc.
     * @param numPoints  {Integer}  Number of points to generate along the arc.
     * @param trajectory {Boolean}  `true` if ARC is above the X axis.
     */
    constructor(start, end, numPoints, trajectory) {
        // Generate the points along the arc.
        // Diameter of circle is distance between the two points along the X
        // axis, so radius is half that.
        const z = (end.x - start.x);
        const r = Math.abs(z) / 2;

        const cx = start.x + (z / 2);
        const cy = start.y;

        const startAngle = (z > 0 ? Math.PI : 0);
        const angleDelta = trajectory ? -Math.PI : Math.PI;
        const endAngle = startAngle + angleDelta;

        this.points = Array.from({ length: numPoints }, (_, idx) => {
            const t = idx / numPoints;
            const deg = startAngle + (endAngle - startAngle) * t;
            return new Point(cx + r * Math.cos(deg), cy + r * Math.sin(deg));
        });

        this.points.push(end);
    }

    /**
     * @brief Returns the next point along the arc.
     *
     * @return {Point}
     */
    getNextPoint() {
        if (!this.points.length) {
            return null;
        }

        const point = this.points.shift();
        return point;
    }
};


/**
 * @brief Captcha overlay.
 *
 * @details Used to display text over top of the captcha.
 *
 * @param container {Element} Containing DOM element node.
 */
const CaptchaOverlay = (container) => {
    const icon = document.createElement("div");
    const titleEl = document.createElement("h2");
    const subtitleEl = document.createElement("span");
    const display = container.style.display;

    /**
     * @brief Renders the overlay.
     */
    const render = () => {
        icon.style.display = "none";
        icon.className = "captcha-icon";
        container.appendChild(icon);
        container.appendChild(titleEl);
        container.appendChild(subtitleEl);
        return this;
    }

    /**
     * @brief Hides the overlay.
     */
    const hide = () => {
        container.style.display = "none";
        return this;
    }

    /**
     * @brief Shows the overlay.
     */
    const show = () => {
        container.style.display = display;
        return this;
    }

    /**
     * @brief Sets the overlay text.
     *
     * @param title    {String}  Title string for the overlay.
     * @param subtitle {String}  Subtitle string for the overlay.
     * @param style    {String}  Optional overlay styling.
     */
    const set = (title, subtitle, style) => {
        titleEl.innerText = title;
        subtitleEl.innerText = subtitle;

        switch (style) {
            case "success":
                icon.innerHTML = "&#10003";
                icon.style.display = "flex";
                container.className = "captcha-overlay captcha-success";
                break;

            case "failed":
                icon.innerHTML = "&#10005";
                icon.style.display = "flex";
                container.className = "captcha-overlay captcha-failed";
                break;

            case "pass":
                icon.innerHTML = "&#10003";
                icon.style.display = "flex";
                container.className = "captcha-overlay captcha-pass";
                break;

            default:
                icon.style.display = "none";
                container.className = "captcha-overlay";
                break;
        }

        show();
    };

    return (() => {
        render();

        const self = CaptchaOverlay;
        self.set = set;
        self.hide = hide;
        self.show = show;
        return self;
    })();
};


/**
 * @brief Represents a can within the captcha.
 *
 * @param document  {Document} DOM object.
 * @param container {Element}  Containing DOM element.
 * @param beans     {Boolean}  Boolean indicating if the Can contains beans or not.
 *
 * @returns {Can}
 */
const Can = (document, container, beans) => {
    const el = document.createElement("div");
    const contents = document.createElement("div");

    let canPos = null;
    let contentPos = null;
    let pos = null;

    /**
     * @brief Returns the (x, y) coordinates of the top left corner of the can.
     *
     * @return {Point}
     */
    const getPos = () => {
        return pos;
    };

    /**
     * @brief Returns the width of the underlying DOM element.
     *
     * @return {Float}
     */
    const getWidth = () => {
        return el.offsetWidth;
    };

    /**
     * @brief Returns the height of the underlying DOM element.
     *
     * @return {Float}
     */
    const getHeight = () => {
        let height = el.offsetHeight;
        el.childNodes.forEach((node) => {
            height = Math.max(height, node.offsetHeight);
        });
        return height;
    };

    /**
     * @brief Returns `true` if the can contains beans.
     *
     * @return {Boolean}
     */
    const containsBeans = () => {
        return beans;
    };

    /**
     * @brief Renders the element and adds it to the DOM.
     */
    const render = () => {
        let img = document.createElement("img");
        img.src = "https://cdn.frankerfacez.com/emoticon/62800/4";
        el.appendChild(img);

        img = document.createElement("img");
        if (beans) {
            img.src = "https://cdn.frankerfacez.com/emoticon/284305/4";
        } else {
            img.src = "https://cdn.frankerfacez.com/emoticon/380518/4";
        }
        contents.className = "captcha-can-contents";
        contents.style.visibility = "hidden";
        contents.appendChild(img);
        container.appendChild(contents);

        // Hide all children.
        el.childNodes.forEach((child) => {
            child.style.visibility = "hidden";
        });

        el.className = "captcha-can";
        el.style.visibility = "hidden";
        el.style.top = "0px";
        el.style.left = "0px";
        el.style.display = "block";
        container.appendChild(el);
    };

    /**
     * @brief Sets the absolute position of the can element in the DOM.
     *
     * @param x       {Float}    New X coordinate.
     * @param y       {Float}    New Y coordinate.
     * @param entire  {Boolean}  Move entire can (`true`).
     */
    const move = (x, y, entire) => {
        pos = new Point(x, y);

        let yOffset = (getHeight() + container.offsetTop) / 2;
        canPos = new Point(x, y - yOffset);
        el.style.top = `${canPos.y}px`;
        el.style.left = `${canPos.x}px`;
        el.style.visibility = "visible";

        if (entire) {
            const xOffset = (getWidth() - contents.offsetWidth) / 2;
            yOffset = (contents.offsetHeight + container.offsetTop) / 2;
            contentPos = new Point(x + xOffset, y - yOffset);
            contents.style.visibility = "visible";
            contents.style.top = `${contentPos.y}px`;
            contents.style.left = `${contentPos.x}px`;
        }

        // Show all children.
        el.childNodes.forEach((child) => {
            child.style.visibility = "visible";
        });
    };

    /**
     * @brief Returns the boundaries of the DOM element representing the can.
     *
     * @return {Rectangle}
     */
    const getBounds = () => {
        return el.getBoundingClientRect();
    };

    return (() => {
        render();

        const self = {};
        self.getBounds = getBounds;
        self.move = move;
        self.getHeight = getHeight;
        self.getWidth = getWidth;
        self.getPos = getPos;
        self.containsBeans = containsBeans;

        return self;
    })();
};


/**
 * @brief Captcha application.
 *
 * @param window   {Window}   Window object.
 * @param document {Document} DOM element.
 */
const Captcha = (window, document) => {
    // Amount of can to reveal on each tick.
    const REVEAL_TICK = 2;

    // Number of milliseconds between updates to the DOM in milliseconds.
    const EVENT_LOOP_TICK = 10;

    const NUM_CANS = 3;
    const NUM_ROUNDS = 3;
    const ANIMATION_SPEED = 80;
    const ANIMATION_COUNT = 5;

    const title = document.createElement("h3");
    const container = document.getElementById("captcha-app");
    const overlay = CaptchaOverlay(document.getElementById("captcha-overlay"));
    const cans = Array.from({ length: NUM_CANS }, (_, idx) => {
        return Can(document, container, (idx == Math.floor(NUM_CANS / 2)));
    });

    // Current round.
    let round = 0;

    // Captcha successfully solved.
    let done = false;

    // Captcha failed.
    let failed = false;

    // Indicates if a round is starting.
    let started = false;

    // Can currently being revealed.
    let revealing = null;

    // Array of can animations.
    let animations = [];

    /**
     * @brief Starts the next round.
     */
    const startRound = () => {
        round += 1;
        started = true;
        overlay.hide();
        generateReveal(null, (round == 1), true);
        generateAnimations();
    };

    /**
     * @brief Generates the reveal animation.
     *
     * @param canIdx {Integer} Optional index of the can to reveal (defaults to bean can).
     * @param show   {Boolean} Boolean indicating if the can should be shown.
     * @param hide   {Boolean} Boolean indicating if the can should be hidden.
     */
    const generateReveal = (canIdx, show, hide) => {
        let newAnimations = [];

        // If the current round is round zero, we first need to show the can
        // of beans, and then hide it. Otherwise, we just hide the can of
        // beans.
        let numRevealAnimations = 100 / REVEAL_TICK;
        let hidden = show;
        if (show && hide) {
            numRevealAnimations *= 2;
        }

        for (let i = 0; i < numRevealAnimations; i++) {
            let arcs = [];
            cans.forEach((can, idx) => {
                let animate = false;
                if ((canIdx !== undefined) && (canIdx !== null)) {
                    animate = (canIdx == idx);
                } else {
                    animate = can.containsBeans();
                }

                if (!animate) {
                    arcs.push(can.getPos());
                    return;
                }

                const pos = !show ? can.origPos : can.getPos();
                const top = Math.min(pos.y - container.offsetTop - (can.getHeight() / 2), can.getHeight() * 1.5);
                const percent = (REVEAL_TICK * ((i % (100 / REVEAL_TICK)) + 1));
                let yOffset = 0;

                if (hidden) {
                    yOffset = top * percent / 100;
                    hidden = (percent < 100);
                } else {
                    yOffset = top - (top * percent / 100);
                }
                arcs.push(new Point(pos.x, pos.y - yOffset));
            });
            newAnimations.push(arcs);
        }

        // Keep track of the position prior to the animation.
        cans.forEach((can) => {
            can.origPos = can.getPos();
        });

        revealing = canIdx;
        newAnimations.forEach((a) => {
            animations.push(a);
        });
    };

    /**
     * @brief Generates all animations for the cans.
     */
    const generateAnimations = () => {
        let newAnimations = [];

        // Get the current position of each can.
        let prevPositions = cans.map((c) => {
            const pos = c.getPos();
            const yPos = container.offsetHeight / 2;
            return new Point(pos.x, yPos);
        });

        // Generate all arcs.
        for (let j = 0; j < (ANIMATION_COUNT * (round + 1)); j++) {
            // Generate the new positions to move to. We keep track of the
            // previous and new positions in order to ensure we move each can
            // from its current position to the new one.
            const newPositions = prevPositions
                .map(value => ({ value, sort: Math.random() }))
                .sort((a, b) => a.sort - b.sort)
                .map(({ value }) => value);

            let arcs = [];
            cans.forEach((can, idx) => {
                // Randomize whether the arc is above or below the X axis.
                const trajectory = (Math.random() < 0.5 ? true : false);
                arcs.push(new Arc(prevPositions[idx], newPositions[idx], ANIMATION_SPEED / (round + 1), trajectory));
            });

            // Add the generated arcs to the animation list.
            newAnimations.push(arcs);

            // Update our previous positions.
            prevPositions = newPositions;
        }

        newAnimations.forEach((a) => {
            animations.push(a);
        });
    };

    /**
     * @brief Resets the captcha state to the initial state.
     */
    const reset = () => {
        round = 0;
        done = false;
        failed = false;
        started = false;
        animations = [];
        overlay.set("Click Anywhere to Start", "Correctly identify the right can 3 times.");

        // Render each can in their starting positions.
        let xOffset = container.offsetWidth;
        xOffset -= (cans[0].getWidth() * cans.length);
        xOffset /= (cans.length + 1);

        let xPos = xOffset;
        const yPos = container.offsetHeight / 2;
        cans.forEach((can, i) => {
            can.move(xPos, yPos, true);
            xPos += (xOffset + can.getWidth());
        });
    };

    /**
     * @brief Handles of a successful can identification.
     *
     * @details If at least `NUM_ROUNDS` has occurred, then success is
     * communicated upstream.
     */
    const onSuccess = () => {
        if (round >= NUM_ROUNDS) {
            done = true;
            overlay.set("Success", "", "success");
            window.top.postMessage("success", "*");
        } else {
            started = false;
            overlay.set("Round Complete", `${NUM_ROUNDS - round} more remaining.`, "pass");
        }
    };

    /**
     * @brief Invoked when the captcha fails.
     */
    const onFailed = () => {
        failed = true;
        started = false;
        overlay.set("Try Again", "Correctly identify the right can 3 times.", "failed");
    };

    /**
     * @brief Event handler for a touch or mouse event.
     *
     * @details This method is used to check for click on a can.
     *
     * @param ev {Event} the mouse down or touch down event.
     */
    const onClick = (ev) => {
        ev.stopPropagation();

        if (done || animations.length) {
            return;
        }

        const pos = getCoordinates(ev);
        const boundaries = container.getBoundingClientRect();
        if (isWithin(pos, boundaries)) {
            if (failed) {
                reset();
                return;
            }

            if (!started) {
                startRound();
                return;
            }

            cans.forEach((can, idx) => {
                if (isWithin(pos, can.getBounds())) {
                    // Reveal the specific can. Validation will be done in the
                    // event handler to determine if it was the winning one.
                    generateReveal(idx, true, false);
                }
            });
        }
    };

    /**
     * @brief Callback invoked after the cans have been moved to invoke the
     * next move. Once all moves have been finished,
     */
    const onNextFrame = () => {
        if (animations.length == 0) {
            return;
        }

        let arcs = animations[0];
        cans.forEach((can, idx) => {
            if (!arcs) {
                return;
            }

            let arc = arcs[idx];
            let point = null;
            let entire = true;
            if (arc.getNextPoint) {
                point = arc.getNextPoint();
                if (point == null) {
                    // This ARC has run out, so shift to the next animation.
                    animations.shift();
                    if (!animations.length) {
                        return;
                    }

                    arcs = animations[0];
                    point = arcs[idx].getNextPoint();
                }
            } else {
                point = arcs[idx];
                entire = false;
                if (idx == (cans.length - 1)) {
                    animations.shift();
                }
            }

            can.move(point.x, point.y, entire);
        });
    };

    /**
     * @brief Callback invoked on each state update tick.
     *
     * @details This API is responsible for animating the movement of the cans
     * as well as revealing of can. After reveal, it handles success or failure
     * callbacks.
     */
    const onTick = () => {
        if (!animations.length) {
            if ((revealing !== undefined) && (revealing !== null)) {
                const can = cans[revealing];
                revealing = null;
                if (can.containsBeans()) {
                    onSuccess();
                } else {
                    onFailed();
                }
            }
        } else {
            // Show the next animation frame.
            requestAnimationFrame(() => {
                onNextFrame();
            });
        }
    };

    /**
     * @brief Binds the event listeners.
     *
     * @returns {Captcha}
     */
    const bind = () => {
        ["touchend", "mouseup"].forEach((eventName) => {
            document.addEventListener(eventName, onClick);
        });
    };

    /**
     * @brief Renders the container.
     */
    const render = () => {
        const yPos = container.offsetHeight / 2;
        const canHeight = cans[0].getHeight();
        const offset = yPos + container.offsetTop;
        const table = document.getElementById("captcha-table");
        table.style.top = `${offset}px`;
    };

    bind();
    render();
    reset();

    setInterval(() => {
        onTick();
    }, EVENT_LOOP_TICK);

    return this;
};


/**
 * @brief Returns the coordinates of a touch or mouse down event.
 *
 * @param ev {Event} The UI event.
 *
 * @return {Point} A coordinate on success, otherwise `null`.
 */
const getCoordinates = (ev) => {
    if (!ev.touches) {
        return new Point(ev.clientX, ev.clientY);
    } else if (ev.touches.length == 1) {
        return new Point(ev.touches[0].clientX, ev.touches[0].clientY);
    }

    // Multi-finger touch not supported.
    return null;
};


/**
 * @brief Returns if a point falls within a rectangle.
 *
 * @param p    {Point}     The point to check for capture.
 * @param rect {Rectangle} The bounding client rectangle.
 *
 * @return {Boolean} `true` if point is contained, otherwise `false`.
 */
const isWithin = (p, rect) => {
    if (!p || !rect) {
        return false;
    }
    return ((p.x >= rect.left) &&
            (p.x <= rect.right) &&
            (p.y >= rect.top) &&
            (p.y <= rect.bottom));
};


/**
 * @brief Callback invoked when DOM is ready. Loads the application.
 */
const onReady = () => {
    if (onReady.app) {
        // Function already invoked, so return.
        return;
    }

    onReady.app = Captcha(window, document);
};


// Bind the listener to the `onReady` handler.
window.onload = onReady;

// Backwards fallback for `onload` failing.
document.addEventListener("DOMContentLoaded", onReady);
