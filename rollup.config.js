import fs from 'fs';
import resolve from '@rollup/plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';
import replace from '@rollup/plugin-replace';
import url from '@rollup/plugin-url';
import hotcss from 'rollup-plugin-hot-css';
import commonjs from 'rollup-plugin-commonjs-alternate';
import refresh from 'rollup-plugin-react-refresh';

const fsp = fs.promises;
const stringToRegex = str => {
  const main = str.match(/\/(.+)\/.*/)[1];
  const options = str.match(/\/.+\/(.*)/)[1];
  return new RegExp(main, options);
};

const copyFile = async (filename, output, replacements) => {
  try {
    if (replacements) {
      let buffer = (await fsp.readFile(filename)).toString();
      Object.keys(replacements).forEach(pattern => {
        const regex = stringToRegex(pattern);
        buffer = buffer.replace(regex, replacements[pattern]);
      });
      await fsp.writeFile(output, buffer);
    } else {
      await fsp.copyFile(filename, output);
    }
  } catch (err) {
    //
  }
};

const appName = 'rollupReactApp';
const NODE_ENV = process.env.NODE_ENV || 'development';
const production = NODE_ENV !== 'development' && NODE_ENV !== 'test';
const development = NODE_ENV === 'development';
const outputFile = production ? '/static/js/index' : '/index.[hash]';
const publicUrl = process.env.PUBLIC_URL || 'http://localhost:9000';
const esmFile = `${outputFile}.js`;
const iifeFile = `${outputFile}.legacy.js`;
const styles = development ? '/styles.[hash].css' : 'static/assets/styles.css';

const genScripts = () => {
  let scripts = `<script async type="module" src="${esmFile}"></script>`;
  if (production) {
    scripts += `<script nomodule src="${iifeFile}"></script>`;
  }
  return scripts;
};

// copy files
(async () => {
  await copyFile('public/favicon.ico', 'build/favicon.ico');
  await copyFile('public/logo192.png', 'build/logo192.png');
  await copyFile('public/logo512.png', 'build/logo512.png');
  await copyFile('public/manifest.json', 'build/manifest.json');
  await copyFile('public/robots.txt', 'build/robots.txt');
  await copyFile('public/index.html', 'build/index.html', {
    '/%SCRIPTS%/': genScripts(),
    '/%STYLES%/': styles,
    '/%PUBLIC_URL%/g': publicUrl,
  });
})();

const plugins = babelConf => [
  replace({
    'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
  }),
  url(),
  hotcss({
    hot: development,
    filename: development ? 'styles.css' : 'static/assets/styles.css',
  }),
  babel(babelConf),
  resolve(),
  commonjs({ extensions: ['.js', '.jsx'] }),
  production && terser(),
  development && refresh(),
];

const esm = {
  input: 'src/index.js',
  output: {
    dir: 'build',
    format: 'esm',
    entryFileNames: development ? '[name].[hash].js' : 'static/js/[name].js',
    assetFileNames: development ? '[name].[hash][extname]' : '[name][extname]',
    sourcemap: true,
  },
  plugins: plugins({
    exclude: 'node_modules/**',
    presets: [['@babel/preset-env'], '@babel/preset-react'],
    plugins: development ? ['react-refresh/babel'] : [],
  }),
};

const iife = {
  input: 'src/index.js',
  output: {
    dir: 'build',
    format: 'iife',
    entryFileNames: 'static/js/[name].legacy.js',
    assetFileNames: development ? '[name][hash][extname]' : '[name][extname]',
    name: appName,
    sourcemap: true,
  },
  plugins: plugins({
    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            browsers: ['> 0.5%'],
          },
        },
      ],
      '@babel/preset-react',
    ],
  }),
};

const config = [esm];
if (production) {
  config.push(iife);
}
export default config;
