const fs = require('fs-extra')
const path = require('path')

async function generate()
{
    function findLabels()
    {
        const index = styles.indexOf('{', i)
        if (index !== -1)
        {
            const labels = styles.substring(i, index)
            insides = []
            for (let label of labels.split(','))
            {
                const name = label.trim()
                insides.push(name)
                css[name] = css[name] || {}
            }
            i = index + 1
            return true
        }
        else
        {
            index = styles.length
            return false
        }
    }

    function findContent()
    {
        const index = styles.indexOf('}', i)
        const lines = styles.substring(i, index).split(';')
        for (let line of lines)
        {
            if (line.indexOf(':') !== -1)
            {
                const parts = line.split(':')
                const name = parts[0].trim()
                const value = parts[1].trim().replace(';', '')
                for (let inside of insides)
                {
                    css[inside][name] = value
                }
            }
        }
        i = index + 1
    }

    console.log('Creating code/styles.json...')
    let styles = await fs.readFile(path.join('css', 'falldown.css')) + ''
    styles = styles.replace(/\r\n/g, '')
    styles = styles.replace(/\n/g, '')
    let i = 0, insides
    const css = {}
    while (i < styles.length)
    {
        if (findLabels())
        {
            findContent()
        }
    }
    await fs.writeJSON(path.join('code', 'styles.json'), css)
    console.log('completed.')
    process.exit(0)
}

generate()