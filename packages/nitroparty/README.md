## nitroparty

⚡️ nitro ⤫ partykit 🎈

### install

```bash
npm install partykit nitropack nitroparty --save-dev
```

### setup

```ts
// nitro.config.ts
export default defineNitroConfig({
  extends: "nitroparty",
});
```

```jsonc
// partykit.json
{
  "$schema": "https://www.partykit.io/schema.json",
  "name": "my-party",
  "main": "./.output/server/index.mjs",
  "compatibilityDate": "2023-12-26",
  "define": {
    "process.env.NITRO_ENV_PREFIX": "'_'",
    "process.env": "{}"
  },
  "build": {
    "command": "npx nitropack build",
    "watch": "routes"
  },
  "serve": {
    "build": "./client/index.ts",
    "path": "public"
  }
}
```

```jsonc
// package.json
{
  // ...
  "scripts": {
    "prepare": "nitropack prepare",
    "dev": "partykit dev",
    "deploy": "partykit deploy"
  }
}
```
