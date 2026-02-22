# 👺 DemonOS

A fully-featured OS-style browser interface with built-in unblocked proxy support.

![DemonOS](https://img.shields.io/badge/DemonOS-v6.6.6-ff2a2a?style=for-the-badge)

## Features

- 🖥️ Full desktop OS experience (draggable windows, taskbar, start menu)
- 🔥 **DemonProxy** — UV + Scramjet proxy engines
- 🌐 Transport selector: **Epoxy** (WASM TCP) or **Libcurl** (cURL WASM)
- 💀 Built-in Terminal with commands
- 🎮 Hellarcade — 3 playable mini-games (Snake, Breakout, Pong)
- ⚙️ Settings panel (themes, accent colors, scanlines)
- 📱 Responsive particle background + scanline effects

## Deploy to GitHub Pages

### Method 1: GitHub Actions (Recommended)

1. Fork/upload this repo to GitHub
2. Go to **Settings → Pages**
3. Set source to **GitHub Actions**
4. Push to `main` branch — it deploys automatically!

### Method 2: Manual

1. Go to **Settings → Pages**
2. Set source to **Deploy from a branch**
3. Select `main` branch, root `/` folder

## Full Proxy Setup (Backend Required)

The UV/Scramjet proxy engines need a backend bare server with WebSocket support. GitHub Pages only serves static files.

### Deploy a backend server:

```bash
# Clone and set up a bare server
git clone https://github.com/tomphttp/bare-server-node
cd bare-server-node
npm install
npm start
```

Then deploy to **Railway**, **Render**, or **Heroku** and update the bare server URL in `proxy.html`.

### Recommended backends:
- [bare-server-node](https://github.com/tomphttp/bare-server-node)
- [Wisp server](https://github.com/MercuryWorkshop/wisp-server-node) (for Epoxy transport)

## Tech Stack

| Component | Tech |
|-----------|------|
| Proxy Engine 1 | [Ultraviolet (UV)](https://github.com/titaniumnetwork-dev/Ultraviolet) |
| Proxy Engine 2 | [Scramjet](https://github.com/MercuryWorkshop/scramjet) |
| Transport 1 | [Epoxy](https://github.com/MercuryWorkshop/epoxy-tls) (WASM TCP over WS) |
| Transport 2 | [Libcurl.js](https://github.com/ading2210/libcurl.js) (cURL WASM) |
| UI | Vanilla HTML/CSS/JS |
| Font | Orbitron + Share Tech Mono + Rajdhani |

## License

WTFPL — Do What The F*** You Want
