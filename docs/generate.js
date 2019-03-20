const fs = require('fs-extra')
const path = require('path')

const TEMPLATE_START = '<!-- begin-demo-code'
const TEMPLATE_END = 'end-demo-code -->'
const CODE_START = '/** begin-test */'
const CODE_END = '/** end-test */'

async function generate()
{
    const template = await fs.readFile(path.join('docs', 'index.template.html')) + ''
    const templateStart = template.indexOf(TEMPLATE_START)
    const templateEnd = template.indexOf(TEMPLATE_END) + TEMPLATE_END.length

    const demo = await fs.readFile(path.join('docs', 'code.js')) + ''
    let index = 0, find, count = 1
    let s = ''
    do
    {
        find = demo.indexOf(CODE_START, index)
        if (find !== -1)
        {
            const end = demo.indexOf(CODE_END, index)
            s += `<tr><td class="demo demo-${count++}"></td>` +
                `<td class="code"><pre>${demo.substring(find + CODE_START.length + 2, end - 1)}</pre></td></tr>`
            index = end + CODE_END.length
        }
    }
    while (find !== -1)
    const output = template.substring(0, templateStart) + s + template.substr(templateEnd)
    await fs.outputFile(path.join('docs', 'index.html'), output)
    console.log('created tables.')
    process.exit(0)
}

generate()