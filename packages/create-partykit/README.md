## create-partykit

_(Work in progress!)_

Scaffolding for PartyKit projects.

## Usage

```bash
npm create partykit
```

`create-partykit` automatically runs in interactive mode, but you can also specify your project name and template with command line arguments.

```bash
npm create partykit@latest my-partykit-project -- --template minimal
```

[Check out the full list](#) of example templates, available on GitHub.

You can also use any GitHub repo as a template:

```bash
npm create partykit@latest my-partykit-project -- --template threepointone/tiptap-supabase-partykit
```

### CLI Flags

May be provided in place of prompts

| Name                         | Description                                            |
| :--------------------------- | :----------------------------------------------------- |
| `--template <name>`          | Specify your template.                                 |
| `--install` / `--no-install` | Install dependencies (or not).                         |
| `--git` / `--no-git`         | Initialize git repo (or not).                          |
| `--yes` (`-y`)               | Skip all prompt by accepting defaults.                 |
| `--no` (`-n`)                | Skip all prompt by declining defaults.                 |
| `--dry-run`                  | Walk through steps without executing.                  |
| `--typescript <option>`      | TypeScript option: `strict` / `strictest` / `relaxed`. |

## Thanks

This is heavily based on the incredible [`create-astro`](https://www.npmjs.com/package/create-astro), just the cutest cli for starting a project, ever.
