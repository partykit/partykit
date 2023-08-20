import { Text, render } from "ink";
import * as React from "react";
import TextInput from "ink-text-input";
import SelectInput from "ink-select-input";

import * as RandomWords from "random-words";

import detectPackageManager from "which-pm-runs";

import path from "path";
import fs from "fs";
import findConfig from "find-config";
import { version as packageVersion } from "../package.json";
import chalk from "chalk";
import { program /*, Option*/ } from "commander";

import { fileURLToPath } from "url";

import { execaCommand } from "execa";
import gradient from "gradient-string";

function printBanner() {
  const string = `🎈 PartyKit v${packageVersion}`;
  console.log(gradient.fruit(string));
  console.log(gradient.passion(`-`.repeat(string.length + 1)));
}

// duplicate dev.tsx
function* findAllFiles(
  root: string,
  { ignore: _ignore }: { ignore?: string[] } = {}
) {
  const dirs = [root];
  while (dirs.length > 0) {
    const dir = dirs.pop()!;
    const files = fs.readdirSync(dir);
    // TODO: handle ignore arg
    for (const file of files) {
      if (file.startsWith(".")) {
        continue;
      }

      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        if (file === "node_modules") {
          continue;
        }
        dirs.push(filePath);
      } else {
        yield path.relative(root, filePath);
      }
    }
  }
}

async function install({
  pkgManager,
  cwd,
}: {
  pkgManager: string;
  cwd: string;
}) {
  if (pkgManager === "yarn") ensureYarnLock({ cwd });
  return execaCommand(
    `${pkgManager} install${pkgManager === "npm" ? " --no-fund" : ""}`,
    {
      cwd,
      timeout: 90_000,
      stdio: "inherit",
    }
  );
}

function ensureYarnLock({ cwd }: { cwd: string }) {
  const yarnLock = findConfig("yarn.lock", { home: false, cwd });
  if (yarnLock) return;
  return fs.writeFileSync(path.join(cwd, "yarn.lock"), "", {
    encoding: "utf-8",
  });
}

async function initGit({ cwd }: { cwd: string }) {
  try {
    await execaCommand("git init", { cwd, stdio: "inherit" });
    await execaCommand("git add -A", { cwd, stdio: "inherit" });
    await execaCommand('git commit -m "Initial commit from PartyKit"', {
      cwd,
      stdout: "ignore",
      stderr: "inherit",
      shell: true,
    });
  } catch (e) {
    console.log("Failed to initialize git", e);
  }
}

export async function init(options: {
  name: string | undefined;
  install: boolean | undefined;
  git: boolean | undefined;
  typescript: boolean | undefined;
  yes: boolean | undefined;
  dryRun: boolean | undefined;
}) {
  printBanner();
  const originalCwd = process.cwd();

  const inputPathToProject = await new Promise<string>((resolve, reject) => {
    const randomName =
      options.name ||
      RandomWords.generate({
        exactly: 2,
        join: "-",
        minLength: 4,
      });

    if (options.yes) {
      resolve(randomName);
      return;
    }

    function done(text: string) {
      // TODO: make sure text is a valid path
      const isValidPathRegex = /^([a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+$/;

      if (!isValidPathRegex.test(text || randomName)) {
        console.log(
          chalk.red(
            `Invalid path. Please use a path like "randomName" or just "." to use the current directory. You entered "${text}"`
          )
        );
        reject(new Error("Invalid path"));
      }

      resolve(text || randomName);
      clear();
      unmount();
    }

    function GetPath() {
      const [text, setText] = React.useState("");
      return (
        <>
          <Text>Where should we create your project?</Text>
          <TextInput
            value={text}
            placeholder={` ./${randomName}`}
            onChange={setText}
            onSubmit={done}
          />
        </>
      );
    }

    const { unmount, clear } = render(<GetPath />);
  });

  const pathToProject = path.join(originalCwd, inputPathToProject);
  if (!options.dryRun) {
    fs.mkdirSync(pathToProject, { recursive: true });
    process.chdir(pathToProject);
    console.log(
      `‣ Creating project at ${chalk.bold(
        path.relative(originalCwd, pathToProject)
      )}`
    );
  } else {
    console.log(
      `⤬ Dry run: skipping creating project directory at ${chalk.bold(
        path.relative(originalCwd, pathToProject)
      )}`
    );
  }

  const logInstructions = [];

  const projectName = path.basename(pathToProject);

  // look for a package.json (that doesn't have workspaces defined)
  const packageJsonPath = findConfig("package.json");
  let shouldInitNewPackageJson = true;
  let shouldRunNpmInstall = false;
  if (packageJsonPath) {
    shouldInitNewPackageJson = false;
    const packageJson = JSON.parse(
      fs.readFileSync(packageJsonPath, { encoding: "utf-8" })
    );
    if (packageJson.workspaces) {
      shouldInitNewPackageJson = true;
    }
  }

  if (shouldInitNewPackageJson) {
    // init a new package.json
    const packageJson = {
      name: projectName,
      version: "0.0.0",
      private: true,
      scripts: {
        dev: "partykit dev",
        deploy: "partykit deploy",
      },
      dependencies: {
        partysocket: packageVersion,
      },
      devDependencies: {
        partykit: packageVersion,
      },
    };
    if (!options.dryRun) {
      fs.writeFileSync(
        path.join(pathToProject, "package.json"),
        JSON.stringify(packageJson, null, 2)
      );
      console.log(
        `‣ Created package.json at ${chalk.bold(
          path.relative(originalCwd, path.join(pathToProject, "package.json"))
        )}`
      );
    } else {
      console.log(
        `⤬ Dry run: skipping creating package.json at ${chalk.bold(
          path.relative(originalCwd, path.join(pathToProject, "package.json"))
        )}`
      );
    }
    logInstructions.push(
      `‣ To start your dev server, run: ${chalk.bold(
        "npm run dev"
      )} (CTRL+C to stop)`
    );
    logInstructions.push(
      `‣ To publish your project, run: ${chalk.bold("npm run deploy")}`
    );

    shouldRunNpmInstall = true;
  } else {
    // add dev and deploy scripts
    const packageJson = JSON.parse(
      fs.readFileSync(packageJsonPath!, { encoding: "utf-8" })
    );
    packageJson.scripts = packageJson.scripts || {};
    if (!packageJson.scripts.dev) {
      packageJson.scripts.dev = "partykit dev";
      logInstructions.push(
        `‣ To start your dev server, run: ${chalk.bold(
          "npm run dev"
        )} (CTRL+C to stop)`
      );
    } else {
      logInstructions.push(
        `‣ To start your dev server, run: ${chalk.bold(
          "npx partykit dev"
        )} (CTRL+C to stop)`
      );
    }

    if (!packageJson.scripts.deploy) {
      packageJson.scripts.dev = "partykit deploy";
      logInstructions.push(
        `‣ To publish your project, run: ${chalk.bold("npm run deploy")}`
      );
    } else {
      logInstructions.push(
        `‣ To publish your project, run: ${chalk.bold("npx partykit deploy")}`
      );
    }

    // add the partykit dependency
    packageJson.dependencies ||= {};
    packageJson.devDependencies ||= {};
    if (!packageJson.devDependencies.partykit) {
      packageJson.devDependencies.partykit = packageVersion;
      shouldRunNpmInstall = true;
    }

    if (!packageJson.dependencies.partysocket) {
      packageJson.dependencies.partysocket = packageVersion;
      shouldRunNpmInstall = true;
    }

    if (!options.dryRun) {
      fs.writeFileSync(packageJsonPath!, JSON.stringify(packageJson, null, 2));
      console.log(
        `‣ Updated package.json at ${chalk.bold(
          path.relative(originalCwd, packageJsonPath!)
        )}`
      );
    } else {
      console.log(
        `⤬ Dry run: skipping updating package.json at at ${chalk.bold(
          path.relative(originalCwd, packageJsonPath!)
        )}`
      );
    }
  }

  const shouldUseTypeScript = await new Promise<boolean>((resolve, _reject) => {
    if (options.yes || options.typescript) {
      resolve(true);
      return;
    }
    if (options.typescript === false) {
      resolve(false);
      return;
    }
    const { unmount, clear } = render(
      <>
        <Text>Do you plan to write typescript?</Text>
        <SelectInput
          items={[
            { label: "Yes", value: true },
            { label: "No", value: false },
          ]}
          onSelect={(item) => {
            resolve(item.value);
            clear();
            unmount();
          }}
        />
      </>
    );
  });

  // ok now let's copy over the files from `template` to the new project
  const templatePath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    shouldUseTypeScript ? "ts-template" : "js-template"
  );

  if (!options.dryRun) {
    for (const file of findAllFiles(templatePath)) {
      const source = path.join(templatePath, file);
      const dest = path.join(pathToProject, file);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(source, dest);
    }
    // rename gitignore to .gitignore
    fs.renameSync(
      path.join(pathToProject, "gitignore"),
      path.join(pathToProject, ".gitignore")
    );

    // replace $PROJECT_NAME in partykit.json
    const partykitJsonPath = path.join(pathToProject, "partykit.json");
    fs.writeFileSync(
      partykitJsonPath,
      fs
        .readFileSync(partykitJsonPath, { encoding: "utf-8" })
        .replace(/\$PROJECT_NAME/g, projectName)
    );
    console.log(
      `‣ Created a ${
        shouldUseTypeScript ? "TypeScript" : "JavaScript"
      } project at ${chalk.bold(path.relative(originalCwd, pathToProject))}`
    );
  } else {
    console.log(
      `⤬ Dry run: skipping copying ${
        shouldUseTypeScript ? "TypeScript" : "JavaScript"
      } template files to ${chalk.bold(
        path.relative(originalCwd, pathToProject)
      )}`
    );
  }

  if (!options.dryRun) {
    if (shouldRunNpmInstall && options.install !== false) {
      console.log(`‣ Installing dependencies...`);
      // run npm install from packageJsonPath
      await install({
        pkgManager: detectPackageManager()?.name || "npm",
        cwd: packageJsonPath ? path.dirname(packageJsonPath) : pathToProject,
      });
      console.log(`‣ Installed dependencies`);
    }
  } else {
    console.log(`⤬ Dry run: skipping installing dependencies`);
  }

  // step: [git]   Initialize a new git repository? (optional)
  const shouldInitGit = await new Promise<boolean>((resolve) => {
    if (options.yes || options.git === true) {
      resolve(true);
      return;
    }
    if (options.git === false) {
      resolve(false);
      return;
    }
    const { unmount, clear } = render(
      <>
        <Text>Initialize a new git repository?</Text>
        <SelectInput
          items={[
            { label: "Yes", value: true },
            { label: "No", value: false },
          ]}
          onSelect={(item) => {
            resolve(item.value);
            clear();
            unmount();
          }}
        />
      </>
    );
  });

  if (shouldInitGit) {
    if (!options.dryRun) {
      // initialize a new git repository
      await initGit({ cwd: pathToProject });
      console.log(`‣ Initialized a new git repository`);
    } else {
      console.log(`⤬ Dry run: skipping initializing git repository`);
    }
  }

  console.log(
    `\nYay! Your project is created at ${chalk.bold(
      path.relative(originalCwd, pathToProject)
    )}!`
  );

  console.log("\nNext steps:");
  console.log(
    `Enter your project directory with ${chalk.bold(
      `cd ${path.relative(originalCwd, pathToProject)}`
    )}`
  );

  if (logInstructions.length > 0) {
    console.log(`\n${logInstructions.join("\n")}\n`);
  }

  console.log(`🎈 That's it! If you need any help, reach out to us on:`);
  console.log(`- Discord: https://discord.gg/g5uqHQJc3z`);
  console.log(`- Github: https://github.com/partykit/partykit`);
  console.log(`- Twitter: https://twitter.com/partykit_io`);
}

program
  .name("create-partykit")
  .version(packageVersion, "-v, --version", "Output the current version")
  .description("Initialize a new project")
  .argument("[name]", "Name of the project")
  .option("--install", "Install dependencies")
  .option("--git", "Initialize a new git repository")
  .option("--typescript", "Initialize a new typescript project")
  .option("-y, --yes", "Skip prompts")
  .option("--dry-run", "Skip writing files and installing dependencies")
  .action(async (name, options) => {
    await init({
      name,
      yes: options.yes,
      dryRun: options.dryRun,
      install: options.install,
      git: options.git,
      typescript: options.typescript,
    });
  });

program.parse(process.argv);
