const TOUCH_EVENTS = ["mouseup", "touchend"];

/**
 * @brief Gift card types.
 */
const GiftCardType = Object.freeze({
    GOOGLE_PLAY: 0,
    TARGET: 1
});

/**
 * @brief Gift card DOM element.
 *
 * @param document  {DOM}           Document object model.
 * @param container {Element}       Containing DOM element.
 * @param type      {GiftCardType}  Type of gift card.
 * @param click     {Function}      Function to invoke when the gift card is clicked.
 */
const GiftCard = (document, container, type, click) => {
    const VALUES = [10, 25, 50];
    const TIMEOUT = 350;
    const LOGO_MODIFIER = 1.0;
    const MAX_LOGO_HEIGHT = 150;

    const template = document.getElementById("captcha-gift-card");
    const el = template.cloneNode(true);

    const value = el.querySelector(".captcha-gift-card-value");
    const code = el.querySelector(".captcha-gift-card-code");
    const logo = el.querySelector(".captcha-gift-card-logo");

    const self = {};

    let timer = null;
    let rendered = false;

    /**
     * @brief Touch event handler for the gift card element.
     *
     * @details Surfaces the click event to the provided callback function
     * if applicable.
     *
     * @apram ev {UIEvent} Touch event.
     */
    const onClick = (ev) => {
        if (click) {
            click(ev, self);
        }
    };

    /**
     * @brief Renders the element in the DOM.
     *
     * @param done {Function} Function to call on rendering complete.
     */
    const render = (done) => {
        if (rendered) {
            return;
        }

        el.id = "";
        rendered = true;

        while (logo.firstChild) {
            logo.removeChild(logo.lastChild);
        }

        let svg = null;
        const width = template.offsetWidth;
        const height = Math.min(MAX_LOGO_HEIGHT, template.offsetHeight * LOGO_MODIFIER);
        switch (type) {
            case GiftCardType.GOOGLE_PLAY:
                svg = document.getElementById("captcha-gp").cloneNode(true);
                svg.id = "";
                svg.style.width = width;
                svg.style.height = height;
                logo.appendChild(svg);
                break;

            case GiftCardType.TARGET:
                svg = document.getElementById("captcha-target").cloneNode(true);
                svg.id = "";
                svg.style.width = width;
                svg.style.height = height;
                logo.appendChild(svg);
                break;

            default:
                break;
        }

        // Generate a random redemption code.
        let newCode = "";
        for (let i = 0; i < 16;i ++) {
            if ((i > 0) && (i % 4 == 0)) {
                newCode += "-";
            }
            const digit = Math.floor(Math.random() * 10);
            newCode += digit.toString();
        }
        code.innerText = newCode;

        // Generate a random dollar amount.
        dollars = VALUES[Math.floor(Math.random() * VALUES.length)];
        value.innerText = `$${dollars}`;

        const header = document.getElementById("captcha-header");
        const offsetLeft = template.offsetLeft + template.offsetWidth + template.offsetLeft;
        const offsetTop = header.offsetTop + header.offsetHeight;
        const offsetX = template.offsetLeft + template.offsetWidth;

        el.style.position = "absolute";
        el.style.top = `${offsetTop}px`;
        el.style.left = `${offsetLeft}px`;
        el.style.visibility = "visible";
        container.appendChild(el);

        TOUCH_EVENTS.forEach((eventName) => {
            el.addEventListener(eventName, onClick);
        });

        // Perform the animation.
        requestAnimationFrame(() => {
            el.style.transform = `translateX(-${offsetX}px)`;
            el.style.webkitTransform = `translateX(-${offsetX}px)`;
            setTimeout(() => {
                done(self);
            }, TIMEOUT);
        });
    };

    /**
     * @brief Cleans up the gift card state and removes the element from the
     * DOM.
     */
    const remove = () => {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
        el.remove();
    };

    /**
     * @brief Hides the gift card.
     *
     * @param done {Function} Function to invoke when card is hidden;
     */
    const hide = (done) => {
        if (timer) {
            return;
        }

        const offsetX = template.offsetLeft + template.offsetWidth + el.offsetLeft + el.offsetWidth;
        requestAnimationFrame(() => {
            el.style.transform = `translateX(-${offsetX}px)`;
            el.style.webkitTransform = `translateX(-${offsetX}px)`;
            timer = setTimeout(() => {
                el.style.visibility = "hidden";
                remove();
                done(getId());
            }, TIMEOUT);
        });
    };

    /**
     * @brief Redeems the gift card.
     *
     * @param done {Function} Function to invoke when card animation is done.
     */
    const redeem = (done) => {
        if (timer) {
            return;
        }

        const offsetY = container.offsetHeight;
        requestAnimationFrame(() => {
            el.style.transform += ` translateY(${offsetY}px)`;
            el.style.webkitTransform += ` translateY(${offsetY}px)`;
            timer = setTimeout(() => {
                el.style.visibility = "hidden";
                remove();
                done(getValue());
            }, TIMEOUT);
        });
    };

    /**
     * @brief Returns if the gift card is the specified type.
     *
     * @param refType {GiftCardType} Type to check against.
     */
    const is = (refType) => {
        return type === refType;
    };

    /**
     * @brief Returns the unique ID of this gift card.
     */
    const getId = () => {
        return code.innerText;
    };

    /**
     * @brief Returns the value of the gift card.
     *
     * @return {Integer}
     */
    const getValue = () => {
        return dollars;
    };

    return (() => {
        self.render = render;
        self.getId = getId;
        self.getValue = getValue;
        self.hide = hide;
        self.remove = remove;
        self.is = is;
        self.redeem = redeem;
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
    const icon = document.createElement("div");
    const titleEl = document.createElement("h2");
    const subtitleEl = document.createElement("span");
    const image = document.createElement("img");
    const display = container.style.display;

    /**
     * @brief Renders the overlay.
     */
    const render = () => {
        icon.style.display = "none";
        icon.className = "captcha-icon";
        hide();
        container.appendChild(icon);
        container.appendChild(titleEl);
        container.appendChild(image);
        container.appendChild(subtitleEl);
        return this;
    }

    /**
     * @brief Returns the overlay DOM element.
     *
     * @return {Element}
     */
    const getElement = () => {
        return container;
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

    /**
     * @brief Sets the overlay text.
     *
     * @details The specified dictionary specifies how to format the overlay
     * and allows for:
     *   - title: Text to display as the title in the overlay.
     *   - text: Text to display in the body of the overlay.
     *   - image: Optional image to present in the overlay.
     *   - status: Optional overlay status (`failed` or `success`).
     *
     * @param options {Object} Dictionary specifying how to format the overlay.
     */
    const set = (options) => {
        titleEl.innerText = options.title || "";
        subtitleEl.innerHTML = options.text || "";
        if (options.image) {
            // Unload, then re-load the image. This is necessary to work around
            // quirks with webkit in Safari that will cause the animation to not
            // play.
            image.src = "";
            image.className = "";
            image.onload = (() => {
                image.className = "captcha-shake";
            });

            image.src = options.image;
            image.style.display = "inline-flex";
        } else {
            image.src = "";
            image.style.display = "none";
        }

        switch (options.status) {
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

            default:
                icon.style.display = "none";
                container.className = "captcha-overlay";
                break;
        }

        requestAnimationFrame(() => {
            show();
        });
    };

    return (() => {
        const self = {}
        self.render = render;
        self.set = set;
        self.hide = hide;
        self.show = show;
        self.getElement = getElement;
        return self;
    })();
};


/**
 * @brief Pop-up for balance added.
 *
 * @param document   {Document}  Document object model.
 * @param value      {Integer}   Amount of dollars added to balance.
 */
const CaptchaBalance = (document, value) => {
    const TIMEOUT = 1000;

    const template = document.getElementById("captcha-balance");
    const self = {};

    /**
     * @brief Renders the element into the DOM.
     */
    const render = () => {
        const el = template.cloneNode(true);
        el.id = "";
        el.style.visibility = "visible";

        const span = el.querySelector("span");
        span.innerText = `$${value} has been added to your balance!`;

        // Add the element to the DOM.
        template.parentNode.appendChild(el);

        // Animate the element into the DOM.
        requestAnimationFrame(() => {
            const footer = document.getElementById("captcha-footer");
            const offsetY = footer.offsetHeight + 5;
            el.style.transform = `translateY(-${offsetY}px)`;
            el.style.webkitTransform = `translateY(-${offsetY}px)`;

            setTimeout(() => {
                el.remove();
            }, TIMEOUT);
        });
    };

    return (() => {
        self.render = render;
        return self;
    })();
};


/**
 * @brief Captcha application.
 *
 * @param window   {Window}   Window object.
 * @param document {Document} Document object model.
 */
const Captcha = (window, document) => {
    const DEFAULT_TARGET_VALUE = 200;
    const DEFAULT_TIMER_VALUE = 20;
    const DEFAULT_MAX_GIFT_CARD_DURATION_S = 1;
    const DEFAULT_MIN_GIFT_CARD_DURATION_S = 0.5;

    const TIMER_REFRESH_INTERVAL_MS = 1000;

    const VALID_GIFT_CARD = GiftCardType.GOOGLE_PLAY;

    const overlay = CaptchaOverlay(document.getElementById("captcha-overlay"));
    const captchaTimer = document.getElementById("captcha-timer-count");
    const value = document.getElementById("captcha-total-value");
    const redeemButton = document.getElementById("captcha-redeem");

    const searchParams = new URLSearchParams(window.location.search);
    const targetValue = searchParams.get("amount") || DEFAULT_TARGET_VALUE;
    const captchaTimerSeconds = searchParams.get("timer") || DEFAULT_TIMER_VALUE;
    const maxGiftCardDurationSeconds = searchParams.get("maxDuration") || DEFAULT_MAX_GIFT_CARD_DURATION_S;
    const minGiftCardDurationSeconds = searchParams.get("minDuration") || DEFAULT_MIN_GIFT_CARD_DURATION_S;
    const expire = searchParams.get("expire") || false;

    let giftCard = null;
    let totalValue = 0;
    let done = false;
    let failed = false;
    let giftCardTimer = null;

    /**
     * @brief Returns the duration, in milliseconds, to show a gift card for
     * before hiding in.
     *
     * @returns {Integer}
     */
    const getGiftCardDuration = () => {
        // Reduce duration based on how close the user is to the target
        // amount.
        const initialDuration = maxGiftCardDurationSeconds * 1000;
        const thresholds = [0.25, 0.5, 0.75];
        let idx = 0;
        let duration = initialDuration;
        thresholds.forEach((threshold, idx) => {
            if (totalValue >= (targetValue * threshold)) {
                const multiplier = 1.0 - threshold;
                duration = initialDuration * multiplier;
            }
        });

        const minDuration = minGiftCardDurationSeconds * 1000;
        return Math.max(minDuration, duration);
    };

    /**
     * @brief Called on timer expiry.
     *
     * @details Check if the captcha has been completed.
     */
    const onExpiry = () => {
        clear();

        if (totalValue >= targetValue) {
            onSuccess();
        } else {
            onFailed();
        }
    };

    /**
     * @brief Called on successful captcha completion.
     */
    const onSuccess = () => {
        if (done) {
            return;
        }

        done = true;
        overlay.set({
            "title": "Success",
            "status": "success"
        });

        setTimeout(() => {
            window.top.postMessage("success", "*");
        }, 1000);
    }

    /**
     * @brief Called on failure.
     *
     * @details Failure happens if an invalid gift card is redeemed or if the
     * total amount is less than the target value on timer expiry.
     *
     * @param card {GiftCard} Optional invalid gift card that was redeemed.
     */
    const onFailed = (card) => {
        failed = true;

        clear();

        if (card) {
            // User redeemed when they were not supposed to.
            overlay.set({
                "title": "Do Not Redeem",
                "image": "./steve.png",
                "text": "Click anywhere to try again.",
                "status": "failed"
            });
        } else {
            // Timer expired but target value was not reached.
            overlay.set({
                "title": "Try Again",
                "text": `You failed to redeem at least $${targetValue}.`,
                "status": "failed"
            });
        }
    };

    /**
     * @brief Callback invoked when the redeem button is clicked.
     *
     * @param ev {UIEvent}  Click or touch event.
     * @param gc {GiftCard} Optional gift card (if directly clicked).
     */
    const onRedeem = (ev, gc) => {
        ev.stopPropagation();

        gc = gc || giftCard;
        if (gc == null) {
            return;
        }

        const valid = gc.is(VALID_GIFT_CARD);
        const gcValue = gc.getValue();

        if (!valid) {
            gc.remove();
            return onFailed(gc);
        }

        if (giftCardTimer) {
            clearTimeout(giftCardTimer);
            giftCardTimer = null;
        }

        gc.redeem((value) => {
            const balance = CaptchaBalance(document, value);
            balance.render();

            updateValue(value);

            if (!expire && (totalValue >= targetValue)) {
                onSuccess();
            } else {
                generateGiftCard();
            }
        });
    };

    /**
     * @brief Generates a new gift card.
     */
    const generateGiftCard = () => {
        const giftCardTypes = [
            GiftCardType.GOOGLE_PLAY,
            GiftCardType.TARGET
        ];
        const type = giftCardTypes[Math.floor(Math.random() * giftCardTypes.length)];
        const container = document.getElementById("captcha-content");

        if (giftCardTimer) {
            clearTimeout(giftCardTimer);
            giftCardTimer = null;
        }

        if (giftCard) {
            giftCard.remove();
            giftCard = null;
        }

        giftCard = GiftCard(document, container, type, onRedeem);
        giftCard.render((gc) => {
            updateButton(gc.is(VALID_GIFT_CARD));
            // Start a timer to hide the current gift card is not redeemed by the
            // the time the number of seconds has elapsed.
            giftCardTimer = setTimeout(() => {
                // Generate a new gift card once the current one is hidden.
                const gc = giftCard;
                if (gc) {
                    gc.hide(onGiftCardHidden);
                }
            }, getGiftCardDuration());
        });
    };

    /**
     * @brief Called when a gift card is hidden from the DOM.
     *
     * @details Generates and renders a new gift card in view.
     *
     * @param id {String} Identifier of the hidden gift card.
     */
    const onGiftCardHidden = (id) => {
        if (giftCard && (id == giftCard.getId())) {
            generateGiftCard();
        }
    };

    /**
     * @brief Callback invoked when the overlay is clicked.
     *
     * @details Initiates the animation to count down and start the captcha
     * event.
     *
     * @param ev {UIEvent} Click or touch event.
     */
    const onOverlayClicked = (ev) => {
        ev.stopPropagation();

        if (done) {
            return;
        } else if (failed) {
            failed = false;
            onPrompt();
            return;
        }

        overlay.hide();

        totalValue = 0;
        giftCard = null;
        updateValue(0);

        startCaptchaTimer();
        generateGiftCard();
    };

    /**
     * @brief Shows the initial prompt.
     */
    const onPrompt = () => {
        overlay.render();
        overlay.set({
            "title": "Complete the Captcha",
            "text": `Redeem at least $${targetValue} worth of git cards within the time limit.<br/> \
                     Click anywhere to begin.`
        });
    };

    /**
     * @brief Binds the event listeners.
     */
    const onBind = () => {
        TOUCH_EVENTS.forEach((eventName) => {
            overlay.getElement().addEventListener(eventName, onOverlayClicked);
            redeemButton.addEventListener(eventName, onRedeem);
        });
    };

    /**
     * @brief Updates the total dollar value shown in the captcha.
     *
     * @param amouont {Integer} Amount to add to the current total value.
     */
    const updateValue = (amount) => {
        totalValue += amount;
        value.innerText = `$${totalValue}`;
    };

    /**
     * @brief Updates the button show for redemption.
     *
     * @param redeem {Boolean} `true` for redeem.
     */
    const updateButton = (redeem) => {
        const span = redeemButton.querySelector("span");
        if (redeem) {
            redeemButton.className = "captcha-button captcha-redeem";
            span.innerText = "Redeem";
        } else {
            redeemButton.className = "captcha-button captcha-do-not-redeem";
            span.innerText = "Do Not Redeem";
        }
    };

    /**
     * @brief Starts the captcha timer.
     */
    const startCaptchaTimer = () => {
        if (captchaTimer.timer) {
            clearInterval(captchaTimer.timer);
        }

        captchaTimer.count = captchaTimerSeconds;
        captchaTimer.innerText = captchaTimerSeconds.toString();
        captchaTimer.timer = setInterval(() => {
            captchaTimer.count -= 1;
            captchaTimer.innerText = ((captchaTimer.count < 10) ? "0" : "") + captchaTimer.count.toString();
            if (captchaTimer.count == 0) {
                clearInterval(captchaTimer.timer);
                captchaTimer.timer = null;
                onExpiry();
            }
        }, TIMER_REFRESH_INTERVAL_MS);
    };

    /**
     * @brief Stops all running timers.
     */
    const stopTimers = () => {
        if (captchaTimer.timer) {
            clearInterval(captchaTimer.timer);
            captchaTimer.timer = null;
        }

        if (giftCardTimer) {
            clearTimeout(giftCardTimer);
            giftCardTimer = null;
        }
    }

    /**
     * @brief Cleaers all animated timers and components.
     */
    const clear = () => {
        if (giftCard) {
            giftCard.remove();
            giftCard = null;
        }

        updateButton(true);
        stopTimers();
    };

    onBind();
    onPrompt();

    return this;
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
