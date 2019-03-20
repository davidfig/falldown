const clicked = require('clicked')
const Events = require('eventemitter3')

const STYLES = require('./styles.json')

module.exports = class FallDown extends Events
{
    /**
     * @param {object} options
     * @param {HTMLElement} [options.element] use preexisting element for FallDown with optional data in attributes (provide either options.element or options.parent)
     * @param {HTMLElement} [options.parent] use thsi parent to create the FallDown (provide either options.element or options.parent)
     * @param {string[]} [options.options] list of values for FallDown box
     * @param {string} [options.separatorOptions=","] separator used to split attribute data-options from options.element
     * @param {object} [options.selected=''] default value
     * @param {string} [options.label] label for FallDown box
     * @param {boolean} [options.allowEdit] can type entry
     * @param {(boolean|string)} [options.multiple] allow multiple items to be selected - set this to "name" if you want to replace > 1 items with "2 items" on the selection
     * @param {string} [options.multipleName] the words to use next to the count when options.multiple="name"
     * @param {string} [options.multipleSeparator=", "] when showing multiple options on the selector, use this to separate the options
     * @param {boolean} [options.addCSS] append styles directly to DOM instead of using stylesheet
     * @param {boolean} [options.addCSSClassName=falldown] change class names of added CSS styles (useful if you want multiple falldown boxes on same page with different styles)
     * @param {object} [options.styles] changes default styles if options.addCSS=true
     * @param {object} [options.styles.main]
     * @param {object} [options.styles.label]
     * @param {object} [options.styles.selection]
     * @param {object} [options.styles.selected]
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
            window.addEventListener('keydown', e => FallDown.keydown(e))
            FallDown.setup = true
        }
        if (options.addCSS)
        {
            this.addStyles(options)
        }
        this.element = options.element || document.createElement('div')
        this.options = options
        this.setupOptions()
        this.element.classList.add(options.classNames.main)
        let s = `<div class="${options.classNames.label}">${options.label}</div>` +
            `<div class="${options.classNames.selection}"><div class="${options.classNames.selected}">${options.selected}</div>` +
            `<div class="${options.classNames.box}">`
        for (let option of options.options)
        {
            s += `<div class="${options.classNames.option}${option === options.selected ? ` ${options.classNames.select}` : ''}">${option}</div>`
        }
        s += '</div></div>'
        this.element.innerHTML = s
        this.showing = false
        this.label = this.element.children[0]
        this.selection = this.element.children[1]
        this.selection.setAttribute('tabindex', this.selection.getAttribute('tabindex') || 0)
        this.selected = this.selection.children[0]
        this.box = this.selection.children[1]
        if (options.parent)
        {
            options.parent.appendChild(this.element)
        }
        const elements = this.box.querySelectorAll('.' + options.classNames.option)
        for (let i = 0; i < elements.length; i++)
        {
            clicked(elements[i], e =>
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
        this.selection.addEventListener('focus', () => this.open())
        this.selection.addEventListener('blur', () => this.close())
        this.box.style.display = 'block'
        let longest = 0
        for (let i = 0; i < this.box.childNodes.length; i++)
        {
            const width = this.box.childNodes[i].offsetWidth
            longest = width > longest ? width : longest
        }
        this.box.style.display = 'none'
        this.selection.style.minWidth = longest + 'px'
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

    open()
    {
        if (!this.showing)
        {
            const width = window.innerWidth
            this.box.style.display = 'block'
            const box = this.box.getBoundingClientRect()
            if (box.left + box.width > width)
            {
                this.box.style.right = 0
                this.box.style.left = 'unset'
            }
            else
            {
                this.box.style.left = 0
                this.box.style.right = 'unset'
            }
            this.box.style.top = this.selection.offsetHeight + 'px'
            this.selection.classList.add(this.options.classNames.focus)
            FallDown.active = this
            this.cursor = null
            this.showing = true
        }
    }

    close()
    {
        if (this.showing)
        {
            this.clearCursor()
            this.box.style.display = 'none'
            this.selection.classList.remove(this.options.classNames.focus)
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

    force(list)
    {
        if (this.data.multiple)
        {
            for (let i = 0; i < this.box.childNodes.length; i++)
            {
                if (list.indexOf(i) !== -1)
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
                if (this.box.childNodes.innerText === list)
                {
                    this.box.childNodes[i].classList.add(this.options.classNames.select)
                    this.selection.innerText = list
                }
                else
                {
                    this.box.childNodes[i].classList.remove(this.options.classNames.select)
                }
            }
            this.showSelection()
        }
    }

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
            if (this.options.multiple === 'name')
            {
                this.selected.innerText = list.length + this.options.multipleName
            }
            else
            {
                let s = ''
                for (let i = 0; i < list.length - 1; i++)
                {
                    s += list[i] + this.options.multipleSeparator || ', '
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

    clear()
    {
        for (let i = 0; i < this.box.childNodes.length; i++)
        {
            this.box.childNodes[i].classList.remove(this.options.classNames.select)
        }
    }

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
            this.setCursor(this.cursor === null ? 0 : this.cursor + 1)
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

    static cancel(e)
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
}