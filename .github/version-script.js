const fs = require("fs");
const { exec } = require("child_process");

try {
  const package = JSON.parse(
    fs.readFileSync("./packages/partykit/package.json")
  );
  exec("git rev-parse --short HEAD", (err, stdout) => {
    if (err) {
      console.log(err);
      process.exit(1);
    }
    package.version = "0.0.0-" + stdout.trim();
    fs.writeFileSync(
      "./packages/partykit/package.json",
      JSON.stringify(package, null, "\t") + "\n"
    );
  });
} catch (error) {
  console.error(error);
  process.exit(1);
}
