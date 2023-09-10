import { Text, render } from "ink";
import * as React from "react";
import TextInput from "ink-text-input";
import SelectInput from "ink-select-input";

import * as RandomWords from "random-words";

import detectPackageManager from "which-pm-runs";

import path from "path";
import fs from "fs";
import { findUpSync } from "find-up";
import {
  version as packageVersion,
  devDependencies as packageDevDependencies,
} from "../package.json";

import chalk from "chalk";
import { program, Option } from "commander";

import { fileURLToPath } from "url";

import { execaCommand } from "execa";
import gradient from "gradient-string";

function printBanner() {
  const string = `🎈 PartyKit`;
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
  const yarnLock = findUpSync("yarn.lock", { cwd });
  if (yarnLock) return;
  return fs.writeFileSync(path.join(cwd, "yarn.lock"), "", {
    encoding: "utf-8",
  });
}

/**
 * Initialize a new Worker project with a git repository.
 *
 * We want the branch to be called `main` but earlier versions of git do not support `--initial-branch`.
 * If that is the case then we just fallback to the default initial branch name.
 */
export async function initializeGitRepo(cwd: string) {
  try {
    // Get the default init branch name
    const { stdout: defaultBranchName } = await execaCommand(
      "git config --get init.defaultBranch",
      {
        cwd,
        stdout: "ignore",
        stderr: "inherit",
      }
    );

    // Try to create the repository with the HEAD branch of defaultBranchName ?? `main`.
    await execaCommand(
      `git init --initial-branch ${defaultBranchName ?? "main"}`,
      {
        cwd,
        stdout: "ignore",
        stderr: "inherit",
      }
    );
  } catch {
    // Unable to create the repo with a HEAD branch name, so just fall back to the default.
    await execaCommand("git init", {
      cwd,
      stdout: "ignore",
      stderr: "inherit",
    });
  }
}

async function initGit({ cwd }: { cwd: string }) {
  try {
    await initializeGitRepo(cwd);

    await execaCommand("git add -A", {
      cwd,
      stdout: "ignore",
      stderr: "inherit",
    });
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
  hideBanner: boolean | undefined;
}) {
  if (!options.hideBanner) {
    printBanner();
  }
  const originalCwd = process.cwd();

  let latestPartyKitVersion = "*";
  let latestPartySocketVersion = "*";
  if (packageVersion.startsWith("0.0.0-")) {
    // this means it's a beta, so let's use this version everywhere
    latestPartyKitVersion = packageVersion;
    latestPartySocketVersion = packageVersion;
  } else {
    try {
      latestPartyKitVersion = await fetch(
        `https://registry.npmjs.org/partykit/latest`
      )
        .then((res) => res.json())
        .then((res) => res.version as string);

      latestPartySocketVersion = await fetch(
        `https://registry.npmjs.org/partysocket/latest`
      )
        .then((res) => res.json())
        .then((res) => res.version as string);
    } catch (e) {
      console.error(
        "Could not fetch latest versions of partykit and partysocket, defaulting to *"
      );
      console.debug(e);
      latestPartyKitVersion = "*";
      latestPartySocketVersion = "*";
    }
  }

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

  const projectName = path.basename(pathToProject);

  // look for a package.json (that doesn't have workspaces defined)
  let packageInstallPath = pathToProject;
  const existingPackageJsonPath = findUpSync("package.json");

  if (existingPackageJsonPath) {
    const packageJson = JSON.parse(
      fs.readFileSync(existingPackageJsonPath, { encoding: "utf-8" })
    );
    if (packageJson.workspaces) {
      // this means we're in a mono repo, so
      // we'll have to run npm install from this dir
      packageInstallPath = path.dirname(existingPackageJsonPath);
    }
  }

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
      partysocket: latestPartySocketVersion,
    },
    devDependencies: {
      partykit: latestPartyKitVersion,
      typescript: packageDevDependencies.typescript,
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
    // do the same with README.md
    const readmePath = path.join(pathToProject, "README.md");
    fs.writeFileSync(
      readmePath,
      fs
        .readFileSync(readmePath, { encoding: "utf-8" })
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

  const shouldInstallDependencies = await new Promise<boolean>(
    (resolve, _reject) => {
      if (options.yes || options.install) {
        resolve(true);
        return;
      }
      if (options.install === false) {
        resolve(false);
        return;
      }
      const { unmount, clear } = render(
        <>
          <Text>Would you like to install dependencies?</Text>
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
    }
  );

  if (shouldInstallDependencies === true) {
    if (!options.dryRun) {
      console.log(`‣ Installing dependencies...`);
      // run npm install from packageJsonPath
      await install({
        pkgManager: detectPackageManager()?.name || "npm",
        cwd: packageInstallPath,
      });
      console.log(`‣ Installed dependencies`);
    } else {
      console.log(`⤬ Dry run: skipping installing dependencies`);
    }
  }

  // detect if we're inside a git repo, even if several directories up
  const gitRepoPath = findUpSync(".git", { type: "directory" });

  if (gitRepoPath) {
    console.log(
      `‣ Detected git repository at ${chalk.bold(
        path.relative(originalCwd, gitRepoPath)
      )}`
    );
  }

  // step: [git]   Initialize a new git repository? (optional)
  const shouldInitGit = await new Promise<boolean>((resolve) => {
    if (options.git === false || gitRepoPath) {
      resolve(false);
      return;
    }
    if (options.yes || options.git === true) {
      resolve(true);
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
    `\n🎈 Yay! Your project is created at ${chalk.bold(
      path.relative(originalCwd, pathToProject)
    )}!`
  );

  console.log("\nNext steps:");
  console.log(
    `‣ Enter your project directory with ${chalk.bold(
      `cd ${path.relative(originalCwd, pathToProject)}`
    )}`
  );

  console.log(
    `‣ To start your dev server, run: ${chalk.bold(
      "npm run dev"
    )} (CTRL+C to stop)`
  );
  console.log(
    `‣ To publish your project, run: ${chalk.bold("npm run deploy")}`
  );

  console.log(`That's it! If you need any help, reach out to us on:`);
  console.log(`- Discord: https://discord.gg/g5uqHQJc3z`);
  console.log(`- Github: https://github.com/partykit/partykit`);
  console.log(`- Twitter: https://twitter.com/partykit_io`);
}

// for when we call this via the main CLI
const hideBanner = new Option("--hide-banner", "Persist local state");
hideBanner.hidden = true;

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
  .addOption(hideBanner)
  .action(async (name, options) => {
    await init({
      name,
      yes: options.yes,
      dryRun: options.dryRun,
      install: options.install,
      git: options.git,
      hideBanner: options.hideBanner,
      typescript: options.typescript,
    });
  });

program.parse(process.argv);
