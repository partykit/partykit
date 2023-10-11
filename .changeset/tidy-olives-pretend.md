---
"partysocket": patch
---

partysocket: don't bundle react into the built assets

tsup ignores pnly dependencies marked in package.json under dependencies/devDependencies. Since we don't have react in here, it was bundling it into partysocket/react, leading to multiple versions being loaded into the same space. This explicity excludes react from the bundle.
