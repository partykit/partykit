import fs from "fs";
import path from "path";

import * as React from "react";
import chalk from "chalk";
import { Option, program } from "commander";
import { execaCommand, execaCommandSync } from "execa";
import { findUpSync } from "find-up";
import { downloadTemplate } from "giget";
import gradient from "gradient-string";
import { render, Text } from "ink";
import SelectInput from "ink-select-input";
import TextInput from "ink-text-input";
import * as RandomWords from "random-words";
import detectPackageManager from "which-pm-runs";

import { version as packageVersion } from "../package.json";

function printBanner() {
  const string = `🎈 PartyKit`;
  console.log(gradient.fruit(string));
  console.log(gradient.passion(`-`.repeat(string.length + 1)));
}

async function install({
  pkgManager,
  cwd
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
      stdio: "inherit"
    }
  );
}

function ensureYarnLock({ cwd }: { cwd: string }) {
  const yarnLock = findUpSync("yarn.lock", { cwd });
  if (yarnLock) return;
  return fs.writeFileSync(path.join(cwd, "yarn.lock"), "", {
    encoding: "utf-8"
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
        stderr: "inherit"
      }
    );

    // Try to create the repository with the HEAD branch of defaultBranchName ?? `main`.
    await execaCommand(
      `git init --initial-branch ${defaultBranchName ?? "main"}`,
      {
        cwd,
        stdout: "ignore",
        stderr: "inherit"
      }
    );
  } catch {
    // Unable to create the repo with a HEAD branch name, so just fall back to the default.
    await execaCommand("git init", {
      cwd,
      stdout: "ignore",
      stderr: "inherit"
    });
  }
}

async function initGit({ cwd }: { cwd: string }) {
  try {
    await initializeGitRepo(cwd);

    await execaCommand("git add -A", {
      cwd,
      stdout: "ignore",
      stderr: "inherit"
    });
    await execaCommand('git commit -m "Initial commit from PartyKit"', {
      cwd,
      stdout: "ignore",
      stderr: "inherit",
      shell: true
    });
  } catch (e) {
    console.log("Failed to initialize git", e);
  }
}

const templateChoices = {
  typescript: "TypeScript starter",
  javascript: "JavaScript starter",
  react: "React starter",
  "chat-room": "Chat room starter with AI",
  "text-editor": "Text editor starter using Yjs"

  // game: "A simple multiplayer game",
  // "text-editor": "A shared text editor",
  // "video-chat": "A video chat app",
  // whiteboard: "A collaborative whiteboard",
  // pubsub: "A simple pubsub server",
  // remix: "A simple remix starter"
  // remix-spa: "A simple remix + vite starter"
  // nuxt: "A simple nuxt js starter"
};

export async function init(options: {
  name: string | undefined;
  install: boolean | undefined;
  git: boolean | undefined;
  yes: boolean | undefined;
  dryRun: boolean | undefined;
  hideBanner: boolean | undefined;
  template: keyof typeof templateChoices | undefined;
}) {
  if (!options.hideBanner) {
    printBanner();
  }
  const originalCwd = process.cwd();

  const inputPathToProject = await new Promise<string>((resolve, reject) => {
    const randomName =
      options.name ||
      RandomWords.generate({
        exactly: 2,
        join: "-",
        minLength: 4
      });

    if (options.yes) {
      resolve(randomName);
      return;
    }

    function done(input: string) {
      const text = input || randomName;
      if (path.isAbsolute(text)) {
        console.log(
          chalk.red(
            `Absolute paths not supported. Please use a relative path like "randomName", "./randomName", or just "." to use the current directory. You entered "${text}"`
          )
        );
        reject(new Error("Absolute paths not supported"));
      }

      const parsed = path.parse(text);
      const isValidPathRegex = /^\.*?([a-zA-Z0-9_-]{0,}\/)*[a-zA-Z0-9_-]+$/;
      const isValidPath = (path: string) =>
        path === "." || path === ".." || isValidPathRegex.test(path);
      if (!isValidPath(parsed.base) || !isValidPath(parsed.name)) {
        console.log(
          chalk.red(
            `Invalid path. Please use a valid directory name like "randomName". You entered "${input}"`
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
    console.log(`‣ Creating project at ${chalk.bold(pathToProject)}`);
  } else {
    console.log(
      `⤬ Dry run: skipping creating project directory at ${chalk.bold(
        pathToProject
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

  const templateChoice = (await new Promise<string>((resolve, _reject) => {
    if (options.template) {
      resolve(options.template);
      return;
    }

    if (options.yes) {
      resolve("typescript");
      return;
    }

    const { unmount, clear } = render(
      <>
        <Text>Which template would you like to use?</Text>
        <SelectInput
          items={Object.entries(templateChoices).map(([value, label]) => ({
            value,
            label
          }))}
          onSelect={(item) => {
            resolve(item.value);
            clear();
            unmount();
          }}
        />
      </>
    );
  })) as keyof typeof templateChoices;

  if (!options.dryRun) {
    // copy template files to pathToProject
    await downloadTemplate(
      templateChoice.indexOf(":") >= 0
        ? templateChoice
        : templateChoice.indexOf("/") >= 0
          ? `github:${templateChoice}`
          : `github:partykit/templates/templates/${templateChoice}`,
      {
        dir: pathToProject
      }
    );

    const today = new Date();

    // replace $PROJECT_NAME & $COMPATIBILITY_DATE in partykit.json
    const partykitJsonPath = path.join(pathToProject, "partykit.json");
    fs.writeFileSync(
      partykitJsonPath,
      fs
        .readFileSync(partykitJsonPath, { encoding: "utf-8" })
        .replace(/\$PROJECT_NAME/g, projectName)
        .replace(
          /\$COMPATIBILITY_DATE/g,
          `${today.getFullYear()}-${(today.getMonth() + 1)
            .toString()
            .padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`
        )
    );
    // do the same with README.md
    const readmePath = path.join(pathToProject, "README.md");
    fs.writeFileSync(
      readmePath,
      fs
        .readFileSync(readmePath, { encoding: "utf-8" })
        .replace(/\$PROJECT_NAME/g, projectName)
    );

    // replace name in package.json with projectName
    const packageJsonPath = path.join(pathToProject, "package.json");
    const packageJsonContents = JSON.parse(
      fs.readFileSync(packageJsonPath, { encoding: "utf-8" })
    );
    packageJsonContents.name = projectName;
    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(packageJsonContents, null, 2) + "\n"
    );

    // if there's a partykit.init.js file, run it
    const partykitInitPath = path.join(pathToProject, "partykit.init.js");
    if (fs.existsSync(partykitInitPath)) {
      execaCommandSync("node partykit.init.js", {
        shell: true,
        // we keep these two as "inherit" so that
        // logs are still visible.
        stdout: "inherit",
        stderr: "inherit"
      });
    }

    console.log(
      `‣ Created a new "${
        templateChoices[templateChoice] || `partykit/${templateChoice}`
      }" project at ${chalk.bold(path.relative(originalCwd, pathToProject))}`
    );
  } else {
    console.log(
      `⤬ Dry run: skipping copying "${
        templateChoices[templateChoice] || `partykit/${templateChoice}`
      }" template files to ${chalk.bold(
        path.relative(originalCwd, pathToProject)
      )}`
    );
  }

  // always install dependencies
  if (!options.dryRun) {
    console.log(`‣ Installing dependencies...`);
    // run npm install from packageJsonPath
    await install({
      pkgManager: detectPackageManager()?.name || "npm",
      cwd: packageInstallPath
    });
    console.log(`‣ Installed dependencies`);
  } else {
    console.log(`⤬ Dry run: skipping installing dependencies`);
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
            { label: "No", value: false }
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

  console.log(`\nThat's it! If you need any help, reach out to us on:`);
  console.log(`- Discord: https://discord.gg/g5uqHQJc3z`);
  console.log(`- Github: https://github.com/partykit/partykit`);
  console.log(`- Twitter: https://twitter.com/partykit_io\n`);
}

// for when we call this via the main CLI
const hideBanner = new Option("--hide-banner", "Hide intro banner");
hideBanner.hidden = true;

program
  .name("create-partykit")
  .version(packageVersion, "-v, --version", "Output the current version")
  .description("Initialize a new project")
  .argument("[name]", "Name of the project")
  .option("--install", "Install dependencies")
  .option("--git", "Initialize a new git repository")
  .addOption(
    new Option(
      "-t, --template [template]",
      `Template to use (${Object.keys(templateChoices).join(", ")})`
    )
  )
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
      template: options.template
    });
  });

program.parse(process.argv);
