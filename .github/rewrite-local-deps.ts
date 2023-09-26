import { execaSync } from "execa";
import * as fs from "fs";
import * as path from "path";

process.chdir(process.cwd());

// get list of all workspaces

type WorkSpace = {
  resolved: string;
  version: string;
  overriden: boolean;
  dependencies?: Record<string, WorkSpace>;
};

const { stdout: workspacesJSON } = execaSync(
  "npm ls --workspaces --json --depth 0",
  {
    shell: true,
  }
);

const workspaces = JSON.parse(workspacesJSON).dependencies as Record<
  string,
  WorkSpace
>;

for (const [_name, workspace] of Object.entries(workspaces)) {
  const pathToPackage = path.join(
    "./node_modules",
    workspace.resolved.replace("file:", "")
  );
  // skip anything that's not a package
  if (!pathToPackage.startsWith("packages/")) {
    continue;
  }
  const pathToPackageJson = path.join(pathToPackage, "package.json");
  const packageDetails = JSON.parse(fs.readFileSync(pathToPackageJson, "utf8"));

  let modified = false;
  // for every dependency in the package.json
  // if it's a workspace, replace the version with the workspace version
  // if it's not a workspace, leave it alone
  for (const packageKey of [
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "optionalDependencies",
  ]) {
    const knownDependencies = packageDetails[packageKey] || {};

    for (const [depName, _depVersion] of Object.entries(knownDependencies)) {
      if (depName in workspaces) {
        modified = true;
        packageDetails[packageKey][depName] = workspaces[
          depName
        ].version.startsWith("0.0.0-")
          ? workspaces[depName].version
          : `^${workspaces[depName].version}`;
      }
    }
  }
  if (modified) {
    fs.writeFileSync(
      pathToPackageJson,
      JSON.stringify(packageDetails, null, 2) + "\n"
    );
  }
}
