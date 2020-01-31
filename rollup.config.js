import resolve from '@rollup/plugin-node-resolve';
// import commonjs from '@rollup/plugin-commonjs';
import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';
import replace from '@rollup/plugin-replace';
import copy from 'rollup-plugin-copy';
import url from '@rollup/plugin-url';
// import postcss from 'rollup-plugin-postcss';
// import static_files from 'rollup-plugin-static-files';
import hotcss from 'rollup-plugin-hot-css';
import commonjs from 'rollup-plugin-commonjs-alternate';

const appName = 'react-app';
const NODE_ENV = process.env.NODE_ENV || 'development';
const production = NODE_ENV !== 'development' && NODE_ENV !== 'test';
const outputFile = production ? '/static/js/prod' : '/static/js/dev';
const publicUrl = process.env.PUBLIC_URL || 'http://localhost:9000';
let esmFile = `${outputFile}.js`;
const iifeFile = `${outputFile}.legacy.js`;
if (NODE_ENV === 'development') {
  esmFile = '/index.[hash].js';
}
const genScripts = () => {
  let scripts = `<script async src="${esmFile}"></script>`;
  if (production) {
    scripts += `<script src="${iifeFile}"></script>`;
  }
  return scripts;
};
const plugins = () => [
  copy({
    targets: [
      {
        src: [
          'public/favicon.ico',
          'public/logo192.png',
          'public/logo512.png',
          'public/manifest.json',
          'public/robots.txt',
        ],
        dest: 'build',
      },
      {
        src: 'public/index.html',
        dest: 'build',
        transform: contents =>
          contents
            .toString()
            .replace('%SCRIPTS%', genScripts())
            .replace(/%PUBLIC_URL%/g, publicUrl),
      },
    ],
  }),
  replace({
    'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
  }),
  url(),
  hotcss({
    hot: NODE_ENV === 'development',
    filename: 'styles.css',
  }),
  babel({
    exclude: 'node_modules/**',
    presets: ['@babel/preset-env', '@babel/preset-react'],
    plugins: ['react-hot-loader/babel'],
  }),
  resolve(),
  commonjs(),
  production && terser(),
  /* postcss(), */
];

const esm = {
  input: 'src/index.js',
  output: {
    dir: 'build',
    format: 'esm',
    entryFileNames: '[name].[hash].js',
    assetFileNames: '[name].[hash][extname]',
  },
  plugins: plugins(),
};

const iife = {
  input: 'src/index.js',
  output: {
    format: 'iife',
    file: `./build/${iifeFile}`,
    name: appName,
    sourcemap: true,
  },
  plugins: plugins(),
};

const config = [esm];
if (production) {
  config.push(iife);
}
export default [esm];
