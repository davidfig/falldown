const clicked = require('clicked')
const Events = require('eventemitter3')

const STYLES = require('./styles.json')

class FallDown extends Events
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
        super()
        if (!FallDown.setup)
        {
            window.addEventListener('resize', FallDown.resize)
            // window.addEventListener('scroll', FallDown.resize)
            window.addEventListener('keydown', FallDown.keydown)
            FallDown.setup = true
        }
        /**
         * Main element
         * @type HTMLElement
         */
        if (options.element)
        {
            if (typeof options.element === 'string')
            {
                this.element = document.querySelector(options.element)
                if (!this.element)
                {
                    console.warn(`Falldown could not find document.querySelector(${options.element})`)
                    return
                }
            }
            else
            {
                this.element = options.element
            }
        }
        else
        {
            this.element = document.createElement('div')
        }
        if (options.addCSS || this.element.getAttribute('data-add-css'))
        {
            this.addStyles(options)
        }
        this.options = options
        this.setupOptions()
        this.element.classList.add(options.classNames.main)
        let s = `<div class="${options.classNames.label}">${options.label}</div>` +
            `<div class="${options.classNames.selection}" tabindex="0">` +
            `<div class="${options.classNames.selected}"></div>` +
            (options.arrow ? `<div class="${options.classNames.arrow}">${options.arrow.down}</div>` : '') +
            `<div class="${options.classNames.box}">`
        this.optionsToFallDownOptions(options)
        for (let option of this.falldown)
        {
            s += `<div class="${options.classNames.option}${option.selected ? ` ${options.classNames.select}` : ''}">${option.html}</div>`
        }
        s += '</div></div>'
        this.element.innerHTML = s
        /**
         * Whether dropdown box is showing
         * @type boolean
         */
        this.showing = false
        this.label = this.element.querySelector('.' + options.classNames.label)
        this.selection = this.element.querySelector('.' + options.classNames.selection)
        this.selection.setAttribute('tabindex', this.selection.getAttribute('tabindex') || 0)
        this.selected = this.selection.querySelector('.' + options.classNames.selected)
        this.arrow = this.element.querySelector('.' + options.classNames.arrow)
        this.box = this.selection.querySelector('.' + options.classNames.box)
        if (options.parent)
        {
            options.parent.appendChild(this.element)
        }
        const elements = this.box.querySelectorAll('.' + options.classNames.option)
        for (let i = 0; i < elements.length; i++)
        {
            clicked(elements[i], () =>
            {
                this.cursorActive = false
                this.emit('select', this.select(i))
                if (this.options.multiple)
                {
                    this.clearCursor()
                }
                else
                {
                    this.close()
                }
            })
        }
        this.cursor = null
        this.options = options
        clicked(this.label, () => this.toggle())
        if (this.arrow)
        {
            clicked(this.arrow, () => this.toggle())
        }
        clicked(this.selected, () => this.toggle())
        this.selection.addEventListener('focus', () =>
        {
            this.focused = true
            this.selection.classList.add(this.options.classNames.focus)
            FallDown.active = this
        })
        this.selection.addEventListener('blur', () =>
        {
            this.focused = false
            this.close()
            this.selection.classList.remove(this.options.classNames.focus)
            if (FallDown.active === this)
            {
                FallDown.active = null
            }
        })
        this.box.style.display = 'block'
        if (this.options.size)
        {
            this.selected.style.width = this.options.size
            this.selected.style.overflow = 'hidden'
        }
        else if (this.options.minSize === 'longest')
        {
            let longest = 0
            for (let i = 0; i < this.box.childNodes.length; i++)
            {
                const width = this.box.childNodes[i].offsetWidth
                longest = width > longest ? width : longest
                this.selected.style.minWidth = longest + 'px'
            }
        }
        else
        {
            this.selected.style.minWidth = this.options.minSize
        }
        if (!options.allowEdit)
        {
            this.selected.style.userSelect = 'none'
        }
        this.showSelection()
        this.box.style.display = 'none'
    }

    toggle()
    {
        if (this.showing)
        {
            this.close()
        }
        else
        {
            this.open()
        }
    }

    optionsToFallDownOptions(options)
    {
        /**
         * list of items in falldown box
         * @type {FallDownElement[]}
         */
        this.falldown = []
        let selected = []
        if (options.selected)
        {
            if (Array.isArray(options.selected))
            {
                if (typeof options.selected[0] === 'string' || !isNaN(options.selected[0]))
                {
                    selected = options.selected
                }
                else
                {
                    for (let item of options.selected)
                    {
                        selected.push(item.value)
                    }
                }
            }
            else if (typeof options.selected === 'string' || !isNaN(options.selected))
            {
                if (options.selected.indexOf(options.separatorOptions) !== -1)
                {
                    selected = options.selected.split(options.separatorOptions)
                }
                else
                {
                    selected.push(options.selected)
                }
            }
            else
            {
                selected.push(options.selected.value)
            }
        }
        for (let i = 0; i < options.options.length; i++)
        {
            const option = options.options[i]
            if (typeof option === 'string' || !isNaN(option))
            {
                this.falldown.push({ value: option, html: option, selected: selected.indexOf(option) !== -1 })
            }
            else
            {
                this.falldown.push(option)
                option.selected = option.selected || selected.indexOf(option.value) !== -1
            }
        }
    }

    /**
     * returns current value (or array of values)
     * @return (string|string[])
     */
    get value()
    {
        const list = []
        for (let item of this.falldown)
        {
            if (item.selected)
            {
                list.push(item.value)
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
        const options = this.options
        const element = this.element
        options.selected = options.selected || element.getAttribute('data-selected') || ''
        const dataOptions = element.getAttribute('data-options')
        options.options = options.options || (dataOptions ? dataOptions.split(options.separatorOptions || ',') : [])
        options.label = options.label || element.getAttribute('data-label') || ''
        options.multiple = options.multiple || element.getAttribute('data-multiple')
        options.multipleName = options.multipleName || element.getAttribute('data-multiple-name')
        options.arrow = typeof options.arrow === 'undefined' ? { up: '&#9652', down: '&#9662;' } : options.arrows
        options.minSize = options.minSize || element.getAttribute('data-minsize') || 'longest'
        if (!options.classNames)
        {
            options.classNames = {}
        }
        options.classNames.main = options.classNames.main || 'falldown-main'
        options.classNames.label = options.classNames.label || 'falldown-label'
        options.classNames.selection = options.classNames.selection || 'falldown-selection'
        options.classNames.box = options.classNames.box || 'falldown-box'
        options.classNames.select = options.classNames.select || 'falldown-select'
        options.classNames.selected = options.classNames.selected || 'falldown-selected'
        options.classNames.arrow = options.classNames.arrow || 'falldown-arrow'
        options.classNames.option = options.classNames.option || 'falldown-option'
        options.classNames.cursor = options.classNames.cursor || 'falldown-cursor'
        options.classNames.focus = options.classNames.focus || 'falldown-focus'
        if (options.addCSSClassName)
        {
            for (let key in options.classNames)
            {
                options.classNames[key] = options.classNames[key].replace('falldown', options.addCSSClassName)
            }
        }
    }

    addStyles(options)
    {
        options.styles = options.styles || {}
        let s = ''
        for (let selector in STYLES)
        {
            const selectorName = options.addCSSClassName ? selector.replace('falldown', options.addCSSClassName) : selector
            const simple = selector.replace('.falldown-', '')
            s += selectorName + '{'
            for (let label in STYLES[selector])
            {
                const replace = options.styles[simple]
                if (!replace || !replace[label])
                {
                    s += label + ':' + STYLES[selector][label] + ';'
                }
            }
            for (let label in options.styles[simple])
            {
                s += label + ':' + options.styles[simple][label] + ';'
            }
            s += '}'
        }
        const style = document.createElement('style')
        style.innerText = s
        document.head.appendChild(style)
    }

    /**
     * open falldown box
     */
    open()
    {
        if (!this.showing)
        {
            this.box.style.display = 'block'
            if (this.options.arrow)
            {
                this.arrow.innerHTML = this.options.arrow.up
            }
            this.resizeBox()
            FallDown.active = this
            this.cursor = null
            this.showing = true
            this.selection.focus()
        }
    }

    resizeBox()
    {
        const width = window.innerWidth
        const height = window.innerHeight
        let box = this.box.getBoundingClientRect()
        const selection = this.selected.getBoundingClientRect()
        this.box.style.maxHeight = 'unset'
        if (selection.top + selection.height / 2 > height / 2)
        {
            this.box.style.bottom = this.selection.offsetHeight + 'px'
            this.box.style.top = 'unset'
            const box = this.box.getBoundingClientRect()
            if (box.top < 0)
            {
                const style = window.getComputedStyle(this.box)
                const spacing = parseFloat(style.marginLeft) + parseFloat(style.marginRight) + parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) + parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth)
                this.box.style.maxHeight = box.height + box.top - spacing + 'px'
            }
        }
        else
        {
            this.box.style.top = this.selection.offsetHeight + 'px'
            this.box.style.bottom = 'unset'
            const box = this.box.getBoundingClientRect()
            if (box.bottom > height)
            {
                const style = window.getComputedStyle(this.box)
                const spacing = parseFloat(style.marginTop) + parseFloat(style.marginBottom) + parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth)
                this.box.style.maxHeight = height - box.top - spacing + 'px'
            }
        }
        if (selection.left >= width / 2)
        {
            this.box.style.right = 0
            this.box.style.left = 'unset'
            box = this.box.getBoundingClientRect()
            if (box.left < 0)
            {
                this.box.style.right = box.left + 'px'
                this.box.style.left = 'unset'
            }
        }
        else
        {
            this.box.style.left = 0
            this.box.style.right = 'unset'
            box = this.box.getBoundingClientRect()
            if (box.right >= width)
            {
                this.box.style.left = width - box.right + 'px'
                this.box.style.right = 'unset'
            }
        }
    }

    /**
     * close falldown box
     */
    close()
    {
        if (this.showing)
        {
            this.clearCursor()
            this.box.style.display = 'none'
            this.selection.classList.remove(this.options.classNames.focus)
            if (this.options.arrow)
            {
                this.arrow.innerHTML = this.options.arrow.down
            }
            this.showing = false
        }
    }

    setCursor(i)
    {
        if (this.cursorActive)
        {
            this.clearCursor()
            if (i === this.box.childNodes.length)
            {
                i = 0
            }
            else if (i === -1)
            {
                i = this.box.childNodes.length - 1
            }
            this.cursor = i
            this.box.childNodes[this.cursor].classList.add(this.options.classNames.cursor)
            this.scrollIntoBoxView(this.box.childNodes[this.cursor])
        }
    }

    // TODO: does not work properly when scrolling up :(
    scrollIntoBoxView(element)
    {
        const bounding = element.getBoundingClientRect()
        if (bounding.top < 0)
        {
            this.box.scrollTop -= bounding.top
        }
        else if (bounding.bottom > window.innerHeight)
        {
            this.box.scrollTop -= window.innerHeight - bounding.bottom
        }
    }

    clearCursor()
    {
        if (this.cursor !== null)
        {
            this.box.childNodes[this.cursor].classList.remove(this.options.classNames.cursor)
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
                    this.box.childNodes[i].classList.add(this.options.classNames.select)
                    this.falldown[i].selected = true
                }
                else
                {
                    this.box.childNodes[i].classList.remove(this.options.classNames.select)
                    this.falldown[i].selected = false
                }
            }
            this.showSelection()
        }
        else
        {
            for (let i = 0; i < this.falldown.length; i++)
            {
                if (this.falldown[i].value === input)
                {
                    this.box.childNodes[i].classList.add(this.options.classNames.select)
                    this.falldown[i].selected = true
                    this.selection.innerHTML = input
                }
                else
                {
                    this.box.childNodes[i].classList.remove(this.options.classNames.select)
                    this.falldown[i].selected = false
                }
            }
            this.showSelection()
        }
    }

    /**
     * remove selected option
     * @param {number} index
     */
    remove(index)
    {
        this.box.childNodes[index].classList.remove(this.options.classNames.select)
        this.falldown[index].selected = false
        return this.showSelection()
    }

    showSelection()
    {
        const list = []
        for (let i = 0; i < this.falldown.length; i++)
        {
            if (this.falldown[i].selected)
            {
                list.push(this.falldown[i].html)
            }
        }
        if (list.length > 1)
        {
            if (this.options.multipleName)
            {
                this.selected.innerHTML = list.length + this.options.multipleName
            }
            else
            {
                let s = ''
                for (let i = 0; i < list.length - 1; i++)
                {
                    s += list[i] + (this.options.multipleSeparator || ', ')
                }
                this.selected.innerHTML = s + list[list.length - 1]
            }
        }
        else if (list.length === 1)
        {
            this.selected.innerHTML = list[0]
        }
        else
        {
            this.selected.innerHTML = ''
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
            this.box.childNodes[i].classList.remove(this.options.classNames.select)
            this.falldown[i].selected = false
        }
        this.showSelection()
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
            this.clearCursor()
        }
        if (this.options.multiple)
        {
            const changed = this.falldown[index]
            changed.selected = !changed.selected
            this.box.childNodes[index].classList.toggle(this.options.classNames.select)
            this.showSelection()
            this.setCursor(index)
            return { changed, value: this.value, falldown: this }
        }
        else
        {
            for (let i = 0; i < this.falldown.length; i++)
            {
                if (i === index)
                {
                    this.box.childNodes[i].classList.add(this.options.classNames.select)
                    this.falldown[i].selected = true
                }
                else
                {
                    this.box.childNodes[i].classList.remove(this.options.classNames.select)
                    this.falldown[i].selected = false
                }
            }
            this.showSelection()
            return { changed: this.falldown[index], value: this.value, falldown: this }
        }
    }

    /**
     * get index (or list of indices) for selected value(s)
     * @return (number|number[])
     */
    getIndex()
    {
        const list = []
        for (let i = 0; i < this.falldown.length; i++)
        {
            if (this.falldown[i].selected)
            {
                list.push(i)
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
            this.setCursor(this.cursor === null ? 0 : this.cursor + delta)
        }
        else
        {
            let index = this.getIndex()
            if (index === null)
            {
                index = unset
            }
            else
            {
                index += delta
                index = index < 0 ? this.falldown.length + index : index
                index = index >= this.falldown.length ? index - this.falldown.length : index
            }
            this.box.childNodes[index].scrollIntoView()
            this.emit('select', this.select(index))
        }
    }

    static cancel()
    {
        const active = FallDown.active
        if (active && active.showing)
        {
            active.close()
        }
    }

    static keydown(e)
    {
        const active = FallDown.active
        if (active)
        {
            switch (e.key)
            {
                case 'ArrowDown':
                    active.cursorActive = true
                    if (!active.showing)
                    {
                        active.open()
                    }
                    else
                    {
                        active.selectDelta(1, 0)
                    }
                    e.preventDefault()
                    break

                case 'ArrowUp':
                    active.cursorActive = true
                    if (!active.showing)
                    {
                        active.open()
                    }
                    else
                    {
                        active.selectDelta(-1, active.box.childNodes.length - 1)
                    }
                    e.preventDefault()
                    break

                case 'Space':
                case 'Enter':
                case ' ':
                    active.cursorActive = true
                    if (!active.showing)
                    {
                        active.open()
                    }
                    else
                    {
                        if (active.options.multiple)
                        {
                            active.emit('select', active.select(active.cursor))
                            if (!active.options.multiple)
                            {
                                active.close()
                            }
                        }
                        else
                        {
                            active.close()
                        }
                    }
                    e.preventDefault()
                    break

                case 'Escape':
                    active.cursorActive = false
                    active.close()
                    e.preventDefault()
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
        const divs = document.querySelectorAll('.' + className)
        for (let i = 0; i < divs.length; i++)
        {
            new FallDown({ element: divs[i] })
        }
    }

    static resize()
    {
        const active = FallDown.active
        if (active && active.showing)
        {
            active.resizeBox()
        }
    }
}

/**
 * @typedef {Object} FallDown#FallDownElement
 * @property {*} value
 * @property {string} html to display
 */

/**
 * fires when the selection of the falldown changes
 * @event FallDown#select
 * @type {object}
 * @property {FallDownElement} changed
 * @property {*} value - array of values (for option.multiple) or value of selected item
 * @property {FallDown} falldown - FallDown element
 */

module.exports = FallDown