const fs = require('fs');
const postcss = require('postcss');
const cssnano = require('cssnano');
const mqpacker = require('css-mqpacker');
const perfectionist = require('perfectionist');
const autoprefixer = require('autoprefixer');
const atImport = require('postcss-import');
const media = require('postcss-custom-media');
const vars = require('postcss-css-variables');
const extend = require('postcss-extend-rule');
const conditionals = require('postcss-conditionals');
const rmComments = require('postcss-discard-comments');

const inputFile = 'src/styles/tachyons.css';
const outputFile = 'public/app.min.css';

const plugins = [
  atImport(),
  conditionals(),
  media(),
  mqpacker(),
  perfectionist(),
  autoprefixer(),
  extend()
];

// Apply additional plugins if needed
// plugins.push(...additionalPlugins);

// Add cssnano plugin for minification
plugins.push(cssnano());

// Read the input file
const input = fs.readFileSync(inputFile, 'utf8');

// Process the CSS
postcss(plugins)
  .process(input, {
    from: inputFile,
    to: outputFile,
  })
  .then((result) => {
    // Write the minified version to the output file
    fs.writeFileSync(outputFile, result.css);
    console.log('Minified CSS saved at ' + outputFile);
  })
  .catch((error) => {
    console.error('Error processing CSS:', error);
  });
