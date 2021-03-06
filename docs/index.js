(function () {
    'use strict';

    /**
     * Watcher for click, double-click, or long-click event for both mouse and touch
     * @example
     * import { clicked } from 'clicked'
     *
     * function handleClick()
     * {
     *    console.log('I was clicked.')
     * }
     *
     * const div = document.getElementById('clickme')
     * const c = clicked(div, handleClick, { thresshold: 15 })
     *
     * // change callback
     * c.callback = () => console.log('different clicker')
     *
     * // destroy
     * c.destroy()
     *
     * // using built-in querySelector
     * clicked('#clickme', handleClick2)
     *
     * // watching for all types of clicks
     * function handleAllClicks(e) {
     *     switch (e.type)
     *     {
     *         case 'clicked': ...
     *         case 'double-clicked': ...
     *         case 'long-clicked': ...
     *     }
     *
     *     // view UIEvent that caused callback
     *     console.log(e.event)
     * }
     * clicked('#clickme', handleAllClicks, { doubleClicked: true, longClicked: true })
     */

    /** @type {object} */
    const defaultOptions = {
        thresshold: 10,
        clicked: true,
        doubleClicked: false,
        doubleClickedTime: 300,
        longClicked: false,
        longClickedTime: 500,
        capture: false,
        clickDown: false
    };

    /**
     * @param {HTMLElement|string} element or querySelector entry (e.g., #id-name or .class-name)
     * @param {ClickedCallback} callback called after a click, double click, or long click is registered
     * @param {object} [options]
     * @param {number} [options.thresshold=10] if touch moves threshhold-pixels then the touch-click is cancelled
     * @param {boolean} [options.clicked=true] disable watcher for default clicked event
     * @param {boolean} [options.doubleClicked] enable watcher for double click
     * @param {number} [options.doubleClickedTime=500] wait time in millseconds for double click
     * @param {boolean} [options.longClicked] enable watcher for long click
     * @param {number} [options.longClickedTime=500] wait time for long click
     * @param {boolean} [options.clickDown] enable watcher for click start
     * @param {boolean} [options.capture]  events will be dispatched to this registered listener before being dispatched to any EventTarget beneath it in the DOM tree
     * @returns {Clicked}
     */
    function clicked(element, callback, options)
    {
        return new Clicked(element, callback, options)
    }

    class Clicked
    {
        constructor(element, callback, options)
        {
            if (typeof element === 'string')
            {
                element = document.querySelector(element);
                if (!element)
                {
                    console.warn(`Unknown element: document.querySelector(${element}) in clicked()`);
                    return
                }
            }
            this.options = Object.assign({}, defaultOptions, options);
            this.events = {
                mousedown: (e) => this.mousedown(e),
                mouseup: (e) => this.mouseup(e),
                mousemove: (e) => this.mousemove(e),
                touchstart: (e) => this.touchstart(e),
                touchmove: (e) => this.touchmove(e),
                touchcancel: (e) => this.cancel(e),
                touchend: (e) => this.touchend(e)
            };
            element.addEventListener('mousedown', this.events.mousedown, { capture: this.options.capture });
            element.addEventListener('mouseup', this.events.mouseup, { capture: this.options.capture });
            element.addEventListener('mousemove', this.events.mousemove, { capture: this.options.capture });
            element.addEventListener('touchstart', this.events.touchstart, { passive: true, capture: this.options.capture });
            element.addEventListener('touchmove', this.events.touchmove, { passive: true, capture: this.options.capture });
            element.addEventListener('touchcancel', this.events.touchcancel, { capture: this.options.capture});
            element.addEventListener('touchend', this.events.touchend, { capture: this.options.capture });
            this.element = element;
            this.callback = callback;
        }

        /**
         * removes event listeners added by Clicked
         */
        destroy()
        {
            this.element.removeEventListener('mousedown', this.events.mousedown);
            this.element.removeEventListener('mouseup', this.events.mouseup);
            this.element.removeEventListener('mousemove', this.events.mousemove);
            this.element.removeEventListener('touchstart', this.events.touchstart, { passive: true });
            this.element.removeEventListener('touchmove', this.events.touchmove, { passive: true });
            this.element.removeEventListener('touchcancel', this.events.touchcancel);
            this.element.removeEventListener('touchend', this.events.touchend);
        }

        touchstart(e)
        {
            if (this.down === true)
            {
                this.cancel();
            }
            else
            {
                if (e.touches.length === 1)
                {
                    this.handleDown(e.changedTouches[0].screenX, e.changedTouches[0].screenY);
                }
            }
        }

        pastThreshhold(x, y)
        {
            return Math.abs(this.lastX - x) > this.threshhold || Math.abs(this.lastY - y) > this.threshhold
        }

        touchmove(e)
        {
            if (this.down)
            {
                if (e.touches.length !== 1)
                {
                    this.cancel();
                }
                else
                {
                    const x = e.changedTouches[0].screenX;
                    const y = e.changedTouches[0].screenY;
                    if (this.pastThreshhold(x, y))
                    {
                        this.cancel();
                    }
                }
            }
        }

        /** cancel current event */
        cancel()
        {
            this.down = false;
            if (this.doubleClickedTimeout)
            {
                clearTimeout(this.doubleClickedTimeout);
                this.doubleClickedTimeout = null;
            }
            if (this.longClickedTimeout)
            {
                clearTimeout(this.longClickedTimeout);
                this.longClickedTimeout = null;
            }
        }

        touchend(e)
        {
            if (this.down)
            {
                e.preventDefault();
                this.handleClicks(e, e.pointerId);
            }
        }

        handleClicks(e)
        {
            if (this.options.doubleClicked)
            {
                this.doubleClickedTimeout = setTimeout(() => this.doubleClicked(e), this.options.doubleClickedTime);
            }
            else if (this.options.clicked)
            {
                this.callback({ event: e, type: 'clicked' });
            }
            if (this.longClickedTimeout)
            {
                clearTimeout(this.longClickedTimeout);
                this.longClickedTimeout = null;
            }
            this.down = false;
        }

        handleDown(e, x, y)
        {
            if (this.doubleClickedTimeout)
            {
                if (this.pastThreshhold(x, y))
                {
                    if (this.options.clicked)
                    {
                        this.callback({ event: e, type: 'clicked' });
                    }
                    this.cancel();
                }
                else
                {
                    this.callback({ event: e, type: 'double-clicked' });
                    this.cancel();
                }
            }
            else
            {
                this.lastX = x;
                this.lastY = y;
                this.down = true;
                if (this.options.longClicked)
                {
                    this.longClickedTimeout = setTimeout(() => this.longClicked(e), this.options.longClickedTime);
                }
                if (this.options.clickDown) {
                    this.callback({ event: e, type: 'click-down' });
                }
            }
        }

        longClicked(e)
        {
            this.longClikedTimeout = null;
            this.down = false;
            this.callback({ event: e, type: 'long-clicked' });
        }

        doubleClicked(e)
        {
            this.doubleClickedTimeout = null;
            this.callback({ event: e, type: 'double-clicked' });
        }

        mousedown(e)
        {
            if (this.down === true)
            {
                this.down = false;
            }
            else
            {
                this.handleDown(e, e.screenX, e.screenY);
            }
        }

        mousemove(e)
        {
            if (this.down)
            {
                const x = e.screenX;
                const y = e.screenY;
                if (this.pastThreshhold(x, y))
                {
                    this.cancel();
                }
            }
        }

        mouseup(e)
        {
            if (this.down)
            {
                e.preventDefault();
                this.handleClicks(e);
            }
        }
    }

    /**
     * Callback for
     * @callback Clicked~ClickedCallback
     * @param {UIEvent} event
     * @param {('clicked'|'double-clicked'|'long-clicked'|'click-down')} type
     */

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var eventemitter3 = createCommonjsModule(function (module) {

    var has = Object.prototype.hasOwnProperty
      , prefix = '~';

    /**
     * Constructor to create a storage for our `EE` objects.
     * An `Events` instance is a plain object whose properties are event names.
     *
     * @constructor
     * @private
     */
    function Events() {}

    //
    // We try to not inherit from `Object.prototype`. In some engines creating an
    // instance in this way is faster than calling `Object.create(null)` directly.
    // If `Object.create(null)` is not supported we prefix the event names with a
    // character to make sure that the built-in object properties are not
    // overridden or used as an attack vector.
    //
    if (Object.create) {
      Events.prototype = Object.create(null);

      //
      // This hack is needed because the `__proto__` property is still inherited in
      // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
      //
      if (!new Events().__proto__) prefix = false;
    }

    /**
     * Representation of a single event listener.
     *
     * @param {Function} fn The listener function.
     * @param {*} context The context to invoke the listener with.
     * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
     * @constructor
     * @private
     */
    function EE(fn, context, once) {
      this.fn = fn;
      this.context = context;
      this.once = once || false;
    }

    /**
     * Add a listener for a given event.
     *
     * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
     * @param {(String|Symbol)} event The event name.
     * @param {Function} fn The listener function.
     * @param {*} context The context to invoke the listener with.
     * @param {Boolean} once Specify if the listener is a one-time listener.
     * @returns {EventEmitter}
     * @private
     */
    function addListener(emitter, event, fn, context, once) {
      if (typeof fn !== 'function') {
        throw new TypeError('The listener must be a function');
      }

      var listener = new EE(fn, context || emitter, once)
        , evt = prefix ? prefix + event : event;

      if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
      else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
      else emitter._events[evt] = [emitter._events[evt], listener];

      return emitter;
    }

    /**
     * Clear event by name.
     *
     * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
     * @param {(String|Symbol)} evt The Event name.
     * @private
     */
    function clearEvent(emitter, evt) {
      if (--emitter._eventsCount === 0) emitter._events = new Events();
      else delete emitter._events[evt];
    }

    /**
     * Minimal `EventEmitter` interface that is molded against the Node.js
     * `EventEmitter` interface.
     *
     * @constructor
     * @public
     */
    function EventEmitter() {
      this._events = new Events();
      this._eventsCount = 0;
    }

    /**
     * Return an array listing the events for which the emitter has registered
     * listeners.
     *
     * @returns {Array}
     * @public
     */
    EventEmitter.prototype.eventNames = function eventNames() {
      var names = []
        , events
        , name;

      if (this._eventsCount === 0) return names;

      for (name in (events = this._events)) {
        if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
      }

      if (Object.getOwnPropertySymbols) {
        return names.concat(Object.getOwnPropertySymbols(events));
      }

      return names;
    };

    /**
     * Return the listeners registered for a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @returns {Array} The registered listeners.
     * @public
     */
    EventEmitter.prototype.listeners = function listeners(event) {
      var evt = prefix ? prefix + event : event
        , handlers = this._events[evt];

      if (!handlers) return [];
      if (handlers.fn) return [handlers.fn];

      for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
        ee[i] = handlers[i].fn;
      }

      return ee;
    };

    /**
     * Return the number of listeners listening to a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @returns {Number} The number of listeners.
     * @public
     */
    EventEmitter.prototype.listenerCount = function listenerCount(event) {
      var evt = prefix ? prefix + event : event
        , listeners = this._events[evt];

      if (!listeners) return 0;
      if (listeners.fn) return 1;
      return listeners.length;
    };

    /**
     * Calls each of the listeners registered for a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @returns {Boolean} `true` if the event had listeners, else `false`.
     * @public
     */
    EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
      var evt = prefix ? prefix + event : event;

      if (!this._events[evt]) return false;

      var listeners = this._events[evt]
        , len = arguments.length
        , args
        , i;

      if (listeners.fn) {
        if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

        switch (len) {
          case 1: return listeners.fn.call(listeners.context), true;
          case 2: return listeners.fn.call(listeners.context, a1), true;
          case 3: return listeners.fn.call(listeners.context, a1, a2), true;
          case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
          case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
          case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
        }

        for (i = 1, args = new Array(len -1); i < len; i++) {
          args[i - 1] = arguments[i];
        }

        listeners.fn.apply(listeners.context, args);
      } else {
        var length = listeners.length
          , j;

        for (i = 0; i < length; i++) {
          if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

          switch (len) {
            case 1: listeners[i].fn.call(listeners[i].context); break;
            case 2: listeners[i].fn.call(listeners[i].context, a1); break;
            case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
            case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
            default:
              if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
                args[j - 1] = arguments[j];
              }

              listeners[i].fn.apply(listeners[i].context, args);
          }
        }
      }

      return true;
    };

    /**
     * Add a listener for a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @param {Function} fn The listener function.
     * @param {*} [context=this] The context to invoke the listener with.
     * @returns {EventEmitter} `this`.
     * @public
     */
    EventEmitter.prototype.on = function on(event, fn, context) {
      return addListener(this, event, fn, context, false);
    };

    /**
     * Add a one-time listener for a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @param {Function} fn The listener function.
     * @param {*} [context=this] The context to invoke the listener with.
     * @returns {EventEmitter} `this`.
     * @public
     */
    EventEmitter.prototype.once = function once(event, fn, context) {
      return addListener(this, event, fn, context, true);
    };

    /**
     * Remove the listeners of a given event.
     *
     * @param {(String|Symbol)} event The event name.
     * @param {Function} fn Only remove the listeners that match this function.
     * @param {*} context Only remove the listeners that have this context.
     * @param {Boolean} once Only remove one-time listeners.
     * @returns {EventEmitter} `this`.
     * @public
     */
    EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
      var evt = prefix ? prefix + event : event;

      if (!this._events[evt]) return this;
      if (!fn) {
        clearEvent(this, evt);
        return this;
      }

      var listeners = this._events[evt];

      if (listeners.fn) {
        if (
          listeners.fn === fn &&
          (!once || listeners.once) &&
          (!context || listeners.context === context)
        ) {
          clearEvent(this, evt);
        }
      } else {
        for (var i = 0, events = [], length = listeners.length; i < length; i++) {
          if (
            listeners[i].fn !== fn ||
            (once && !listeners[i].once) ||
            (context && listeners[i].context !== context)
          ) {
            events.push(listeners[i]);
          }
        }

        //
        // Reset the array, or remove it completely if we have no more listeners.
        //
        if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
        else clearEvent(this, evt);
      }

      return this;
    };

    /**
     * Remove all listeners, or those of the specified event.
     *
     * @param {(String|Symbol)} [event] The event name.
     * @returns {EventEmitter} `this`.
     * @public
     */
    EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
      var evt;

      if (event) {
        evt = prefix ? prefix + event : event;
        if (this._events[evt]) clearEvent(this, evt);
      } else {
        this._events = new Events();
        this._eventsCount = 0;
      }

      return this;
    };

    //
    // Alias methods names because people roll like that.
    //
    EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
    EventEmitter.prototype.addListener = EventEmitter.prototype.on;

    //
    // Expose the prefix.
    //
    EventEmitter.prefixed = prefix;

    //
    // Allow `EventEmitter` to be imported as module namespace.
    //
    EventEmitter.EventEmitter = EventEmitter;

    //
    // Expose the module.
    //
    {
      module.exports = EventEmitter;
    }
    });

    var STYLES = {
    	".falldown-main": {
    	display: "flex"
    },
    	".falldown-label": {
    	cursor: "pointer",
    	"margin-right": "0.5em"
    },
    	".falldown-selection": {
    	cursor: "pointer",
    	border: "1px dotted black",
    	position: "relative",
    	display: "flex"
    },
    	".falldown-label:empty": {
    	margin: "0"
    },
    	".falldown-box": {
    	position: "absolute",
    	border: "1px solid black",
    	background: "white",
    	"box-shadow": "0 0 0.25rem rgba(0, 0, 0, 0.25)",
    	padding: "1rem",
    	display: "none",
    	width: "fit-content",
    	"white-space": "nowrap",
    	"z-index": "2",
    	overflow: "auto",
    	"-webkit-overflow-scrolling": "touch"
    },
    	".falldown-select": {
    	color: "white",
    	background: "black"
    },
    	".falldown-arrow": {
    	"margin-left": "0.5rem",
    	display: "inline-block",
    	"user-select": "none",
    	"align-self": "center"
    },
    	".falldown-option": {
    	cursor: "pointer"
    },
    	".falldown-option:hover": {
    	background: "rgba(0, 0, 0, 0.25)"
    },
    	".falldown-cursor": {
    	background: "rgba(0, 0, 0, 0.5)",
    	color: "white"
    },
    	".falldown-selected": {
    	display: "inline-block",
    	"white-space": "nowrap"
    },
    	".falldown-selection:focus": {
    	outline: "none"
    },
    	".falldown-focus": {
    	border: "1px solid black"
    }
    };

    class FallDown extends eventemitter3
    {
        /**
         * @param {object} options
         * @param {(HTMLElement|string)} [options.element] use preexisting element for FallDown with optional data in attributes (provide either options.element or options.parent)
         * @param {HTMLElement} [options.parent] use thsi parent to create the FallDown (provide either options.element or options.parent)
         * @param {string[]|FallDownElement[]} [options.options] list of values for FallDown box
         * @param {string} [options.separatorOptions=","] separator used to split attribute data-options from options.element
         * @param {(string|string[]|FallDownElement[]|FallDownElement)} [options.selected=''] default value (may also be in the form of "item1,item2,item3" where ","=options.separatorOptions)
         * @param {string} [options.label] label for FallDown box
         * @param {string} [options.size] set this to force the editbox to have a certain size regardless of content--this size does not include the arrow size, if any (e.g., '5rem')
         * @param {string} [options.minSize=longest] longest=size to largest option; otherwise use this as minWidth (e.g., '5rem')
         * @param {boolean} [options.allowEdit] can type entry
         * @param {string} [options.multipleName] when set and more than 1 item is selected then text changes to "n items" where n is the number selected and items=multipleName
         * @param {string} [options.multipleSeparator=", "] when showing multiple options on the selector, use this to separate the options
         * @param {(object|boolean)} [options.arrow=true] change open and close arrows; set to false to remove
         * @param {string} [options.arrow.up=&#9652;]
         * @param {string} [options.arrow.down=&#9662;]
         * @param {boolean} [options.addCSS] append styles directly to DOM instead of using stylesheet
         * @param {boolean} [options.addCSSClassName=falldown] change class names of added CSS styles (useful if you want multiple falldown boxes on same page with different styles)
         * @param {object} [options.styles] changes default styles if options.addCSS=true
         * @param {object} [options.styles.main]
         * @param {object} [options.styles.label]
         * @param {object} [options.styles.selection]
         * @param {object} [options.styles.selected]
         * @param {object} [options.styles.arrow]
         * @param {object} [options.styles.box]
         * @param {object} [options.styles.select]
         * @param {object} [options.styles.option]
         * @param {object} [options.styles.cursor]
         * @param {object} [options.styles.focus]
         * @param {object} [options.classNames] change default class names of elements; don't use if options.addCSS=true
         * @param {string} [options.classNames.main=falldown-main]
         * @param {string} [options.classNames.label=falldown-label]
         * @param {string} [options.classNames.selection=falldown-selection]
         * @param {string} [options.classNames.selected=falldown-selected]
         * @param {string} [options.classNames.arrow=falldown-arrow]
         * @param {string} [options.classNames.box=falldown-box]
         * @param {string} [options.classNames.select=falldown-select]
         * @param {string} [options.classNames.option=falldown-option]
         * @param {string} [options.classNames.cursor=falldown-cursor]
         * @param {string} [options.classNames.focus=falldown-focus]
         * @fires select
         */
        constructor(options = {})
        {
            super();
            if (!FallDown.setup)
            {
                window.addEventListener('resize', FallDown.resize);
                window.addEventListener('keydown', FallDown.keydown);
                FallDown.setup = true;
            }
            /**
             * Main element
             * @type HTMLElement
             */
            if (options.element)
            {
                if (typeof options.element === 'string')
                {
                    this.element = document.querySelector(options.element);
                    if (!this.element)
                    {
                        console.warn(`Falldown could not find document.querySelector(${options.element})`);
                        return
                    }
                }
                else
                {
                    this.element = options.element;
                }
            }
            else
            {
                this.element = document.createElement('div');
            }
            if (options.addCSS || this.element.getAttribute('data-add-css'))
            {
                this.addStyles(options);
            }
            this.options = options;
            this.setupOptions();
            this.element.classList.add(options.classNames.main);
            let s = `<div class="${options.classNames.label}">${options.label}</div>` +
                `<div class="${options.classNames.selection}" tabindex="0">` +
                `<div class="${options.classNames.selected}"></div>` +
                (options.arrow ? `<div class="${options.classNames.arrow}">${options.arrow.down}</div>` : '') +
                `<div class="${options.classNames.box}">`;
            this.optionsToFallDownOptions(options);
            for (let option of this.falldown)
            {
                s += `<div class="${options.classNames.option}${option.selected ? ` ${options.classNames.select}` : ''}">${option.html}</div>`;
            }
            s += '</div></div>';
            this.element.innerHTML = s;
            /**
             * Whether dropdown box is showing
             * @type boolean
             */
            this.showing = false;
            this.label = this.element.querySelector('.' + options.classNames.label);
            this.selection = this.element.querySelector('.' + options.classNames.selection);
            this.selection.setAttribute('tabindex', this.selection.getAttribute('tabindex') || 0);
            this.selected = this.selection.querySelector('.' + options.classNames.selected);
            this.arrow = this.element.querySelector('.' + options.classNames.arrow);
            this.box = this.selection.querySelector('.' + options.classNames.box);
            if (options.parent)
            {
                options.parent.appendChild(this.element);
            }
            const elements = this.box.querySelectorAll('.' + options.classNames.option);
            for (let i = 0; i < elements.length; i++)
            {
                clicked(elements[i], () =>
                {
                    this.cursorActive = false;
                    this.emit('select', this.select(i));
                    if (this.options.multiple)
                    {
                        this.clearCursor();
                    }
                    else
                    {
                        this.close();
                    }
                });
            }
            this.cursor = null;
            this.options = options;
            clicked(this.label, () => this.toggle(), { clicked: false, clickDown: true });
            if (this.arrow)
            {
                clicked(this.arrow, () => this.toggle(), { clicked: false, clickDown: true });
            }
            clicked(this.selected, () => this.toggle(), { clicked: false, clickDown: true });
            this.selection.addEventListener('focus', () =>
            {
                this.focused = true;
                this.selection.classList.add(this.options.classNames.focus);
                FallDown.active = this;
            });
            this.selection.addEventListener('blur', () => this.blur());
            this.box.style.display = 'block';
            if (this.options.size)
            {
                this.selected.style.width = this.options.size;
                this.selected.style.overflow = 'hidden';
            }
            else if (this.options.minSize === 'longest')
            {
                let longest = 0;
                for (let i = 0; i < this.box.childNodes.length; i++)
                {
                    const width = this.box.childNodes[i].offsetWidth;
                    longest = width > longest ? width : longest;
                    this.selected.style.minWidth = longest + 'px';
                }
            }
            else
            {
                this.selected.style.minWidth = this.options.minSize;
            }
            if (!options.allowEdit)
            {
                this.selected.style.userSelect = 'none';
            }
            this.showSelection();
            this.box.style.display = 'none';
        }

        blur()
        {
            if (this.showing)
            {
                this.focused = false;
                this.close();
                this.selection.classList.remove(this.options.classNames.focus);
                if (FallDown.active === this)
                {
                    FallDown.active = null;
                }
            }
        }

        /** toggle the falldown box open or closed */
        toggle()
        {
            if (this.showing)
            {
                this.close();
            }
            else
            {
                this.open();
            }
        }

        optionsToFallDownOptions(options)
        {
            /**
             * list of items in falldown box
             * @type {FallDownElement[]}
             */
            this.falldown = [];
            let selected = [];
            if (options.selected)
            {
                if (Array.isArray(options.selected))
                {
                    if (typeof options.selected[0] === 'string' || !isNaN(options.selected[0]))
                    {
                        selected = options.selected;
                    }
                    else
                    {
                        for (let item of options.selected)
                        {
                            selected.push(item.value);
                        }
                    }
                }
                else if (typeof options.selected === 'string' || !isNaN(options.selected))
                {
                    if (options.selected.indexOf(options.separatorOptions) !== -1)
                    {
                        selected = options.selected.split(options.separatorOptions);
                    }
                    else
                    {
                        selected.push(options.selected);
                    }
                }
                else
                {
                    selected.push(options.selected.value);
                }
            }
            for (let i = 0; i < options.options.length; i++)
            {
                const option = options.options[i];
                if (typeof option === 'string' || !isNaN(option))
                {
                    this.falldown.push({ value: option, html: option, selected: selected.indexOf(option) !== -1 });
                }
                else
                {
                    this.falldown.push(option);
                    option.selected = option.selected || selected.indexOf(option.value) !== -1;
                }
            }
        }

        /**
         * returns current value (or array of values)
         * @return (string|string[])
         */
        get value()
        {
            const list = [];
            for (let item of this.falldown)
            {
                if (item.selected)
                {
                    list.push(item.value);
                }
            }
            if (this.options.multiple)
            {
                return list
            }
            else
            {
                return list[0]
            }
        }

        setupOptions()
        {
            const options = this.options;
            const element = this.element;
            options.selected = options.selected || element.getAttribute('data-selected') || '';
            const dataOptions = element.getAttribute('data-options');
            options.options = options.options || (dataOptions ? dataOptions.split(options.separatorOptions || ',') : []);
            options.label = options.label || element.getAttribute('data-label') || '';
            options.multiple = options.multiple || element.getAttribute('data-multiple');
            options.multipleName = options.multipleName || element.getAttribute('data-multiple-name');
            options.arrow = typeof options.arrow === 'undefined' ? { up: '&#9652', down: '&#9662;' } : options.arrows;
            options.minSize = options.minSize || element.getAttribute('data-minsize') || 'longest';
            if (!options.classNames)
            {
                options.classNames = {};
            }
            options.classNames.main = options.classNames.main || 'falldown-main';
            options.classNames.label = options.classNames.label || 'falldown-label';
            options.classNames.selection = options.classNames.selection || 'falldown-selection';
            options.classNames.box = options.classNames.box || 'falldown-box';
            options.classNames.select = options.classNames.select || 'falldown-select';
            options.classNames.selected = options.classNames.selected || 'falldown-selected';
            options.classNames.arrow = options.classNames.arrow || 'falldown-arrow';
            options.classNames.option = options.classNames.option || 'falldown-option';
            options.classNames.cursor = options.classNames.cursor || 'falldown-cursor';
            options.classNames.focus = options.classNames.focus || 'falldown-focus';
            if (options.addCSSClassName)
            {
                for (let key in options.classNames)
                {
                    options.classNames[key] = options.classNames[key].replace('falldown', options.addCSSClassName);
                }
            }
        }

        addStyles(options)
        {
            options.styles = options.styles || {};
            let s = '';
            for (let selector in STYLES)
            {
                const selectorName = options.addCSSClassName ? selector.replace('falldown', options.addCSSClassName) : selector;
                const simple = selector.replace('.falldown-', '');
                s += selectorName + '{';
                for (let label in STYLES[selector])
                {
                    const replace = options.styles[simple];
                    if (!replace || !replace[label])
                    {
                        s += label + ':' + STYLES[selector][label] + ';';
                    }
                }
                for (let label in options.styles[simple])
                {
                    s += label + ':' + options.styles[simple][label] + ';';
                }
                s += '}';
            }
            const style = document.createElement('style');
            style.innerText = s;
            document.head.appendChild(style);
        }

        /**
         * open falldown box
         */
        open()
        {
            if (!this.showing)
            {
                this.box.style.display = 'block';
                if (this.options.arrow)
                {
                    this.arrow.innerHTML = this.options.arrow.up;
                }
                this.resizeBox();
                FallDown.active = this;
                this.cursor = null;
                this.showing = true;
                this.selection.focus();
            }
        }

        resizeBox()
        {
            const width = window.innerWidth;
            const height = window.innerHeight;
            let box = this.box.getBoundingClientRect();
            const selection = this.selected.getBoundingClientRect();
            this.box.style.maxHeight = 'unset';
            if (selection.top + selection.height / 2 > height / 2)
            {
                this.box.style.bottom = this.selection.offsetHeight + 'px';
                this.box.style.top = 'unset';
                const box = this.box.getBoundingClientRect();
                if (box.top < 0)
                {
                    const style = window.getComputedStyle(this.box);
                    const spacing = parseFloat(style.marginLeft) + parseFloat(style.marginRight) + parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) + parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
                    this.box.style.maxHeight = box.height + box.top - spacing + 'px';
                }
            }
            else
            {
                this.box.style.top = this.selection.offsetHeight + 'px';
                this.box.style.bottom = 'unset';
                const box = this.box.getBoundingClientRect();
                if (box.bottom > height)
                {
                    const style = window.getComputedStyle(this.box);
                    const spacing = parseFloat(style.marginTop) + parseFloat(style.marginBottom) + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
                    this.box.style.maxHeight = height - box.top - spacing + 'px';
                }
            }
            this.box.style.width = 'fit-content';
            if (selection.left >= width / 2)
            {
                this.box.style.right = 0;
                this.box.style.left = 'unset';
                box = this.box.getBoundingClientRect();
                if (box.left < 0)
                {
                    this.box.style.right = box.left + 'px';
                    this.box.style.left = 'unset';
                }
            }
            else
            {
                this.box.style.left = 0;
                this.box.style.right = 'unset';
                box = this.box.getBoundingClientRect();
                if (box.right >= width)
                {
                    this.box.style.left = width - box.right + 'px';
                    this.box.style.right = 'unset';
                }
            }
            const lastCheck = this.box.getBoundingClientRect();
            if (lastCheck.left < 0 || lastCheck.right > window.innerWidth)
            {
                const check = this.element.getBoundingClientRect();
                this.box.style.width = 'calc(100vw - 2rem - 4px)';
                this.box.style.left = -check.left + 'px';
                this.box.style.right = 'auto';
            }
        }

        /**
         * close falldown box
         */
        close()
        {
            if (this.showing)
            {
                this.clearCursor();
                this.box.style.display = 'none';
                this.selection.classList.remove(this.options.classNames.focus);
                if (this.options.arrow)
                {
                    this.arrow.innerHTML = this.options.arrow.down;
                }
                this.showing = false;
            }
        }

        setCursor(i)
        {
            if (this.cursorActive)
            {
                this.clearCursor();
                if (i === this.box.childNodes.length)
                {
                    i = 0;
                }
                else if (i === -1)
                {
                    i = this.box.childNodes.length - 1;
                }
                this.cursor = i;
                this.box.childNodes[this.cursor].classList.add(this.options.classNames.cursor);
                this.scrollIntoBoxView(this.box.childNodes[this.cursor]);
            }
        }

        // TODO: does not work properly when scrolling up :(
        scrollIntoBoxView(element)
        {
            const bounding = element.getBoundingClientRect();
            if (bounding.top < 0)
            {
                this.box.scrollTop -= bounding.top;
            }
            else if (bounding.bottom > window.innerHeight)
            {
                this.box.scrollTop -= window.innerHeight - bounding.bottom;
            }
        }

        clearCursor()
        {
            if (this.cursor !== null)
            {
                this.box.childNodes[this.cursor].classList.remove(this.options.classNames.cursor);
            }
        }

        /**
         * force selection of options based on value (clearing the remaining options)
         * @param {*} input or array of values to select
         */
        force(input)
        {
            if (this.options.multiple)
            {
                for (let i = 0; i < this.falldown.length; i++)
                {
                    if (input.indexOf(i) !== -1)
                    {
                        this.box.childNodes[i].classList.add(this.options.classNames.select);
                        this.falldown[i].selected = true;
                    }
                    else
                    {
                        this.box.childNodes[i].classList.remove(this.options.classNames.select);
                        this.falldown[i].selected = false;
                    }
                }
                this.showSelection();
            }
            else
            {
                for (let i = 0; i < this.falldown.length; i++)
                {
                    if (this.falldown[i].value === input)
                    {
                        this.box.childNodes[i].classList.add(this.options.classNames.select);
                        this.falldown[i].selected = true;
                        this.selection.innerHTML = input;
                    }
                    else
                    {
                        this.box.childNodes[i].classList.remove(this.options.classNames.select);
                        this.falldown[i].selected = false;
                    }
                }
                this.showSelection();
            }
        }

        /**
         * remove selected option
         * @param {number} index
         */
        remove(index)
        {
            this.box.childNodes[index].classList.remove(this.options.classNames.select);
            this.falldown[index].selected = false;
            return this.showSelection()
        }

        showSelection()
        {
            const list = [];
            for (let i = 0; i < this.falldown.length; i++)
            {
                if (this.falldown[i].selected)
                {
                    list.push(this.falldown[i].html);
                }
            }
            if (list.length > 1)
            {
                if (this.options.multipleName)
                {
                    this.selected.innerHTML = list.length + this.options.multipleName;
                }
                else
                {
                    let s = '';
                    for (let i = 0; i < list.length - 1; i++)
                    {
                        s += list[i] + (this.options.multipleSeparator || ', ');
                    }
                    this.selected.innerHTML = s + list[list.length - 1];
                }
            }
            else if (list.length === 1)
            {
                this.selected.innerHTML = list[0];
            }
            else
            {
                this.selected.innerHTML = '';
            }
            return list
        }

        /**
         * clear all selections
         */
        clear()
        {
            for (let i = 0; i < this.falldown.length; i++)
            {
                this.box.childNodes[i].classList.remove(this.options.classNames.select);
                this.falldown[i].selected = false;
            }
            this.showSelection();
        }

        /**
         * select option by HTML
         * @param {string} name
         */
        selectByHTML(html)
        {
            for (let i = 0; i < this.falldown.length; i++)
            {
                if (this.falldown.html === html)
                {
                    return this.select(i)
                }
            }
        }

        /**
         * select option by index
         * @param {number} index
         */
        select(index)
        {
            if (this.cursor)
            {
                this.clearCursor();
            }
            if (this.options.multiple)
            {
                const changed = this.falldown[index];
                changed.selected = !changed.selected;
                this.box.childNodes[index].classList.toggle(this.options.classNames.select);
                this.showSelection();
                this.setCursor(index);
                return { changed, value: this.value, falldown: this }
            }
            else
            {
                for (let i = 0; i < this.falldown.length; i++)
                {
                    if (i === index)
                    {
                        this.box.childNodes[i].classList.add(this.options.classNames.select);
                        this.falldown[i].selected = true;
                    }
                    else
                    {
                        this.box.childNodes[i].classList.remove(this.options.classNames.select);
                        this.falldown[i].selected = false;
                    }
                }
                this.showSelection();
                return { changed: this.falldown[index], value: this.value, falldown: this }
            }
        }

        /**
         * get index (or list of indices) for selected value(s)
         * @return (number|number[])
         */
        getIndex()
        {
            const list = [];
            for (let i = 0; i < this.falldown.length; i++)
            {
                if (this.falldown[i].selected)
                {
                    list.push(i);
                }
            }
            if (this.options.multiple)
            {
                return list
            }
            else
            {
                return list.length ? list[0] : null
            }
        }

        selectDelta(delta, unset)
        {
            if (this.options.multiple)
            {
                this.setCursor(this.cursor === null ? 0 : this.cursor + delta);
            }
            else
            {
                let index = this.getIndex();
                if (index === null)
                {
                    index = unset;
                }
                else
                {
                    index += delta;
                    index = index < 0 ? this.falldown.length + index : index;
                    index = index >= this.falldown.length ? index - this.falldown.length : index;
                }
                this.box.childNodes[index].scrollIntoView();
                this.emit('select', this.select(index));
            }
        }

        static cancel()
        {
            const active = FallDown.active;
            if (active && active.showing)
            {
                active.close();
            }
        }

        static keydown(e)
        {
            const active = FallDown.active;
            if (active)
            {
                switch (e.key)
                {
                    case 'ArrowDown':
                        active.cursorActive = true;
                        if (!active.showing)
                        {
                            active.open();
                        }
                        else
                        {
                            active.selectDelta(1, 0);
                        }
                        e.preventDefault();
                        break

                    case 'ArrowUp':
                        active.cursorActive = true;
                        if (!active.showing)
                        {
                            active.open();
                        }
                        else
                        {
                            active.selectDelta(-1, active.box.childNodes.length - 1);
                        }
                        e.preventDefault();
                        break

                    case 'Space':
                    case 'Enter':
                    case ' ':
                        active.cursorActive = true;
                        if (!active.showing)
                        {
                            active.open();
                        }
                        else
                        {
                            if (active.options.multiple)
                            {
                                active.emit('select', active.select(active.cursor));
                                if (!active.options.multiple)
                                {
                                    active.close();
                                }
                            }
                            else
                            {
                                active.close();
                            }
                        }
                        e.preventDefault();
                        break

                    case 'Escape':
                        active.cursorActive = false;
                        active.close();
                        e.preventDefault();
                        break
                }
            }
        }

        /**
         * load falldown on all elements with the proper className
         * @param {string} className=falldown type convert
         */
        static load(className = 'falldown')
        {
            const divs = document.querySelectorAll('.' + className);
            for (let i = 0; i < divs.length; i++)
            {
                new FallDown({ element: divs[i] });
            }
        }

        static resize()
        {
            const active = FallDown.active;
            if (active && active.showing)
            {
                active.resizeBox();
            }
        }
    }

    function demo()
    {
        /** begin-test */
        new FallDown({
            parent: document.querySelector('.demo-1'),
            label: 'Single selection:',
            options: [
                'blue',
                'green',
                'purple',
                'yellow'
            ],
            addCSS: true,
            addCSSClassName: 'demo-1'
        });
        /** end-test */

        /** begin-test */
        new FallDown({
            element: '.demo-2',
            label: 'Single selection with styles:',
            options: [
                'options 1',
                'options 2',
                'options 3',
                'options 4',
                'options 5'
            ],
            selected: 'options 4',
            styles: {
                main: {
                    'color': 'green'
                },
                box: {
                    background: 'yellow',
                    'border-radius': '0.5rem',
                },
                label: {
                    padding: '0.5rem 0 0.5rem 0.5rem'
                },
                selection: {
                    'border-radius': '0.5rem',
                    padding: '0.5rem'
                }
            },
            addCSS: true,
            addCSSClassName: 'demo-2'
        });
        /** end-test */

        /** begin-test */
        new FallDown({
            element: document.querySelector('.demo-3'),
            label: 'Single selection with stylesheet',
            options: [
                'options 1',
                'options 2',
                'options 3',
                'options 4',
                'options 5'
            ],
            selected: 'options 1'
        });
        /** end-test */

        /** begin-test */
        document.querySelector('.demo-4').innerHTML = `
        <div class="falldown"
            data-options="apple,pear,grapes,pineapple"
            data-selected="pineapple"
            data-label="Multiple selection using data-attributes"
            data-multiple=true>
        </div>
    `;
        FallDown.load();
        /** end-test */

        /** begin-test */
        const options = [];
        for (let i = 0; i < 30; i++)
        {
            options.push('lots of options ' + i);
        }
        new FallDown({
            parent: document.querySelector('.demo-5'),
            label: 'Multiple selection without showing long list:',
            options,
            selected: 'options 2',
            multiple: 'name',
            multipleName: ' opts'
        });
        /** end-test */

        /** begin-test */
        new FallDown({
            parent: document.querySelector('.demo-6'),
            label: 'No arrow, single selection:',
            options: [
                'blue',
                'green',
                'purple',
                'yellow'
            ],
            arrow: false
        });
        /** end-test */

    }

    window.onload = demo;

}());
//# sourceMappingURL=index.js.map
