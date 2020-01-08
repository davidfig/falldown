import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import serve from 'rollup-plugin-serve'
import json from '@rollup/plugin-json'

export default
{
    input: 'docs/code.js',
    plugins: [
        resolve(
        {
            browser: true,
            preferBuiltins: false
        }),
        commonjs(),
        json(),
        serve(
        {
            contentBase: 'docs',
            verbose: true
        })
    ],
    output:
    {
        name: 'falldown',
        file: 'docs/index.js',
        format: 'iife',
        sourcemap: true
    }
}