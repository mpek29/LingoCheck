# LingoCheck

A multilingual dataset auditor for German, English, and French vocabulary.
Built with React Native (Expo) and runs as a web app, Android, iOS, or Windows desktop app.

Load CSV datasets, swipe through entries to approve or reject them, edit corrections, and export your results.

---

## Web app — Ubuntu setup

### Prerequisites

Install **Node.js 20+** via [nvm](https://github.com/nvm-sh/nvm):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
```

Verify:

```bash
node -v   # v20.x.x
npm -v    # 10.x.x
```

### First-time project setup

```bash
# Clone the repo and enter the directory
git clone <repo-url> LingoCheck
cd LingoCheck

# Install dependencies
npm install
```

---

## Run the web app in development

```bash
npm run web
# or equivalently
npx expo start --web
```

This starts Metro bundler and opens the app in your browser at `http://localhost:8081`.

Metro watches `assets/data/*.csv` and automatically regenerates `src/data/registry.ts`
whenever a dataset file is added, removed, or modified — no manual rebuild step needed.

---

## Build and run a production release

### 1. Export a static build

```bash
npx expo export --platform web
```

This produces an optimized, minified static site in the `dist/` folder.

### 2. Serve the release locally

Install a static file server if you don't have one:

```bash
npm install -g serve
```

Then serve the build:

```bash
serve dist
```

The app is now available at `http://localhost:3000`.

### 3. Deploy to a web server (optional)

Copy the `dist/` folder to any static hosting provider or web server.
Example with nginx — copy the build output to your web root:

```bash
sudo cp -r dist/* /var/www/html/
```

---

## Adding datasets

Open the app in the browser, go to the **Dataset** section on the home screen, and tap **+ Add CSV**.
The file is read locally by the browser, stored in `localStorage`, and immediately available as a new dataset card.
Your choice history (approve / reject) and the uploaded file both survive page reloads and app restarts.
Tap the **×** button on a custom dataset card to remove it.

### CSV column format

| Column | Description |
|---|---|
| `de_word` | German word |
| `en_word` | English word |
| `fr_word` | French word |
| `de_sentence` | German example sentence |
| `en_sentence` | English example sentence |
| `fr_sentence` | French example sentence |

---