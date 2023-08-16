// import { render } from "ink";
// import * as React from "react";

import path from "path";
import fs from "fs";
import findConfig from "find-config";
import { version as packageVersion } from "../package.json";
import chalk from "chalk";
import { program /*, Option*/ } from "commander";

import { fileURLToPath } from "url";

import { execaCommand } from "execa";

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

export async function init(options: {
  name: string | undefined;
  yes: boolean | undefined;
}) {
  const pathToProject = path.join(process.cwd(), options.name || "");
  fs.mkdirSync(pathToProject, { recursive: true });
  process.chdir(pathToProject);

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
    fs.writeFileSync(
      path.join(pathToProject, "package.json"),
      JSON.stringify(packageJson, null, 2)
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
        `To start your dev server, run: ${chalk.bold("npm run dev")}\n`
      );
    } else {
      logInstructions.push(
        `To start your dev server, run: ${chalk.bold("npx partykit dev")}\n`
      );
    }

    if (!packageJson.scripts.deploy) {
      packageJson.scripts.dev = "partykit deploy";
      logInstructions.push(
        `To start your dev server, run: ${chalk.bold("npm run deploy")}\n`
      );
    } else {
      logInstructions.push(
        `To start your dev server, run: ${chalk.bold("npx partykit deploy")}\n`
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

    fs.writeFileSync(packageJsonPath!, JSON.stringify(packageJson, null, 2));
  }

  if (shouldRunNpmInstall) {
    // run npm install from packageJsonPath
    await execaCommand(
      findConfig("yarn.lock", { home: false })
        ? "yarn"
        : findConfig("pnpm-lock.yaml", { home: false })
        ? "pnpm install"
        : "npm install",
      {
        cwd: packageJsonPath ? path.dirname(packageJsonPath) : pathToProject,
        stdio: "inherit",
      }
    );
  }

  // ok now let's copy over the files from `template` to the new project
  const templatePath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "template"
  );
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
}

program
  .name("create-partykit")
  .version(packageVersion, "-v, --version", "Output the current version")
  .description("Initialize a new project")
  .argument("[name]", "Name of the project")
  .option("-y, --yes", "Skip prompts")
  .action(async (name, options) => {
    await init({
      name,
      yes: options.yes,
    });
  });

program.parse(process.argv);
