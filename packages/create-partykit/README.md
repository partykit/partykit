## create-partykit

_(Work in progress)_

Scaffolding for PartyKit projects.

## Usage

```bash
npm create partykit@latest
```

`create-partykit` automatically runs in interactive mode, but you can specify your project name and other options with command line arguments.

### CLI Flags

May be provided in place of prompts

| Name                    | Description                                           |
| :---------------------- | :---------------------------------------------------- |
| `--install`             | Install dependencies (default true).                  |
| `--git`                 | Initialize git repo (default true)                    |
| `--typescript         ` | Use TypeScript (default true)                         |
| `--yes` (`-y`)          | Skip all prompt by accepting defaults (default false) |
| `--dry-run`             | Walk through steps without executing (default false)  |

## Thanks

This is heavily based on the incredible [`create-astro`](https://www.npmjs.com/package/create-astro), just the cutest cli for starting a project, ever.
