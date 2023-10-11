const fs = require("fs");
const { exec } = require("child_process");

try {
  exec("git rev-parse --short HEAD", (err, stdout) => {
    if (err) {
      console.log(err);
      process.exit(1);
    }
    for (const path of [
      "./packages/partykit/package.json",
      "./packages/y-partykit/package.json",
      "./packages/partysocket/package.json",
      "./packages/create-partykit/package.json",
      "./packages/partymix/package.json",
    ]) {
      const package = JSON.parse(fs.readFileSync(path));
      package.version = "0.0.0-" + stdout.trim();
      fs.writeFileSync(path, JSON.stringify(package, null, "\t") + "\n");
    }
  });
} catch (error) {
  console.error(error);
  process.exit(1);
}
