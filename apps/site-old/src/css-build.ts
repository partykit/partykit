#!/usr/bin/env node
"use strict";

import fs from "fs";
import _ from "lodash";
import { createRequire } from "module";
import chalk from "chalk";
//import mkdirp from 'mkdirp';
import dedent from "dedent";
import isBlank from "is-blank";
// import isPresent from "is-present";
import fileExists from "file-exists";
import cssstats from "cssstats";
import trailingLines from "single-trailing-newline";
import authorsToMd from "authors-to-markdown";
const meow = createRequire(import.meta.url)("meow");

// import { tachyonsBuild } from "./css-make.js";

const cli = meow(
  `
  Usage
    $ tachyons <input.css>

  Options
    -m, --minify Minify the output stylesheet
    -r, --repeat Repeat class names to increase specificity
    -a, --authors Dynamically add authors based on package.json
    -n, --new Generate a new Tachyons project
    --rtl Generate RTL supported CSS
    --generate-docs Generate documentation for a given module
    --package The path to the module package to be documented
    --preserve-variables Preserve CSS variables in output

  Example
    $ tachyons src/tachyons.css > dist/c.css
    $ tachyons src/tachyons.css > dist/c.css --minify
    $ tachyons src/tachyons.css > dist/c.repeated.css --repeat
    $ tachyons src/tachyons-type-scale.css --generate-docs --package=./package.json > readme.md
    $ tachyons --new=my-new-project
  `,
  {
    alias: {
      m: "minify",
      r: "repeat",
      a: "authors",
      n: "new",
    },
  }
);

const inputFile = cli.input[0];
const outputFile = cli.input[1];

//if (cli.flags.new) {
//  console.log('Generating a new Tachyons project');
//  const projDir = cli.flags.new == true ? 'tachyons-project' : cli.flags.new;
//
//  mkdirp.sync(projDir);
//  mkdirp.sync(projDir + '/src');
//  mkdirp.sync(projDir + '/css');
//
//  const index = fs.readFileSync(__dirname + '/templates/new/index.html', 'utf8');
//  const pkg = fs.readFileSync(__dirname + '/templates/new/package.json', 'utf8');
//  const readme = fs.readFileSync(__dirname + '/templates/new/readme.md', 'utf8');
//  const style = fs.readFileSync(__dirname + '/templates/new/src/styles.css', 'utf8');
//
//  fs.writeFileSync(projDir + '/index.html', index);
//  fs.writeFileSync(projDir + '/package.json', pkg);
//  fs.writeFileSync(projDir + '/readme.md', readme);
//  fs.writeFileSync(projDir + '/src/styles.css', style);
//
//  console.log('New project located in ' + projDir);
//  process.exit(0);
//}

if (isBlank(inputFile)) {
  console.error(chalk.red("Please provide an input stylesheet"));
  console.log(cli.help);
  process.exit(1);
} else if (!fileExists(inputFile)) {
  console.error(chalk.red("File does not exist " + inputFile));
  console.log(cli.help);
  process.exit(1);
}

const input = fs.readFileSync(inputFile, "utf8");
// @ts-expect-error -- TSCONVERSION
tachyonsBuildCss(input, {
  from: inputFile,
  to: outputFile,
  rtl: cli.flags.rtl,
  minify: cli.flags.minify,
  repeat: cli.flags.repeat,
  preserveVariables: cli.flags.preserveVariables,
}).then(function (result) {
  if (cli.flags.generateDocs) {
    const stats = cssstats(result.css);

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const pkg = require(cli.flags.package);
    const template = fs.readFileSync(
      __dirname + "/templates/readme.md",
      "utf8"
    );
    const tpl = _.template(template);

    let authors = `
* [mrmrs](http://mrmrs.io)
* [johno](http://johnotander.com)
`;

    if (cli.flags.authors) {
      authors = authorsToMd(pkg);
    }

    const srcMd = /^\/\*!!![\s\S]*?\*\/.*/.exec(input);

    const defaultMd = `
# ${pkg.name} ${pkg.version}

${pkg.description}
`;

    const md = tpl({
      stats,
      authors,
      module: pkg,
      srcMd: dedent((srcMd && srcMd[0]) || defaultMd)
        .replace(/^\/\*!!!/, "")
        .replace(/\*\/$/, ""),
      srcCss: trailingLines(result.css),
    });

    console.log(trailingLines(md));
    process.exit(0);
  } else {
    console.log(trailingLines(result.css));
    process.exit(0);
  }
});
