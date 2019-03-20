const clicked = require('clicked')
const Events = require('eventemitter3')

const STYLES = require('./styles.json')

class FallDown extends Events
{
    /**
     * @param {object} options
     * @param {HTMLElement} [options.element] use preexisting element for FallDown with optional data in attributes (provide either options.element or options.parent)
     * @param {HTMLElement} [options.parent] use thsi parent to create the FallDown (provide either options.element or options.parent)
     * @param {string[]} [options.options] list of values for FallDown box
     * @param {string} [options.separatorOptions=","] separator used to split attribute data-options from options.element
     * @param {object} [options.selected=''] default value
     * @param {string} [options.label] label for FallDown box
     * @param {string} [options.minSize=longest] longest=size to largest option; otherwise use this as minWidth (e.g., '5rem')
     * @param {boolean} [options.allowEdit] can type entry
     * @param {string} [options.multipleName] when set and more than 1 item is selected then text changes to "n items" where n is the number selected and items=multipleName
     * @param {string} [options.multipleSeparator=", "] when showing multiple options on the selector, use this to separate the options
     * @param {(object|boolean)} [options.arrow] change open and close arrows; set to false to remove
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
     */
    constructor(options)
    {
        super()
        if (!FallDown.setup)
        {
            window.addEventListener('resize', FallDown.resize)
            window.addEventListener('scroll', FallDown.resize)
            window.addEventListener('keydown', FallDown.keydown)
            FallDown.setup = true
        }
        if (options.addCSS)
        {
            this.addStyles(options)
        }
        /**
         * Main element
         * @type HTMLElement
         */
        this.element = options.element || document.createElement('div')
        this.options = options
        this.setupOptions()
        this.element.classList.add(options.classNames.main)
        let s = `<div class="${options.classNames.label}">${options.label}</div>` +
            `<div class="${options.classNames.selection}">` +
            `<div class="${options.classNames.selected}">${options.selected}</div>` +
            (options.arrow ? `<div class="${options.classNames.arrow}">${options.arrow.down}</div>` : '') +
            `<div class="${options.classNames.box}">`
        for (let option of options.options)
        {
            s += `<div class="${options.classNames.option}${option === options.selected ? ` ${options.classNames.select}` : ''}">${option}</div>`
        }
        s += '</div></div>'
        this.element.innerHTML = s

        /**
         * Whether dropdown box is showing
         * @type boolean
         */
        this.showing = false
        this.label = this.element.children[0]
        this.selection = this.element.children[1]
        this.selection.setAttribute('tabindex', this.selection.getAttribute('tabindex') || 0)
        this.selected = this.selection.children[0]
        this.arrow = this.element.querySelector('.' + options.classNames.arrow)
        this.box = this.selection.children[options.arrow ? 2 : 1]
        if (options.parent)
        {
            options.parent.appendChild(this.element)
        }
        const elements = this.box.querySelectorAll('.' + options.classNames.option)
        for (let i = 0; i < elements.length; i++)
        {
            clicked(elements[i], () =>
            {
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
        clicked(this.label, () => {
            if (!this.showing)
            {
                this.selection.focus()
            }
        })
        clicked(this.selection, () =>
        {
            if (!this.showing)
            {
                this.open()
            }
        })
        this.selection.addEventListener('focus', () => this.open())
        this.selection.addEventListener('blur', () => this.close())
        this.box.style.display = 'block'
        if (this.options.minSize === 'longest')
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
        this.box.style.display = 'none'
    }

    /**
     * returns current value (or array of values)
     * @return (string|string[])
     */
    get value()
    {
        if (this.options.multiple)
        {
            const list = []
            for (let i = 0; i < this.box.childNodes.length; i++)
            {
                if (this.box.childNodes[i].classList.contains(this.options.classNames.select))
                {
                    list.push(this.box.childNodes[i].innerText)
                }
            }
            return list
        }
        else
        {
            return this.selected.innerText
        }
    }

    setupOptions()
    {
        const options = this.options
        const element = this.element
        options.selected = options.selected || element.getAttribute('data-selected') || ''
        const dataOptions = element.getAttribute('data-options')
        options.options = options.options || (dataOptions ? dataOptions.split(options.separatorOptions || ',') : [])
        options.label = options.label || element.getAttribute('data-label')
        options.multiple = options.multiple || element.getAttribute('data-multiple')
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
            this.resizeBox()
            this.selection.classList.add(this.options.classNames.focus)
            if (this.options.arrow)
            {
                this.arrow.innerHTML = this.options.arrow.up
            }
            FallDown.active = this
            this.cursor = null
            this.showing = true
        }
    }

    resizeBox()
    {
        const width = window.innerWidth
        const height = window.innerHeight
        const box = this.box.getBoundingClientRect()
        const selection = this.selection.getBoundingClientRect()
        this.box.style.maxHeight = 'unset'
        if (selection.left + box.width > width)
        {
            this.box.style.right = 0
            this.box.style.left = 'unset'
        }
        else
        {
            this.box.style.left = 0
            this.box.style.right = 'unset'
        }
        if (selection.top + selection.height / 2 > height / 2)
        {
            this.box.style.bottom = this.selection.offsetHeight + 'px'
            this.box.style.top = 'unset'
            const box = this.box.getBoundingClientRect()
            if (box.top < 0)
            {
                this.box.style.maxHeight = box.height + box.top - this.selection.offsetHeight / 2 + 'px'
            }
        }
        else
        {
            this.box.style.top = this.selection.offsetHeight + 'px'
            this.box.style.bottom = 'unset'
            const box = this.box.getBoundingClientRect()
            if (box.bottom > height)
            {
                this.box.style.maxHeight = box.height - (box.bottom - height) - this.selection.offsetHeight / 2 + 'px'
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
            FallDown.active = null
            this.showing = false
        }
    }

    setCursor(i)
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
     * @param {(string|string[])} input to select
     */
    force(input)
    {
        if (this.data.multiple)
        {
            for (let i = 0; i < this.box.childNodes.length; i++)
            {
                if (input.indexOf(i) !== -1)
                {
                    this.box.childNodes[i].classList.add(this.options.classNames.select)
                }
                else
                {
                    this.box.childNodes[i].classList.remove(this.options.classNames.select)
                }
            }
            this.showSelection()
        }
        else
        {
            for (let i = 0; i < this.box.childNodes.length; i++)
            {
                if (this.box.childNodes.innerText === input)
                {
                    this.box.childNodes[i].classList.add(this.options.classNames.select)
                    this.selection.innerText = input
                }
                else
                {
                    this.box.childNodes[i].classList.remove(this.options.classNames.select)
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
        return this.showSelection()
    }

    showSelection()
    {
        const list = []
        for (let i = 0; i < this.box.childNodes.length; i++)
        {
            if (this.box.childNodes[i].classList.contains(this.options.classNames.select))
            {
                list.push(this.box.childNodes[i].innerText)
            }
        }
        if (list.length > 1)
        {
            if (this.options.multipleName)
            {
                this.selected.innerText = list.length + this.options.multipleName
            }
            else
            {
                let s = ''
                for (let i = 0; i < list.length - 1; i++)
                {
                    s += list[i] + (this.options.multipleSeparator || ', ')
                }
                this.selected.innerText = s + list[list.length - 1]
            }
        }
        else
        {
            this.selected.innerText = list[0]
        }
        return list
    }

    /**
     * clear all selections
     */
    clear()
    {
        for (let i = 0; i < this.box.childNodes.length; i++)
        {
            this.box.childNodes[i].classList.remove(this.options.classNames.select)
        }
    }

    /**
     * select option by name
     * @param {string} name
     */
    selectByName(name)
    {
        for (let i = 0; i < this.box.childNodes.length; i++)
        {
            if (this.box.childNodes[i].innerText === name)
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
            const changed = this.box.childNodes[index]
            this.box.childNodes[index].classList.toggle(this.options.classNames.select)
            const list = this.showSelection()
            this.setCursor(index)
            return { changed, list, active: FallDown.active }
        }
        else
        {
            for (let i = 0; i < this.box.childNodes.length; i++)
            {
                if (i === index)
                {
                    this.box.childNodes[i].classList.add(this.options.classNames.select)
                }
                else
                {
                    this.box.childNodes[i].classList.remove(this.options.classNames.select)
                }
            }
            this.showSelection()
            return { changed: this.box.childNodes[index].innerText }
        }
    }

    /**
     * get index (or list of indices) for selected value(s)
     * @return (number|number[])
     */
    getIndex()
    {
        const list = []
        for (let i = 0; i < this.box.childNodes.length; i++)
        {
            if (this.box.childNodes[i].classList.contains(this.options.classNames.select))
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
                index = index < 0 ? this.box.childNodes.length + index : index
                index = index >= this.box.childNodes.length ? index - this.box.childNodes.length : index
            }
            this.select(index)
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
                    active.selectDelta(1, 0)
                    e.preventDefault()
                    break

                case 'ArrowUp':
                    active.selectDelta(-1, active.box.childNodes.length - 1)
                    e.preventDefault()
                    break

                case 'Space': case 'Enter': case ' ':
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
                    e.preventDefault()
                    break

                case 'Escape':
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
    static load(className='falldown')
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

module.exports = FallDown