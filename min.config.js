import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import { uglify } from 'rollup-plugin-uglify';

const extensions = ['.js', '.ts'];

const name = 'ObjectQuery';

export default {
  input: './src/index.ts',

  // Specify here external modules which you don't want to include in your bundle (for instance: 'lodash', 'moment' etc.)
  // https://rollupjs.org/guide/en#external-e-external
  external: [],

  plugins: [
    // Allows node_modules resolution
    resolve({ extensions }),

    // Allow bundling cjs modules. Rollup doesn't understand cjs
    commonjs(),

    // Compile TypeScript/JavaScript files
    babel({ extensions, include: ['src/**/*'] }),

    // minify JS files
    uglify()
  ],

  output: [
    /*{
      file: './dist/OQ.common.js',
      format: 'cjs'
    },
    {
      file: './dist/OQ.es.js',
      format: 'es'
    },*/
    {
      file: './dist/OQ.browser.min.js',
      format: 'iife',
      name,

      // https://rollupjs.org/guide/en#output-globals-g-globals
      globals: {}
    }
  ]
};
