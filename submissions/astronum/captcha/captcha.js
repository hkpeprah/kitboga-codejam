/**
 * @brief Keyboard codes.
 */
const KeyCodes = Object.freeze({
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    W: 87,
    A: 65,
    S: 83,
    D: 68,
});

/**
 * @brief Event types.
 */
const EventTypes = Object.freeze({
    NONE: 0,
    KEY: 1,
    MOUSE: 2,
    TOUCH: 3,
});

/**
 * @brief 2-dimensional point.
 */
class Point {
    /**
     * @brief Point constructor.
     *
     * @param x {Integer} X coordinate of the point.
     * @param y {Integer} Y coordinate of the piont.
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
};

/**
 * @brief Event handler definition.
 */
class EventHandler {
    /**
     * @brief Event handler constructor.
     *
     * @param id     {Integer}    event identifier.
     * @param type   {EventTypes} type of event (e.g. keypress or mouse down).
     * @param code   {Integer}    code to check against the event.
     * @param fn     {Function}   function to invoke on event.
     * @param repeat {Boolean}    boolean indicating if the handler repeats on event.
     */
    constructor(id, type, code, fn, repeat) {
        this.id = id;
        this.type = type;
        this.code = code;
        this.fn = fn;
        this.repeat = repeat;
    }
};

/**
 * @brief Render event loop.
 *
 * @details The event loop is used to schedule updates to the DOM at defined
 * intervals. This allows for the multiple updates to occur outside of the
 * events that trigger them.
 *
 * @param document {Document} DOM
 * @param canvas   {Element}  The canvas DOM element events are listened for in.
 */
const EventLoop = (document, canvas) => {
    // Number of milliseconds between updates to the DOM in milliseconds.
    const EVENT_INTERVAL = 5.0;

    // Number of milliseconds to wait before resuming from a pause.
    const RESUME_INTERVAL = 100.0;

    // Event handlers.
    const handlers = [];
    const keyListeners = [];
    const mouseListeners = [];
    const tickListeners = [];

    // Next ID for adding a handler.
    let nextId = 0;

    // Current position of a drag event. If `null`, then a drag event is not
    // in progress.
    let curPos = null;

    // Pause state of the event loop.
    let paused = false;
    let resumeTimeRemaining = 0;

    /**
     * @brief Adds an event handler.
     *
     * @param type   {EventTypes} The event type.
     * @param code   {Integer}    The event code.
     * @param fn     {Function}   The function to add.
     * @param repeat {Boolean}    Optional boolean indicating if the event repeats.
     *
     * @return {Integer} Identifier for the added handler.
     */
    const add = (type, code, fn, repeat) => {
        const curId = (nextId + 1);
        nextId++;
        handlers.push(new EventHandler(curId, type, code, fn, repeat));
        return curId;
    };

    /**
     * @brief Removes a bound event handler.
     *
     * @param id {Integer} the Id of the bound handler.
     */
    const remove = (id) => {
        for (let idx = 0; idx < handlers.length; idx++) {
            if (handlers[idx].id == id) {
                handlers.splice(idx, 1);
                break;
            }
        }

        for (let idx = 0; idx < keyListeners.length; idx++) {
            if (keyListeners[idx].id == id) {
                keyListeners[idx].id = null;
                break;
            }
        }

        for (let idx = 0; idx < mouseListeners.length; idx++) {
            if (mouseListeners[idx].id == id) {
                mouseListeners[idx].id = null;
                break;
            }
        }
    };

    /**
     * @brief Runs all bound events.
     */
    const run = (fn) => {
        if (paused || (resumeTimeRemaining > 0)) {
            if (resumeTimeRemaining > 0) {
                resumeTimeRemaining -= EVENT_INTERVAL;
            }
            // Event loop is paused or we are still resuming, so do not
            // service any events.
            return;
        }

        tickListeners.forEach((fn) => {
            fn();
        });

        const newHandlers = handlers.slice();
        newHandlers.forEach((handler) => {
            handler.fn(handler.code, curPos);
            if (!handler.repeat) {
                remove(handler.id);
            }
        });
    };

    /**
     * @brief Event handler for the key down event.
     *
     * @param ev {Event} the key down event.
     */
    const onKeyDown = (ev) => {
        let key = (ev.charCode || ev.keyCode);
        for (let idx = 0; idx < keyListeners.length; idx++) {
            const listener = keyListeners[idx];
            if ((listener.type == EventTypes.KEY) &&
                (listener.code == key) &&
                !listener.id) {
                listener.id = add(listener.type, listener.code, listener.fn, listener.repeat);
            }
        }
    };

    /**
     * @brief Event handler for the key up event.
     *
     * @param ev {Event} the key event.
     */
    const onKeyUp = (ev) => {
        let key = (ev.charCode || ev.keyCode);
        for (let idx = 0; idx < handlers.length; idx++) {
            const handler = handlers[idx];
            if ((handler.type == EventTypes.KEY) && (handler.code == key)) {
                remove(handler.id);
                return;
            }
        }
    };

    /**
     * @brief Event handler for when a touch event starts.
     *
     * @param ev {Event} the touch down event.
     *
     * @note This also handles a mousedown event.
     */
    const onTouchStart = (ev) => {
        const clientPos = getCoordinates(ev);
        if (clientPos == null) {
            return;
        }

        const boundaries = canvas.getBoundingClientRect();
        if (isWithin(clientPos, boundaries)) {
            ev.stopPropagation();
            ev.preventDefault();
            curPos = clientPos;

            for (let idx = 0; idx < mouseListeners.length; idx++) {
                const listener = mouseListeners[idx];
                if (((listener.type == EventTypes.MOUSE) ||
                     (listener.type == EventTypes.TOUCH)) &&
                    !listener.id) {
                    listener.id = add(listener.type, curPos, listener.fn, listener.repeat);
                }
            }
        }
    };

    /**
     * @brief Event handler for when a touch move event occurs.
     *
     * @details This is paired with `onTouchStart()` to handle moves that
     * start with a touch down event within the captcha canvas.
     *
     * @param ev {Event} the touch mouse event.
     *
     * @note This also handles a mousemove event.
     */
    const onTouchMove = (ev) => {
        if (curPos == null) {
            return;
        }

        const clientPos = getCoordinates(ev);
        const boundaries = canvas.getBoundingClientRect();
        if (isWithin(clientPos, boundaries)) {
            ev.stopPropagation();
            ev.preventDefault();
            curPos = clientPos;
        }
    };

    /**
     * @brief Event handler for when a touch event ends.
     *
     * @param ev {Event} the touch up event.
     *
     * @note This also handles a mouseup event.
     */
    const onTouchEnd = (ev) => {
        if (curPos) {
            curPos = null;
            ev.preventDefault();
        }

        const newHandlers = handlers.slice();
        for (let idx = 0; idx < newHandlers.length; idx++) {
            const handler = newHandlers[idx];
            if ((handler.type == EventTypes.TOUCH) || (handler.type == EventTypes.MOUSE)) {
                remove(handler.id);
            }
        }
    };

    /**
     * @brief Adds a function to run on a key event.
     *
     * @param code   {Integer}  the key code to trigger on.
     * @param fn     {Function} the function to invoke.
     * @param repeat {Boolean}  if `true`, event repeats until the key is lifted.
     */
    const addKeyEvent = (code, fn, repeat) => {
        keyListeners.push(new EventHandler(null, EventTypes.KEY, code, fn, repeat));
    };

    /**
     * @brief Adds a function to run on mouse dragging movements.
     *
     * @param fn     {Function} the function to invoke.
     * @param repeat {Boolean}  if `true`, event repeats until the mouse press is lifted.
     */
    const addMouseEvent = (fn, repeat) => {
        mouseListeners.push(new EventHandler(null, EventTypes.MOUSE, null, fn, repeat));
    };

    /**
     * @brief Adds a function to run on touch events.
     *
     * @param fn     {Function} the function to invoke.
     * @param repeat {Boolean}  if `true`, event repeats until the finger is lifted.
     */
    const addTouchEvent = (fn, repeat) => {
        mouseListeners.push(new EventHandler(null, EventTypes.TOUCH, null, fn, repeat));
    };

    /**
     * @brief Adds a function to invoke on each event loop tick.
     *
     * @param fn {Function} The function to invoke.
     */
    const addTickEvent = (fn) => {
        tickListeners.push(fn);
    };

    /**
     * @brief Pauses the event loop.
     *
     * @details Until resume is called, no key presses or mouse events will be
     * serviced.
     */
    const pause = () => {
        paused = true;
        resumeTimeRemaining = 0;
    };

    /**
     * @brief Resumes the event loop.
     *
     * @note Events will begin to be serviced `RESUME_INTERVAL` milliseconds
     * after this function is called.
     */
    const resume = () => {
        resumeTimeRemaining = RESUME_INTERVAL;
        paused = false;
    };

    return (() => {
        document.addEventListener("touchstart", onTouchStart, false);
        document.addEventListener("touchend", onTouchEnd, false);
        document.addEventListener("touchmove", onTouchMove, false);
        document.addEventListener("mousedown", onTouchStart, false);
        document.addEventListener("mouseup", onTouchEnd, false);
        document.addEventListener("mousemove", onTouchMove, false);
        document.addEventListener("keydown", onKeyDown);
        document.addEventListener("keyup", onKeyUp);

        setInterval(() => {
            run();
        }, EVENT_INTERVAL);

        const self = EventLoop;
        self.addKeyEvent = addKeyEvent;
        self.addMouseEvent = addMouseEvent;
        self.addTouchEvent = addTouchEvent;
        self.addTickEvent = addTickEvent;
        self.pause = pause;
        self.resume = resume;

        return self;
    })();
};

/**
 * @brief Generates and binds the ship element.
 *
 * @param document {Document} DOM object.
 * @param canvas   {Element}  DOM element to bind the ship to.
 * @param x        {Integer}  X coordinate of the ship in the canvas.
 * @param y        {Integer}  Y coordinate of the ship in the canvas.
 *
 * @returns {Ship}
 */
const Ship = (document, canvas, x, y) => {
    // Constant turn angle for the ship.
    const TURN_ANGLE = 2.0;

    // Distance (in pixels) to move forwards or backwards on each render.
    const THRUST_DISTANCE = 1.0;

    // Ship DOM element.
    const el = document.createElement("div");

    // Ship dimensions.
    const width = Math.min(canvas.offsetWidth, canvas.offsetHeight) * 0.10;
    const height = Math.min(canvas.offsetWidth, canvas.offsetHeight) * 0.14;

    // Parameters for rendering the ship.
    let posX = x - (height / 2);
    let posY = y - (width / 2);
    let scale = 1.0;
    let angle = 90.0;

    /**
     * @brief Binds the ship to the DOM.
     */
    const render = () => {
        el.setAttribute("id", "captcha-ship");
        el.className = "captcha-ship";
        el.style.top = `${posY}px`;
        el.style.left = `${posX}px`;
        el.style.width = `${height}px`;
        el.style.height = `${width}px`;
        el.style.transform = `rotate(${angle}deg) scale(${scale})`;
        el.style.webkitTransform = `rotate(${angle}deg) scale(${scale})`;
        canvas.appendChild(el);
    };

    /**
     * @brief Updates the position of the ship.
     *
     * @details Uses the stored parameters.
     *
     * @param xDelta   {Float}  Delta, in pixels, to shift the ship along the X axis.
     * @param yDelta   {Float}  Delta, in pixels, to shift the ship along the Y axis.
     * @param degDelta {Float}  Degrees to rotate the ship by.
     */
    const update = (xDelta, yDelta, degDelta) => {
        // Check for collision against the canvas boundaries. Note that while
        // the canvas is a square, the ship is a triangle, so collision
        // detection on the ship cannot be based on a bounding rectangle.
        const p = new Point(posX + xDelta, posY + yDelta);
        let collide = (p.x <= 0);
        collide |= ((p.x + height) >= canvas.offsetWidth);
        collide |= (p.y <= 0);
        collide |= ((p.y + height) >= canvas.offsetHeight);

        if (collide) {
            return;
        }

        // Clamp angle to [0, 360].
        angle += degDelta;
        if (angle > 360) {
            angle %= 360;
        } else if (angle < 0) {
            angle += 360;
        }

        posX += xDelta;
        posY += yDelta;

        el.style.top = `${posY}px`;
        el.style.left = `${posX}px`;
        el.style.transform = `rotate(${angle}deg) scale(${scale})`;
        el.style.webkitTransform = `rotate(${angle}deg) scale(${scale})`;
    };

    /**
     * @brief Moves the ship forward or backwards the specified distance.
     *
     * @param distance {Float} Distance, in pixels, to move.
     */
    const move = (distance) => {
        const rad = angle * Math.PI / 180;
        update(Math.cos(rad) * distance, Math.sin(rad) * distance, 0);
    };

    /**
     * @brief Resets the state of the ship to the initial state.
     */
    const reset = () => {
        posX = x - (width / 2);
        posY = y - (height / 2);
        scale = 1.0;
        angle = 90.0;
        update(0, 0, 0);
    };

    /**
     * @brief Moves the ship forward.
     */
    const forward = () => {
        move(-THRUST_DISTANCE);
    };

    /**
     * @brief Moves the ship backward.
     */
    const backward = () => {
        // Note: Backwards movement doesn't make sense.
        // move(THRUST_DISTANCE);
    };

    /**
     * @brief Rotates the ship left.
     */
    const rotateLeft = () => {
        update(0, 0, -TURN_ANGLE);
    };

    /**
     * @brief Rotates the ship right.
     */
    const rotateRight = () => {
        update(0, 0, TURN_ANGLE);
    };

    /**
     * @brief Returns the boundaries of the ship.
     */
    const getBounds = () => {
        return el.getBoundingClientRect();
    }

    /**
     * @brief Returns the ship's current heading.
     *
     * @return {Float} Heading in degrees.
     */
    const getOrient = () => {
        return angle;
    };

    /**
     * @brief Returns the postion of the center of the chip.
     *
     * @return {Point}
     */
    const getCenter = () => {
        const cx = posX + (el.offsetHeight / 2);
        const cy = posY + (el.offsetWidth / 2);
        return new Point(cx, cy);
    };

    /**
     * @brief Returns the point corresponding to the current front of the
     * ship.
     *
     * @return {Point} Tip of the ship as (x, y) coordinates.
     *
     * @note The value returned by this function accounts for the rotation of
     * the ship.
     */
    const getFront = () => {
        // Compute the center of the ship. Note that since the ship at a zero
        // degree angle is facing left, the height is used to compute the
        // middle along the X axis, and similar for width along the Y axis.
        const cx = posX + (el.offsetHeight / 2);
        const cy = posY + (el.offsetWidth / 2);

        // Translate the tip of the ship so that the center of the ship is
        // used as the origin point.
        const dx = posX - cx;
        const dy = (posY + (el.offsetWidth / 2)) - cy;

        // Convert the angle of rotation to radians, as that is required for
        // the Math.* functions.
        const rad = angle * Math.PI / 180;

        // Rotate the point using the rotation formula.
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const xr = dx * cos - dy * sin;
        const yr = dx * sin + dy * cos;

        // Translate the point back to the original origin.
        const tipX = xr + cx;
        const tipY = yr + cy;

        return new Point(tipX, tipY);
    };

    /**
     * @brief Returns the minimum number of degrees the ship turns on a single
     * event loop tick.
     *
     * @return {Integer} Turn radius in degrees.
     */
    const getMinTurnAngle = () => {
        return TURN_ANGLE;
    };

    /**
     * @brief Returns the minimum number of pixels a ship moves on a single
     * event loop tick.
     *
     * @return {Integer} Movement distance in pixels.
     */
    const getMinThrustDistance = () => {
        return THRUST_DISTANCE;
    };

    return (() => {
        render();

        const self = Ship;
        self.reset = reset;
        self.forward = forward;
        self.backward = backward;
        self.rotateLeft = rotateLeft;
        self.rotateRight = rotateRight;
        self.getBounds = getBounds;
        self.getOrient = getOrient;
        self.getCenter = getCenter;
        self.getFront = getFront;
        self.getMinTurnAngle = getMinTurnAngle;
        self.getMinThrustDistance = getMinThrustDistance;
        return self;
    })();
};

/**
 * @brief Generates a number within the canvas.
 *
 * @param document {Document} DOM object.
 * @param canvas   {Element}  DOM element to bind the number to.
 * @param x        {Integer}  The X coordinate to spawn the number at.
 * @param y        {Integer}  The Y coordinate to spawn the number at.
 * @param value    {Integer}  Integer value for the number.
 *
 * @returns {Number}
 */
const Number = (document, canvas, x, y, value) => {
    const BOUND_OFFSET = 10;

    const el = document.createElement("div");

    const size = Math.min(canvas.offsetWidth, canvas.offsetHeight) * 0.10;

    let originX = x;
    let originY = y;
    let xPos = null;
    let yPos = null;
    let angle = null;

    /**
     * @brief Returns the boundaries of the number element.
     *
     * @return {Rectangle}
     */
    const getBounds = () => {
        return el.getBoundingClientRect();
    };

    /**
     * @brief Returns the value of the number.
     *
     * @return {Integer}
     */
    const getValue = () => {
        return value;
    };

    /**
     * @brief Renders and adds the element to the DOM.
     */
    const render = () => {
        el.className = "captcha-asteroid";
        el.innerHTML = value.toString();
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        canvas.appendChild(el);

        // Adjust the origin to account for the element being out of bounds of
        // the canvas.
        if (originX == 0) {
            originX += BOUND_OFFSET;
        }

        if ((originX + size) >= canvas.offsetWidth) {
            originX = canvas.offsetWidth - size - BOUND_OFFSET;
        }

        if (originY == 0) {
            originY += BOUND_OFFSET;
        }

        if ((originY + size) >= canvas.offsetHeight) {
            originY = canvas.offsetHeight - size - BOUND_OFFSET;
        }

        xPos = originX;
        yPos = originY;
    };

    /**
     * @brief Sets the new value for the number.
     *
     * @param newValue {Integer} New integer value.
     */
    const set = (newValue) => {
        value = newValue;
        el.innerHTML = value.toString();
    };

    /**
     * @brief Moves the number along its current angle until it collides
     * with either the ship or the canvas.
     */
    const move = () => {
        if (el.style.visibility == "hidden") {
            // If the number is not visible, then do not bother with
            // movement.
            return;
        }

        const width = el.offsetWidth;
        const height = el.offsetHeight;
        const rad = angle * Math.PI / 180;
        const xDelta = Math.cos(rad);
        const yDelta = Math.sin(rad);

        // Compute the four points that make up the div that contains the
        // number.
        const points = [
            new Point(xPos + xDelta, yPos + yDelta),
            new Point(xPos + xDelta + width, yPos + yDelta),
            new Point(xPos + xDelta + width, yPos + yDelta + height),
            new Point(xPos + xDelta, yPos + yDelta + height),
        ];

        // Check if any of the four points of the number collides with a
        // boundary of the canvas.
        let collide = false;
        points.forEach((p) => {
            collide |= (p.x <= 0);
            collide |= (p.x >= canvas.offsetWidth);
            collide |= (p.y <= 0);
            collide |= (p.y >= canvas.offsetHeight);
        });

        if (collide) {
            // Only collision, randomly choose a direction to try and escape
            // the collision.
            angle = (angle + (Math.random() * 90)) % 360;
        } else {
            yPos += yDelta;
            xPos += xDelta;
            el.style.top = `${yPos}px`;
            el.style.left = `${xPos}px`;
        }
    };

    /**
     * @brief Shows the element in the DOM.
     */
    const show = () => {
        el.style.top = `${yPos}px`;
        el.style.left = `${xPos}px`;
        el.style.visibility = "visible";
    };

    /**
     * @brief Hides and removes the element from the DOM.
     */
    const hide = () => {
        el.style.visibility = "hidden";
    };

    /**
     * @brief Removes the element from the DOM.
     */
    const remove = () => {
        el.remove();
    };

    /**
     * @brief Returns a boolean indicating if the number is visible or not.
     *
     * @return {Boolean} `true` if visible, otherwise `false`.
     */
    const visible = () => {
        return (el.style.visibility != "hidden");
    }

    /**
     * @brief Resets the number instance.
     */
    const reset = () => {
        // Reset the position of the number.
        xPos = originX;
        yPos = originY;
        el.style.top = `${yPos}px`;
        el.style.left = `${xPos}px`;

        // Choose a random direction to go.
        angle = Math.random() * 360;
    };

    return (() => {
        hide();
        render();
        reset();

        const self = {};
        self.set = set;
        self.move = move;
        self.show = show;
        self.hide = hide;
        self.remove = remove;
        self.visible = visible;
        self.reset = reset;
        self.getBounds = getBounds;
        self.getValue = getValue;
        return self;
    })();
};

/**
 * @brief Captcha equation.
 *
 * @details The captcha equation is comprised of three inputs: a left operand,
 * a right operand and a sum.
 *
 * @param parentNode {Element} The parent element containing the input fields.
 */
const CaptchaEquation = (parentNode) => {
    const inputs = Array.from(parentNode.querySelectorAll("input"));
    const loperand = inputs[0];
    const roperand = inputs[1];
    const sum = inputs[2];

    /**
     * @brief Resets the equation fields.
     */
    const reset = () => {
        inputs.forEach((input) => {
            input.value = "";
        });
    };

    /**
     * @brief Adds an input value to the equation.
     *
     * @param input {Integer} The value to add to the inputs.
     */
    const addInput = (value) => {
        for (let i = 0; i < inputs.length; i++) {
            if (!inputs[i].value) {
                inputs[i].value = value.toString();
                break;
            }
        }
    };

    /**
     * @brief Returns a boolean indicating if the equation has been solved.
     *
     * @return {Boolean} `true` if equation was solved, `false` otherwise.
     *
     * @note This function will return `false` if there are not enough inputs.
     */
    const solved = () => {
        if (!sum.value) {
            return false;
        }

        return (parseInt(loperand.value, 10) + parseInt(roperand.value, 10) == parseInt(sum.value, 10));
    };

    /**
     * @brief Returns a boolean indicating if the equation does not compute
     * successfully.
     *
     * @return {Boolean} `true` if sum is not achieved by the given operands.
     *
     * @note This function will return `false` if there are not enough inputs.
     */
    const failed = () => {
        if (!sum.value) {
            return false;
        }

        return (parseInt(loperand.value, 10) + parseInt(roperand.value, 10) != parseInt(sum.value, 10));
    };

    return (() => {
        const self = CaptchaEquation;
        self.reset = reset;
        self.addInput = addInput;
        self.solved = solved;
        self.failed = failed;
        return self;
    })();
};

/**
 * @brief Captcha overlay.
 *
 * @details Used to display text over top of the captcha.
 *
 * @param container {Element} Containing DOM element node.
 */
const CaptchaOverlay = (container) => {
    const titleEl = document.createElement("h2");
    const subtitleEl = document.createElement("span");
    const display = container.style.display;

    /**
     * @brief Renders the overlay.
     */
    const render = () => {
        container.appendChild(titleEl);
        container.appendChild(subtitleEl);
        return this;
    }

    /**
     * @brief Sets the overlay text.
     *
     * @param title    {String} Title string for the overlay.
     * @param subtitle {String} Subtitle string for the overlay.
     */
    const set = (title, subtitle) => {
        titleEl.innerText = title;
        subtitleEl.innerText = subtitle;
    };

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
 * @brief Captcha application.
 *
 * @param window   {Window}   Window object.
 * @param document {Document} DOM element.
 */
const Captcha = (window, document) => {
    const MAX_SUM = 100;
    const MIN_NUM_ASTEROIDS = 3;

    const DEFAULT_NUM_ASTEROIDS = 6;

    const searchParams = new URLSearchParams(window.location.search);
    const numNumbers = Math.max(MIN_NUM_ASTEROIDS, searchParams.get("asteroidCount") || DEFAULT_NUM_ASTEROIDS);

    const eq = CaptchaEquation(document.getElementById("captcha-title"));
    const overlay = CaptchaOverlay(document.getElementById("captcha-overlay"));

    const canvas = document.getElementById("captcha-app");
    const canvasHeight = (
        document.getElementById("captcha").offsetHeight - document.getElementById("captcha-title").offsetHeight - 7

    );
    canvas.style.height = `${canvasHeight}px`;

    const center = new Point(canvas.offsetWidth / 2, canvas.offsetHeight / 2);
    const ship = Ship(document, canvas, center.x, center.y);
    const loop = EventLoop(document, canvas);

    let numbers = [];
    let done = false;

    /**
     * @brief Invoked to communicate success upstream.
     */
    const onSuccess = () => {
        done = true;
        overlay.set("Success", "");
        overlay.show();
        loop.pause();
        window.top.postMessage("success", "*");
    };

    /**
     * @brief Generates and/or updates the value of the visible numbers.
     *
     * @details If the `numbers` array is already populated, then new values
     * are generated, otherwise new numbers are created and appended to the
     * the array with random starting X and Y coordinates equally distributed
     * around the edge of the canvas.
     */
    const refreshNumbers = () => {
        const values = generateSpecialArray(numNumbers, MAX_SUM);
        numbers.forEach((n) => {
            n.remove();
        });
        numbers = [];

        const canvasWidth = canvas.offsetWidth;
        const canvasHeight = canvas.offsetHeight;
        const perimeter = (canvasWidth * 2) + (canvasHeight * 2);
        const stepSize = perimeter / values.length;
        let step = Math.random() * canvasWidth;

        // Compute an array of (x, y) coordinates equally spaced along the perimeter
        // of the canvas starting at the given (x, y). We do the math as follows:
        //   1. Treat the perimeter as one long line of length `perimeter`.
        //   2. Increment `step` by `stepSize` each iteration.
        //   3. Derive `(x, y)` from `step`.
        for (let i = 0; i < values.length; i++) {
            let x = null;
            let y = null;
            if ((step % perimeter) < canvasWidth) {
                // Top side of square starting from `(0, 0)`.
                x = (step % perimeter);
                y = 0;
            } else if (step < (canvasWidth + canvasHeight)) {
                // Right side of square starting from `(canvasWidth, 0)`.
                x = canvasWidth;
                y = step - x;
            } else if (step < ((canvasWidth * 2) + canvasHeight)) {
                // Bottom side of square starting from `(canvasWidth, canvasHeight)`.
                x = ((canvasWidth * 2) + canvasHeight) - step;
                y = canvasHeight;
            } else {
                // Left side of square starting from `(0, canvasHeight)`.
                x = 0;
                y = perimeter - step;
            }
            step += stepSize;
            numbers.push(Number(document, canvas, x, y, values[i]));
        }
    };

    /**
     * @brief Invoked when the captcha fails.
     */
    const onFailed = () => {
        loop.pause();
        ship.reset();
        refreshNumbers();
        overlay.set("Try Again", "Please solve the equation to continue.");
        overlay.show();
    };

    /**
     * @brief Called when the ship collides with a number.
     *
     * @param n {Number} The collided number.
     */
    const onCollision = (n) => {
        // Add the input value to the equation, then check if it was solved
        // successfully. Note that the failure case is NOT !solved(), as if there
        // are not enough input values yet, solved() will return false.
        const visible = n.visible();
        n.remove();
        if (visible) {
            eq.addInput(n.getValue());
        }

        if (eq.solved()) {
            onSuccess();
        } else if (eq.failed()) {
            onFailed();
        }
    };

    /**
     * @brief Event handler for a touch or mouse event.
     *
     * @details This method is used to detect a loss of focus of the captcha
     * area. On focus loss, key presses are ignored.
     *
     * @param ev {Event} the mouse down or touch down event.
     */
    const onTouch = (ev) => {
        if (done) {
            return;
        }

        const pos = getCoordinates(ev);
        const boundaries = canvas.getBoundingClientRect();
        if (!isWithin(pos, boundaries)) {
            loop.pause();
            overlay.set("Paused", "Click anywhere to resume.");
            overlay.show();
        } else {
            if (eq.failed()) {
                eq.reset();
            }
            numbers.forEach((n) => {
                n.show();
            });
            overlay.hide();
            loop.resume();
        }
    };

    /**
     * @brief Event handler for key presses from the event loop. Invokes the
     * corresponding ship movement.
     *
     * @param code {Integer} the key code.
     */
    const onKeyPress = (code, _) => {
        switch (code) {
            case KeyCodes.UP:
            case KeyCodes.W:
                ship.forward();
                break;

            case KeyCodes.DOWN:
            case KeyCodes.S:
                ship.backward();
                break;

            case KeyCodes.LEFT:
            case KeyCodes.A:
                ship.rotateLeft();
                break;

            case KeyCodes.RIGHT:
            case KeyCodes.D:
                ship.rotateRight();
                break;

            default:
                break;
        }
    };

    /**
     * @brief Handles a drag event.
     *
     * @details This function is used to move the ship towards where a mouse
     * down or touch down event is pointing.
     *
     * @param curPos {Point} The current point of the mouse click or touch down.
     *
     * @note This function will be called periodically as long as the mouse
     * down or touch down remains.
     */
    const onDrag = (_, curPos) => {
        // The target position is the cursor point adjusted by the canvas offset.
        // The cursor position is relative to the viewport.
        // const sourcePos = ship.getCenter();
        const sourcePos = ship.getFront();
        const targetPos = new Point(curPos.x - canvas.offsetLeft, curPos.y - canvas.offsetTop);

        // Compute the difference vector between the cursor and the ship.
        const dx = targetPos.x - sourcePos.x;
        const dy = targetPos.y - sourcePos.y;

        // Determine the angle between the two points. Needs to be clamped to
        // [0..360] given the ship's orientation is clamped accordingly.
        let targetDeg = Math.atan2(dy, dx) * 180 / Math.PI;
        targetDeg %= 360;
        if (targetDeg < 0) {
            targetDeg += 360;
        }

        // Deetermine the shortest turn that would be necessary to line the
        // two points up diagonally, then clamp to [-180, 180].
        const shipDeg = ship.getOrient();
        let delta = targetDeg - shipDeg;
        if (delta > 180) {
            delta -= 360;
        }

        if (delta <= -180) {
            delta += 360;
        }

        // If we can turn (turn degrees > minimum turn amount), then perform a
        // turn to align our heading with the destination point.
        if (Math.abs(delta) < (180 - ship.getMinTurnAngle())) {
            if (delta < 0) {
                ship.rotateRight();
            } else {
                ship.rotateLeft();
            }

            // Return here so that we do not move until we are oriented
            // properly.
            return;
        }

        // Compute the length of the distance vector. If it is less than our
        // thrust distance, then no movement is needed.
        const distance = Math.sqrt(dx + dy);
        if (distance < ship.getMinThrustDistance()) {
            // Distance to move is less than the minimum thrust distance, so no
            // move is necessary.
            return;
        }

        ship.forward();
    };

    /**
     * @brief Callback invoked on each event loop tick.
     *
     * @details Responsible for moving the numbers around the canvas as well
     * as checking for collision with the ship.
     */
    const onTick = () => {
        const shipBounds = ship.getBounds();
        numbers.forEach((n) => {
            if (n.visible()) {
                n.move();
                if (rectIntersects(shipBounds, n.getBounds())) {
                    onCollision(n);
                }
            }
        });
    };

    /**
     * @brief Binds the event listeners.
     *
     * @returns {Captcha}
     */
    const bind = () => {
        // Add listeners to detect focus lost or gained.
        document.addEventListener("touchstart", onTouch);
        document.addEventListener("mousedown", onTouch);

        loop.addTickEvent(onTick);

        // Bind event loop events.
        const keyCodes = [
            KeyCodes.UP,
            KeyCodes.DOWN,
            KeyCodes.LEFT,
            KeyCodes.RIGHT,
            KeyCodes.W,
            KeyCodes.A,
            KeyCodes.S,
            KeyCodes.D,
        ];

        keyCodes.forEach((code) => {
            loop.addKeyEvent(code, onKeyPress, true);
        });
        loop.addMouseEvent(onDrag, true);
        loop.addTouchEvent(onDrag, true);
    };

    bind();
    refreshNumbers();
    overlay.set("Solve the Equation", "Use arrow keys, mouse or finger to move. Click anywhere to start.");
    overlay.show();

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
 * @brief Returns a boolean indicating if the two rectangles overlap.
 *
 * @param rectA {Rectangle} The first rectangle.
 * @param rectB {Rectangle} The second rectangle.
 *
 * @returns {Boolean} `true` if overlaps, otherwise `false`.
 */
const rectIntersects = (rectA, rectB) => {
    return !(
        (rectB.left > rectA.right) ||
        (rectB.right < rectA.left) ||
        (rectB.top > rectA.bottom) ||
        (rectB.bottom < rectA.top));
};

/**
 * @brief Generates an array satisfying specific constraints.
 *
 * @details The generated array satisfies the constraint that there is exactly
 * one set of three integers for which two of the integers sum to the third,
 * and for which no sum is larger than `maxSum`.
 *
 * @param arrayLength {Integer} Length of the array to generate.
 * @param maxSum      {Integer} Maximum sum of any three numbers.
 *
 * @return Array of length `arrayLength`.
 */
const generateSpecialArray = (arrayLength, maxSum) => {
    const getRandomInt = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    while (true) {
        // Build a candidate array of six integers in the range [1..99].
        let arr = [];
        for (let i = 0; i < arrayLength; i++) {
            arr.push(getRandomInt(1, maxSum - 1));
        }

        // Check that no triple sums to more than the specified maximum
        // sum.
        let ok = true;
        for (let i = 0; (i < arr.length) && ok; i++) {
            for (let j = i + 1; (j < arr.length) && ok; j++) {
                for (let k = j + 1; k < arr.length; k++) {
                    if ((arr[i] + arr[j] + arr[k]) >= maxSum) {
                        ok = false;
                        break;
                    }
                }
            }
        }

        if (!ok) {
            // Values do not satisfy the constraint, so try again.
            continue;
        }

        // Count the triples where two elements sum exactly to the third.
        let count = 0;
        for (let i = 0; i < arr.length; i++) {
            for (let j = i + 1; j < arr.length; j++) {
                for (let k = j + 1; k < arr.length; k++) {
                    const a = arr[i];
                    const b = arr[j];
                    const c = arr[k];
                    if ((a + b === c) || (a + c === b) || (b + c === a)) {
                        count++;
                    }
                }
            }
        }

        if (count === 1) {
            return arr;
        }
    }
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
