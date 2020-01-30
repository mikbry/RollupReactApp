import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';
import replace from '@rollup/plugin-replace';
import copy from 'rollup-plugin-copy';

const appName = 'react-app';
const NODE_ENV = process.env.NODE_ENV || 'development';
const production = NODE_ENV !== 'development' && NODE_ENV !== 'test';
const outputFile = production ? '/static/js/prod' : '/static/js/dev';
const publicUrl = process.env.PUBLIC_URL || 'localhost:5000';
const esmFile = `${outputFile}.js`;
const iifeFile = `${outputFile}.legacy.js`;

const genScripts = () => {
  let scripts = `<script src="${esmFile}"></script>`;
  if (production) {
    scripts += `<script src="${iifeFile}"></script>`;
  }
  return scripts;
};
const plugins = () => [
  resolve(),
  replace({
    'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
  }),
  babel({
    exclude: 'node_modules/**',
    presets: ['@babel/preset-env', '@babel/preset-react'],
  }),
  commonjs({
    exclude: 'src/**',
  }),
  production && terser(),
  copy({
    targets: [
      {
        src: [
          'public/favicon.ico',
          'public/logo192.png',
          'public/logo512.png',
          'public/manifest.json',
          'public/robots.text',
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
];

const esm = {
  input: 'src/index.js',
  output: {
    format: 'es',
    file: `./build/${esmFile}`,
    sourcemap: true,
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
