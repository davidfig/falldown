const FallDown = require('../code/falldown')

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
    })
    /** end-test */

    /** begin-test */
    new FallDown({
        parent: document.querySelector('.demo-2'),
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
    })
    /** end-test */

    /** begin-test */
    new FallDown({
        parent: document.querySelector('.demo-3'),
        label: 'Single selection with stylesheet:',
        options: [
            'options 1',
            'options 2',
            'options 3',
            'options 4',
            'options 5'
        ],
        selected: 'options 1'
    })
    /** end-test */
}

window.onload = demo