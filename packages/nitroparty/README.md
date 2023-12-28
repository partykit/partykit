## nitroparty

⚡️ nitro ⤫ partykit 🎈

### setup

```ts
// nitro.config.ts
export default defineNitroConfig({
  extends: "nitroparty",
});
```

```json
// package.json
{
  // ...
  "scripts": {
    "prepare": "nitropack prepare",
    "dev": "partykit dev",
    "build": "nitropack build",
    "deploy": "npm run build && partykit deploy"
  },
  "devDependencies": {
    "nitropack": "^2.8.1"
  }
}
```
