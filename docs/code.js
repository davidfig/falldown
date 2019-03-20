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
    });
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
    });
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
    const options = []
    for (let i = 0; i < 30; i++)
    {
        options.push('lots of options ' + i)
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

window.onload = demo