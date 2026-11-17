# Lazy Gamer

Build a sleepy little town, collect stock, and crack three visual cheat codes. Your town is saved in the browser.

[Play Lazy Gamer](https://lazygamer.vercel.app/)

## Play locally

1. Open Terminal in this project folder.
2. Run these commands.

   ```sh
   npm ci
   npm run dev
   ```

3. Open the local URL printed in Terminal. Leave Terminal running while you play.

## Check the release

```sh
npm test
npm run build
npm run preview
```

The static production files are in `dist/`. Settings, progress, and stock are saved per device and browser. The web manifest, favicon, Apple touch icon, and maskable install icon are in `public/`.

## Publish

1. Sign in to GitHub as `aashi-dani` and open [lazy-gamer](https://github.com/aashi-dani/lazy-gamer). If it needs to be created, use [New repository](https://github.com/new), name it `lazy-gamer`, and leave README, .gitignore, and license unchecked.
2. Authorize this Mac to push with the GitHub CLI. Run `brew install gh` if needed, then run `gh auth login --hostname github.com --git-protocol https --web` and follow the one-time browser prompts. Run `gh auth setup-git --hostname github.com`. From this project folder, `git push -u origin main` uploads the committed game. [GitHub CLI login guide](https://cli.github.com/manual/gh_auth_login)
3. Open [Vercel New Project](https://vercel.com/new) and sign in with GitHub. Import `aashi-dani/lazy-gamer`. Leave the root at the repository root, use the Vite preset, and click **Deploy**. [Vercel’s GitHub guide](https://vercel.com/docs/git/vercel-for-github)
4. Open the production URL in a private browser window. Confirm the town loads publicly, select a starter, collect stock, and reopen the URL on a phone to verify its layout and save.
