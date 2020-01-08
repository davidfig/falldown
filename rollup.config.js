import { terser } from 'rollup-plugin-terser'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import json from '@rollup/plugin-json'

export default [
{
    input: 'code/falldown.js',
    plugins: [
        json(),
        resolve(),
        commonjs(),
        terser()
    ],
    output:
    {
        file: 'dist/falldown.js',
        format: 'umd',
        name: 'Falldown',
        sourcemap: true
    }
}]