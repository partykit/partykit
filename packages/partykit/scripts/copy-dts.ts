// because tsc is expecting the typings to be at the root,
// we use this script to copy the generated .d.ts files to the root
// we can't just --outDir in tsconfig.extract.json to be root
// since that adds tge root to `exclude` 😖

// move all files files from ../dts to ..
import * as fs from "fs";
import * as path from "path";

const dtsDir = path.join(__dirname, "../dts");
const files = fs.readdirSync(dtsDir);
for (const file of files) {
  if (file.endsWith(".d.ts") || file.endsWith(".map")) {
    fs.cpSync(path.join(dtsDir, file), path.join(__dirname, "../", file));
  }
}
