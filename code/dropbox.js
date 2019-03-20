const clicked = require('clicked')
const Events = require('eventemitter3')

let active

module.exports = class DropDown extends Events
{
    constructor(div)
    {
        super()
        this.div = div
        window.addEventListener('keydown', e => this.keydown(e))
        const selected = div.getAttribute('data-default')
        let s = `<span class="dropdown-label">${div.getAttribute('data-label')}</span>` +
            `<span class="dropdown-selection">${selected}</span>` +
            '<div class="dropdown-box">'
        const options = div.getAttribute('data-options')
        for (let option of options.split(','))
        {
            s += `<div class="dropdown-option${option === selected ? ' dropdown-select' : ''}">${option}</div>`
        }
        s += '</div>'
        div.innerHTML = s
        this.showing = false
        this.label = div.childNodes[0]
        this.selection = div.childNodes[1]
        this.box = div.childNodes[2]
        clicked(this.label, () => this.toggle())
        clicked(this.selection, () => this.toggle())
        const divs = this.box.querySelectorAll('.dropdown-option')
        for (let i = 0; i < divs.length; i++)
        {
            clicked(divs[i], () =>
            {
                this.emit('select', this.select(i))
                this.clearCursor()
            })
        }
        this.cursor = null
    }

    createCover()
    {
        this.cover = document.createElement('div')
        this.cover.className = 'dropdown-cover'
        this.div.parentNode.insertBefore(this.cover, this.div)
        clicked(this.cover, () => this.toggle())
    }

    toggle()
    {
        this.showing = !this.showing
        const width = window.innerWidth
        this.box.style.display = this.showing ? 'block' : 'none'
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
        if (this.showing)
        {
            active = this
            this.cursor = null
            this.createCover()
        }
        else
        {
            this.clearCursor()
            this.cover.remove()
            active = null
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
        this.box.childNodes[this.cursor].classList.add('dropdown-cursor')
    }

    clearCursor()
    {
        if (this.cursor !== null)
        {
            this.box.childNodes[this.cursor].classList.remove('dropdown-cursor')
        }
    }

    force(list)
    {
        if (this.div.getAttribute('data-multiple'))
        {
            for (let i = 0; i < this.box.childNodes.length; i++)
            {
                if (list.indexOf(i) !== -1)
                {
                    this.box.childNodes[i].classList.add('dropdown-select')
                }
                else
                {
                    this.box.childNodes[i].classList.remove('dropdown-select')
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
                    this.box.childNodes[i].classList.add('dropdown-select')
                    this.selection.innerText = list
                }
                else
                {
                    this.box.childNodes[i].classList.remove('dropdown-select')
                }
            }
        }
    }

    remove(index)
    {
        this.box.childNodes[index].classList.remove('dropdown-select')
        return this.showSelection()
    }

    showSelection()
    {
        const list = []
        for (let i = 0; i < this.box.childNodes.length; i++)
        {
            if (this.box.childNodes[i].classList.contains('dropdown-select'))
            {
                list.push(this.box.childNodes[i].innerText)
            }
        }
        if (list.length > 1)
        {
            this.selection.innerText = list.length + this.div.getAttribute('data-name-multiple')
        }
        else
        {
            this.selection.innerText = list[0]
        }
        return list
    }

    clear()
    {
        for (let i = 0; i < this.box.childNodes.length; i++)
        {
            this.box.childNodes[i].classList.remove('dropdown-select')
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
        if (this.div.getAttribute('data-multiple'))
        {
            const changed = this.box.childNodes[index]
            this.box.childNodes[index].classList.toggle('dropdown-select')
            const list = this.showSelection()
            this.setCursor(index)
            return { changed, list, active }
        }
        else
        {
            for (let i = 0; i < this.box.childNodes.length; i++)
            {
                if (i !== index)
                {
                    this.box.childNodes[index].classList.remove('dropdown-select')
                }
                else
                {
                    this.box.childNodes[index].classList.add('dropdown-select')
                }
            }
            return { changed: this.box.childNodes[index].innerText }
        }
    }

    keydown(e)
    {
        if (active === this)
        {
            switch (e.key)
            {
                case 'ArrowDown':
                    this.setCursor(this.cursor === null ? 0 : this.cursor + 1)
                    break

                case 'ArrowUp':
                    this.setCursor(this.cursor === null ? this.box.childNodes.length - 1 : this.cursor - 1)
                    break

                case 'Space': case 'Enter': case ' ':
                    this.emit('select', this.select(this.cursor))
                    break

                case 'Escape':
                    if (active === this)
                    {
                        this.toggle()
                    }
                    break
            }
            e.preventDefault()
        }
    }
}