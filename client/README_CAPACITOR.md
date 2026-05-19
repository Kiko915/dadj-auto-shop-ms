Capacitor Quick Start (Client)

This app can be packaged with Capacitor. Follow these steps locally (one-time installs may be required):

1. Install Capacitor core & CLI

```bash
cd client
npm install @capacitor/core @capacitor/cli --save-dev
```

2. Initialize Capacitor (creates native folders)

```bash
npm run build
npm run cap:init
# add platforms
npm run cap:add:android
# or
npm run cap:add:ios
# copy web assets to native projects
npm run cap:copy
# open native project in Android Studio / Xcode
npm run cap:open:android
npm run cap:open:ios
```

Notes:
- The `webDir` is `dist` which is produced by `npm run build`.
- Do not commit large native binaries to the repo.
- Use a server-side proxy for any NLP API keys; do not bundle secrets in the app.
