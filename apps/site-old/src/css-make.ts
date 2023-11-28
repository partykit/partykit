import postcss from "postcss";
import cssnano from "cssnano";
import queries from "css-mqpacker";
import perfect from "perfectionist";
import prefixer from "autoprefixer";
import atImport from "postcss-import";
import media from "postcss-custom-media";
import vars from "postcss-css-variables";
import extend from "postcss-extend-rule";
import conditionals from "postcss-conditionals";
import rmComments from "postcss-discard-comments";
import classRepeat from "postcss-class-repeat";
import calc from "postcss-calc";
import rtl from "postcss-rtl";

const getPlugins = function (options) {
  options = options || {};

  const perfectionistOptions = options.perfectionist || {
    format: "compact",
    trimTrailingZeros: false,
  };

  const atImportOptions = options.atImport || {};

  const plugins: postcss.Transformer[] = [
    atImport(atImportOptions),
    conditionals(),
    media(),
    queries(),
    perfect(perfectionistOptions),
    prefixer(),
    extend(),
  ];

  if (!options.preserveVariables) {
    // @ts-expect-error -- TSCONVERSION
    plugins.splice(1, 0, calc());
    plugins.splice(1, 0, vars());
  }

  if (options.minify) {
    // @ts-expect-error -- TSCONVERSION
    plugins.push(cssnano());
    // @ts-expect-error -- TSCONVERSION
    plugins.push(rmComments());
  }

  if (options.repeat) {
    let repeatNum = parseInt(options.repeat) || 4;

    if (repeatNum < 2) {
      repeatNum = 4;
    }

    plugins.push(classRepeat({ repeat: repeatNum }));
  }

  if (options.rtl) {
    plugins.push(rtl());
  }

  if (options.plugins) {
    options.plugins.forEach((plugin) => plugins.push(plugin));
  }

  return plugins;
};

export const tachyonsBuild = function (css, options) {
  const plugins = getPlugins(options);

  return postcss(plugins).process(css, options);
};

export { getPlugins };
