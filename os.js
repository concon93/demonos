/* ===== DemonOS Core JavaScript ===== */
(function () {
  'use strict';

  // ===== STATE =====
  const state = {
    windows: {},
    nextZ: 200,
    nextWinId: 1,
    dragging: null,
    resizing: null,
    settings: {
      theme: 'infernal',
      scanlines: 'on',
      accent: '#ff2a2a',
      defaultEngine: 'uv',
    },
    proxy: {
      engine: 'uv',
      transport: 'epoxy',
    },
    terminal: {
      history: [],
      historyIdx: -1,
    },
    game: {
      current: null,
      loop: null,
    }
  };

  // ===== WINDOW CONFIGS =====
  const WIN_CONFIG = {
    proxy:    { title: '🔥 DEMONPROXY',    w: 750, h: 620 },
    browser:  { title: '🌐 INFERNONET',    w: 820, h: 560 },
    settings: { title: '⚙️ SETTINGS',      w: 420, h: 380 },
    terminal: { title: '💀 TERMINAL',      w: 560, h: 420 },
    games:    { title: '🎮 HELLARCADE',    w: 560, h: 460 },
    about:    { title: '👁️ ABOUT',         w: 460, h: 480 },
  };

  // ===== BOOT SEQUENCE =====
  const bootMessages = [
    '[OK] Infernal kernel loaded',
    '[OK] Mounting /hell partition',
    '[OK] Initializing DemonOS v6.6.6',
    '[OK] Loading UV proxy engine',
    '[OK] Loading Scramjet engine',
    '[OK] Initializing Epoxy transport',
    '[OK] Initializing Libcurl transport',
    '[OK] Starting daemon processes',
    '[OK] Configuring network interfaces',
    '[OK] DemonOS ready',
  ];

  function boot() {
    const log = document.getElementById('boot-log');
    const bar = document.getElementById('boot-bar-fill');
    let i = 0;
    const interval = setInterval(() => {
      if (i < bootMessages.length) {
        const line = document.createElement('div');
        line.textContent = bootMessages[i];
        log.appendChild(line);
        bar.style.width = ((i + 1) / bootMessages.length * 100) + '%';
        i++;
      } else {
        clearInterval(interval);
        setTimeout(launchDesktop, 500);
      }
    }, 180);
  }

  function launchDesktop() {
    document.getElementById('boot-screen').style.transition = 'opacity 0.5s';
    document.getElementById('boot-screen').style.opacity = '0';
    setTimeout(() => {
      document.getElementById('boot-screen').style.display = 'none';
      const desktop = document.getElementById('desktop');
      desktop.classList.remove('hidden');
      desktop.classList.add('theme-' + state.settings.theme);
      startClock();
      startParticles();
      bindEvents();
    }, 500);
  }

  // ===== CLOCK =====
  function startClock() {
    function tick() {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      document.getElementById('clock').textContent = `${h}:${m}:${s}`;
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const d = days[now.getDay()];
      const mo = String(now.getMonth() + 1).padStart(2, '0');
      const dy = String(now.getDate()).padStart(2, '0');
      document.getElementById('tray-date').textContent = `${d} ${mo}/${dy}`;
    }
    tick();
    setInterval(tick, 1000);
  }

  // ===== PARTICLES =====
  function startParticles() {
    const canvas = document.getElementById('bg-canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    const particles = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.3,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        a: Math.random(),
      });
    }
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const accent = state.settings.accent;
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = accent + Math.floor(p.a * 80).toString(16).padStart(2, '0');
        ctx.fill();
        p.x += p.vx; p.y += p.vy; p.a = 0.2 + 0.8 * Math.abs(Math.sin(Date.now() / 3000 + p.x));
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      });
      requestAnimationFrame(draw);
    }
    draw();
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
  }

  // ===== EVENTS =====
  function bindEvents() {
    // Start button
    document.getElementById('start-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = document.getElementById('start-menu');
      menu.classList.toggle('hidden');
      document.getElementById('start-btn').classList.toggle('active', !menu.classList.contains('hidden'));
    });

    // Desktop icons
    document.querySelectorAll('.desktop-icon').forEach(el => {
      el.addEventListener('dblclick', () => openWindow(el.dataset.window));
    });

    // Start menu items
    document.querySelectorAll('.start-item').forEach(el => {
      el.addEventListener('click', () => {
        openWindow(el.dataset.window);
        document.getElementById('start-menu').classList.add('hidden');
        document.getElementById('start-btn').classList.remove('active');
      });
    });

    // Close start menu on outside click
    document.addEventListener('click', () => {
      document.getElementById('start-menu').classList.add('hidden');
      document.getElementById('start-btn').classList.remove('active');
    });

    // Drag/resize on mouse move
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  // ===== WINDOW MANAGEMENT =====
  function openWindow(type) {
    // Bring existing to front if open
    for (const id in state.windows) {
      if (state.windows[id].type === type) {
        focusWindow(id);
        return;
      }
    }

    const cfg = WIN_CONFIG[type];
    const id = 'win-' + state.nextWinId++;
    const tpl = document.getElementById('tpl-' + type);
    const content = tpl.content.cloneNode(true);

    // Offset new windows
    const offset = Object.keys(state.windows).length * 28;
    const x = Math.min(80 + offset, window.innerWidth - cfg.w - 40);
    const y = Math.min(40 + offset, window.innerHeight - cfg.h - 80);

    const win = document.createElement('div');
    win.className = 'os-window focused';
    win.id = id;
    win.style.left = x + 'px';
    win.style.top = y + 'px';
    win.style.width = cfg.w + 'px';
    win.style.height = cfg.h + 'px';
    win.style.zIndex = ++state.nextZ;

    win.innerHTML = `
      <div class="win-titlebar" data-winid="${id}">
        <div class="win-title">${cfg.title}</div>
        <div class="win-controls">
          <button class="win-btn win-btn-min" title="Minimize">−</button>
          <button class="win-btn win-btn-max" title="Maximize">□</button>
          <button class="win-btn win-btn-close" title="Close">×</button>
        </div>
      </div>
      <div class="win-body"></div>
      <div class="win-resize" data-winid="${id}"></div>
    `;

    win.querySelector('.win-body').appendChild(content);

    document.getElementById('windows-container').appendChild(win);

    state.windows[id] = { type, el: win, minimized: false, maximized: false, prevRect: null };

    bindWindowControls(id);
    initWindowContent(id, type);
    updateTaskbar();
    focusWindow(id);
  }

  function bindWindowControls(id) {
    const win = state.windows[id].el;

    // Close
    win.querySelector('.win-btn-close').addEventListener('click', () => closeWindow(id));

    // Minimize
    win.querySelector('.win-btn-min').addEventListener('click', () => minimizeWindow(id));

    // Maximize
    win.querySelector('.win-btn-max').addEventListener('click', () => maximizeWindow(id));

    // Focus on click
    win.addEventListener('mousedown', () => focusWindow(id));

    // Drag
    win.querySelector('.win-titlebar').addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('win-btn')) return;
      const rect = win.getBoundingClientRect();
      state.dragging = { id, offX: e.clientX - rect.left, offY: e.clientY - rect.top };
      e.preventDefault();
    });

    // Resize
    win.querySelector('.win-resize').addEventListener('mousedown', (e) => {
      const rect = win.getBoundingClientRect();
      state.resizing = { id, startX: e.clientX, startY: e.clientY, startW: rect.width, startH: rect.height };
      e.preventDefault();
    });
  }

  function closeWindow(id) {
    if (!state.windows[id]) return;
    const win = state.windows[id].el;
    win.style.transition = 'opacity 0.2s, transform 0.2s';
    win.style.opacity = '0';
    win.style.transform = 'scale(0.95)';
    if (state.windows[id].type === 'games') stopGame();
    setTimeout(() => {
      win.remove();
      delete state.windows[id];
      updateTaskbar();
    }, 200);
  }

  function minimizeWindow(id) {
    const w = state.windows[id];
    w.minimized = !w.minimized;
    w.el.style.display = w.minimized ? 'none' : 'flex';
    updateTaskbar();
  }

  function maximizeWindow(id) {
    const w = state.windows[id];
    if (!w.maximized) {
      const rect = w.el.getBoundingClientRect();
      w.prevRect = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
      w.el.style.left = '0';
      w.el.style.top = '0';
      w.el.style.width = '100vw';
      w.el.style.height = `calc(100vh - 44px)`;
      w.maximized = true;
    } else {
      const r = w.prevRect;
      w.el.style.left = r.left + 'px';
      w.el.style.top = r.top + 'px';
      w.el.style.width = r.width + 'px';
      w.el.style.height = r.height + 'px';
      w.maximized = false;
    }
  }

  function focusWindow(id) {
    Object.values(state.windows).forEach(w => w.el.classList.remove('focused'));
    if (state.windows[id]) {
      state.windows[id].el.classList.add('focused');
      state.windows[id].el.style.zIndex = ++state.nextZ;
      if (state.windows[id].minimized) {
        state.windows[id].minimized = false;
        state.windows[id].el.style.display = 'flex';
      }
    }
    updateTaskbar();
  }

  function onMouseMove(e) {
    if (state.dragging) {
      const { id, offX, offY } = state.dragging;
      const win = state.windows[id].el;
      let x = e.clientX - offX;
      let y = e.clientY - offY;
      x = Math.max(0, Math.min(x, window.innerWidth - 200));
      y = Math.max(0, Math.min(y, window.innerHeight - 80));
      win.style.left = x + 'px';
      win.style.top = y + 'px';
    }
    if (state.resizing) {
      const { id, startX, startY, startW, startH } = state.resizing;
      const win = state.windows[id].el;
      const dw = e.clientX - startX;
      const dh = e.clientY - startY;
      win.style.width = Math.max(320, startW + dw) + 'px';
      win.style.height = Math.max(240, startH + dh) + 'px';
    }
  }

  function onMouseUp() {
    state.dragging = null;
    state.resizing = null;
  }

  function updateTaskbar() {
    const bar = document.getElementById('open-windows-bar');
    bar.innerHTML = '';
    Object.entries(state.windows).forEach(([id, w]) => {
      const btn = document.createElement('div');
      btn.className = 'taskbar-win-btn' + (w.el.classList.contains('focused') ? ' focused' : '');
      btn.textContent = WIN_CONFIG[w.type].title.replace(/[\uD800-\uDFFF]|./g, (c) => {
        if (c.codePointAt(0) > 255) return '';
        return c;
      }).trim() || WIN_CONFIG[w.type].title.split(' ').slice(1).join(' ');
      btn.textContent = WIN_CONFIG[w.type].title;
      btn.addEventListener('click', () => {
        if (w.el.classList.contains('focused') && !w.minimized) {
          minimizeWindow(id);
        } else {
          focusWindow(id);
        }
      });
      bar.appendChild(btn);
    });
  }

  // ===== WINDOW CONTENT INIT =====
  function initWindowContent(id, type) {
    const win = state.windows[id].el;
    if (type === 'proxy') initProxy(win);
    else if (type === 'browser') initBrowser(win);
    else if (type === 'settings') initSettings(win);
    else if (type === 'terminal') initTerminal(win);
    else if (type === 'games') initGames(win);
  }

  // ===== PROXY ENGINE =====
  function initProxy(win) {
    // Transport buttons
    win.querySelectorAll('.transport-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        win.querySelectorAll('.transport-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.proxy.transport = btn.dataset.transport;
        updateProxyStatus(win);
        toast(`Transport: ${btn.dataset.transport.toUpperCase()}`);
      });
    });

    // Engine buttons
    win.querySelectorAll('.proxy-engine-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        win.querySelectorAll('.proxy-engine-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.proxy.engine = btn.dataset.engine;
        updateProxyStatus(win);
        toast(`Engine: ${btn.dataset.engine.toUpperCase()}`);
      });
    });

    // Go button
    const urlInput = win.querySelector('.url-input');
    const goBtn = win.querySelector('.go-btn');
    const goAction = () => {
      const raw = urlInput.value.trim();
      if (!raw) return;
      const url = raw.startsWith('http') ? raw : 'https://' + raw;
      navigateProxy(win, url);
    };
    goBtn.addEventListener('click', goAction);
    urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') goAction(); });

    updateProxyStatus(win);
  }

  function updateProxyStatus(win) {
    const text = win.querySelector('.status-text');
    text.innerHTML = `Engine: <strong>${state.proxy.engine.toUpperCase()}</strong> | Transport: <strong>${state.proxy.transport.toUpperCase()}</strong> | Ready`;
  }

  function navigateProxy(win, url) {
    const frame = win.querySelector('.proxy-frame');
    const statusText = win.querySelector('.status-text');
    statusText.innerHTML = `Engine: <strong>${state.proxy.engine.toUpperCase()}</strong> | Transport: <strong>${state.proxy.transport.toUpperCase()}</strong> | <span style="color:#ff8800">Connecting...</span>`;

    // Build the proxy URL based on engine and transport selection
    const engine = state.proxy.engine;
    const transport = state.proxy.transport;

    // Construct proxy path
    // UV uses /uv/uv.js service worker, Scramjet uses /scramjet/
    let proxyUrl;
    if (engine === 'uv') {
      // Encode URL for UV
      const encoded = encodeURIComponent(url);
      proxyUrl = `proxy.html?engine=uv&transport=${transport}&url=${encoded}`;
    } else {
      const encoded = encodeURIComponent(url);
      proxyUrl = `proxy.html?engine=scramjet&transport=${transport}&url=${encoded}`;
    }

    frame.src = proxyUrl;
    frame.onload = () => {
      statusText.innerHTML = `Engine: <strong>${state.proxy.engine.toUpperCase()}</strong> | Transport: <strong>${state.proxy.transport.toUpperCase()}</strong> | <span style="color:#00ff88">Connected</span>`;
    };
    frame.onerror = () => {
      statusText.innerHTML = `Engine: <strong>${state.proxy.engine.toUpperCase()}</strong> | Transport: <strong>${state.proxy.transport.toUpperCase()}</strong> | <span style="color:#ff2a2a">Error</span>`;
    };
  }

  // ===== BROWSER =====
  function initBrowser(win) {
    const urlInput = win.querySelector('.browser-url');
    const frame = win.querySelector('.browser-frame');
    const goNav = () => {
      let u = urlInput.value.trim();
      if (!u) return;
      if (!u.startsWith('http')) u = 'https://' + u;
      frame.src = u;
    };
    win.querySelector('.go-nav-btn').addEventListener('click', goNav);
    urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') goNav(); });
    win.querySelector('#btn-back').addEventListener('click', () => { try { frame.contentWindow.history.back(); } catch (e) {} });
    win.querySelector('#btn-fwd').addEventListener('click', () => { try { frame.contentWindow.history.forward(); } catch (e) {} });
    win.querySelector('#btn-refresh').addEventListener('click', () => { frame.src = frame.src; });
    frame.addEventListener('load', () => {
      try { urlInput.value = frame.contentWindow.location.href; } catch (e) {}
    });
  }

  // ===== SETTINGS =====
  function initSettings(win) {
    // Theme
    win.querySelectorAll('[data-theme]').forEach(btn => {
      btn.addEventListener('click', () => {
        win.querySelectorAll('[data-theme]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const desktop = document.getElementById('desktop');
        desktop.classList.remove('theme-infernal', 'theme-abyss', 'theme-void', 'theme-ember');
        desktop.classList.add('theme-' + btn.dataset.theme);
        state.settings.theme = btn.dataset.theme;
        toast('Theme: ' + btn.dataset.theme);
      });
    });

    // Scanlines
    win.querySelectorAll('[data-scanlines]').forEach(btn => {
      btn.addEventListener('click', () => {
        win.querySelectorAll('[data-scanlines]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelector('.scanlines').classList.toggle('off', btn.dataset.scanlines === 'off');
        toast('Scanlines: ' + btn.dataset.scanlines.toUpperCase());
      });
    });

    // Color swatches
    win.querySelectorAll('.swatch').forEach(s => {
      s.addEventListener('click', () => {
        win.querySelectorAll('.swatch').forEach(x => x.classList.remove('active'));
        s.classList.add('active');
        const color = s.dataset.color;
        state.settings.accent = color;
        document.documentElement.style.setProperty('--accent', color);
        toast('Accent color updated');
      });
    });

    // Default engine
    win.querySelectorAll('[data-default-engine]').forEach(btn => {
      btn.addEventListener('click', () => {
        win.querySelectorAll('[data-default-engine]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.settings.defaultEngine = btn.dataset.defaultEngine;
        toast('Default engine: ' + btn.dataset.defaultEngine.toUpperCase());
      });
    });
  }

  // ===== TERMINAL =====
  function initTerminal(win) {
    const input = win.querySelector('.term-input');
    const output = win.querySelector('#term-output');

    const commands = {
      help: () => [
        { text: 'Available commands:', cls: 'info' },
        { text: 'help       - Show this help', cls: '' },
        { text: 'about      - About DemonOS', cls: '' },
        { text: 'ls         - List windows', cls: '' },
        { text: 'open <app> - Open an app (proxy/browser/settings/terminal/games/about)', cls: '' },
        { text: 'close <id> - Close a window', cls: '' },
        { text: 'clear      - Clear terminal', cls: '' },
        { text: 'date       - Show date/time', cls: '' },
        { text: 'uptime     - Show system uptime', cls: '' },
        { text: 'whoami     - Show current user', cls: '' },
        { text: 'ping       - Ping the void', cls: '' },
        { text: 'matrix     - Activate matrix mode', cls: '' },
        { text: 'neofetch   - System info', cls: '' },
      ],
      about: () => [{ text: 'DemonOS v6.6.6 — Infernal Kernel. Built for the damned.', cls: 'info' }],
      ls: () => {
        const wins = Object.values(state.windows).map(w => w.type);
        return wins.length ? wins.map(t => ({ text: '  ' + t, cls: '' })) : [{ text: 'No open windows', cls: 'info' }];
      },
      clear: (args, output) => { output.innerHTML = ''; return []; },
      date: () => [{ text: new Date().toString(), cls: 'info' }],
      uptime: () => [{ text: 'up 6:66:06, load average: 6.66, 6.66, 6.66', cls: 'success' }],
      whoami: () => [{ text: 'demon', cls: 'info' }],
      ping: () => [
        { text: 'PING void.hell (6.6.6.6) 56 bytes of data.', cls: '' },
        { text: '64 bytes from void.hell: icmp_seq=1 ttl=66 time=6.66 ms', cls: 'success' },
        { text: '64 bytes from void.hell: icmp_seq=2 ttl=66 time=6.66 ms', cls: 'success' },
        { text: '--- void.hell ping statistics ---', cls: 'info' },
        { text: '2 packets transmitted, 2 received, 0% packet loss', cls: 'success' },
      ],
      matrix: () => {
        toast('🟩 Matrix mode activated... just kidding.');
        return [{ text: 'Wake up, Neo... (jk)', cls: 'info' }];
      },
      neofetch: () => [
        { text: '    /\\    DemonOS v6.6.6', cls: 'info' },
        { text: '   /  \\   ─────────────', cls: 'info' },
        { text: '  / /\\ \\  Kernel: Infernal v6.6.6', cls: '' },
        { text: ' / /  \\ \\ CPU: Brimstone x666 @ 6.66GHz', cls: '' },
        { text: '/______\\ Memory: 666MB / 6.66GB', cls: '' },
        { text: '          Shell: demon-sh', cls: '' },
        { text: '          Resolution: ' + window.innerWidth + 'x' + window.innerHeight, cls: '' },
        { text: '          Theme: ' + state.settings.theme, cls: '' },
      ],
      open: (args) => {
        const app = args[0];
        if (!WIN_CONFIG[app]) return [{ text: 'Unknown app: ' + (app || ''), cls: 'error' }];
        openWindow(app);
        return [{ text: 'Opening ' + app + '...', cls: 'success' }];
      },
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const raw = input.value.trim();
        if (!raw) return;
        state.terminal.history.unshift(raw);
        state.terminal.historyIdx = -1;

        // Echo input
        addLine(output, `demon@os:~$ ${raw}`, '');

        const [cmd, ...args] = raw.split(' ');
        if (commands[cmd]) {
          const result = commands[cmd](args, output);
          if (result) result.forEach(r => addLine(output, r.text, r.cls));
        } else {
          addLine(output, `bash: ${cmd}: command not found`, 'error');
        }

        input.value = '';
        output.scrollTop = output.scrollHeight;
      } else if (e.key === 'ArrowUp') {
        state.terminal.historyIdx = Math.min(state.terminal.historyIdx + 1, state.terminal.history.length - 1);
        input.value = state.terminal.history[state.terminal.historyIdx] || '';
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        state.terminal.historyIdx = Math.max(state.terminal.historyIdx - 1, -1);
        input.value = state.terminal.historyIdx >= 0 ? state.terminal.history[state.terminal.historyIdx] : '';
        e.preventDefault();
      }
    });

    input.focus();
  }

  function addLine(output, text, cls) {
    const div = document.createElement('div');
    div.className = 'term-line' + (cls ? ' ' + cls : '');
    div.textContent = text;
    output.appendChild(div);
  }

  // ===== GAMES =====
  function initGames(win) {
    win.querySelectorAll('.game-card .play-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const card = btn.closest('.game-card');
        const gameType = card.dataset.game;
        win.querySelector('.games-grid').classList.add('hidden');
        const wrap = win.querySelector('#game-canvas-wrap');
        wrap.classList.remove('hidden');
        startGame(gameType, win);
      });
    });

    win.querySelector('#back-to-games').addEventListener('click', () => {
      stopGame();
      win.querySelector('.games-grid').classList.remove('hidden');
      win.querySelector('#game-canvas-wrap').classList.add('hidden');
    });
  }

  function stopGame() {
    if (state.game.loop) { cancelAnimationFrame(state.game.loop); state.game.loop = null; }
    document.removeEventListener('keydown', state.game.keyHandler);
    document.removeEventListener('keyup', state.game.keyUpHandler);
    state.game.current = null;
  }

  function startGame(type, win) {
    stopGame();
    const canvas = win.querySelector('#game-canvas');
    const ctx = canvas.getContext('2d');
    state.game.current = type;

    if (type === 'snake') startSnake(canvas, ctx);
    else if (type === 'breakout') startBreakout(canvas, ctx);
    else if (type === 'pong') startPong(canvas, ctx);
  }

  // --- Snake ---
  function startSnake(canvas, ctx) {
    const W = canvas.width, H = canvas.height;
    const CELL = 20;
    let snake = [{ x: 10, y: 10 }];
    let dir = { x: 1, y: 0 };
    let nextDir = { x: 1, y: 0 };
    let food = randomFood();
    let score = 0;
    let dead = false;

    function randomFood() {
      return { x: Math.floor(Math.random() * (W / CELL)), y: Math.floor(Math.random() * (H / CELL)) };
    }

    const keyHandler = (e) => {
      if (e.key === 'ArrowUp' && dir.y !== 1) nextDir = { x: 0, y: -1 };
      else if (e.key === 'ArrowDown' && dir.y !== -1) nextDir = { x: 0, y: 1 };
      else if (e.key === 'ArrowLeft' && dir.x !== 1) nextDir = { x: -1, y: 0 };
      else if (e.key === 'ArrowRight' && dir.x !== -1) nextDir = { x: 1, y: 0 };
      else if (e.key === ' ' && dead) { snake = [{ x: 10, y: 10 }]; dir = nextDir = { x: 1, y: 0 }; score = 0; dead = false; }
    };
    state.game.keyHandler = keyHandler;
    document.addEventListener('keydown', keyHandler);

    let lastTime = 0;
    const SPEED = 120;

    function gameLoop(ts) {
      state.game.loop = requestAnimationFrame(gameLoop);
      if (ts - lastTime < SPEED) return;
      lastTime = ts;

      if (!dead) {
        dir = nextDir;
        const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
        if (head.x < 0 || head.x >= W / CELL || head.y < 0 || head.y >= H / CELL) { dead = true; }
        else if (snake.some(s => s.x === head.x && s.y === head.y)) { dead = true; }
        else {
          snake.unshift(head);
          if (head.x === food.x && head.y === food.y) { score++; food = randomFood(); } else { snake.pop(); }
        }
      }

      // Draw
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = 'rgba(255,42,42,0.05)';
      for (let x = 0; x < W; x += CELL) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += CELL) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // Food
      ctx.fillStyle = '#ff6600';
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 10;
      ctx.fillRect(food.x * CELL + 2, food.y * CELL + 2, CELL - 4, CELL - 4);
      ctx.shadowBlur = 0;

      // Snake
      snake.forEach((s, i) => {
        ctx.fillStyle = i === 0 ? '#ff2a2a' : `hsl(${10 - i * 2},80%,${50 - i}%)`;
        ctx.shadowColor = '#ff2a2a';
        ctx.shadowBlur = i === 0 ? 8 : 0;
        ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
        ctx.shadowBlur = 0;
      });

      // HUD
      ctx.fillStyle = '#ff2a2a';
      ctx.font = 'bold 14px Orbitron, monospace';
      ctx.fillText('SCORE: ' + score, 10, 20);

      if (dead) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#ff2a2a';
        ctx.font = 'bold 32px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', W / 2, H / 2 - 20);
        ctx.font = '16px Rajdhani, sans-serif';
        ctx.fillStyle = '#aaa';
        ctx.fillText('Score: ' + score + ' | SPACE to restart', W / 2, H / 2 + 20);
        ctx.textAlign = 'left';
      }
    }
    requestAnimationFrame(gameLoop);
  }

  // --- Breakout ---
  function startBreakout(canvas, ctx) {
    const W = canvas.width, H = canvas.height;
    let paddle = { x: W / 2 - 50, y: H - 30, w: 100, h: 12 };
    let ball = { x: W / 2, y: H - 60, vx: 3, vy: -4, r: 7 };
    let bricks = [];
    let score = 0, lives = 3, dead = false, win = false;

    function initBricks() {
      bricks = [];
      for (let r = 0; r < 4; r++)
        for (let c = 0; c < 10; c++)
          bricks.push({ x: c * 49 + 4, y: r * 26 + 40, w: 44, h: 18, alive: true, color: `hsl(${r * 25},90%,50%)` });
    }
    initBricks();

    const keys = {};
    const keyHandler = (e) => { keys[e.key] = true; if (e.key === ' ' && dead) { resetBreakout(); } };
    const keyUpHandler = (e) => { keys[e.key] = false; };
    state.game.keyHandler = keyHandler;
    state.game.keyUpHandler = keyUpHandler;
    document.addEventListener('keydown', keyHandler);
    document.addEventListener('keyup', keyUpHandler);

    function resetBreakout() {
      ball = { x: W / 2, y: H - 60, vx: 3, vy: -4, r: 7 };
      paddle = { x: W / 2 - 50, y: H - 30, w: 100, h: 12 };
      score = 0; lives = 3; dead = false; win = false;
      initBricks();
    }

    function gameLoop() {
      state.game.loop = requestAnimationFrame(gameLoop);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

      if (!dead && !win) {
        if (keys['ArrowLeft']) paddle.x = Math.max(0, paddle.x - 6);
        if (keys['ArrowRight']) paddle.x = Math.min(W - paddle.w, paddle.x + 6);

        ball.x += ball.vx;
        ball.y += ball.vy;

        if (ball.x - ball.r < 0 || ball.x + ball.r > W) ball.vx *= -1;
        if (ball.y - ball.r < 0) ball.vy *= -1;
        if (ball.y + ball.r > H) {
          lives--;
          if (lives <= 0) { dead = true; }
          else { ball = { x: W / 2, y: H - 60, vx: 3 * (Math.random() > 0.5 ? 1 : -1), vy: -4, r: 7 }; }
        }

        // Paddle collision
        if (ball.y + ball.r > paddle.y && ball.x > paddle.x && ball.x < paddle.x + paddle.w && ball.vy > 0) {
          ball.vy *= -1;
          ball.vx = (ball.x - (paddle.x + paddle.w / 2)) / 10;
        }

        // Brick collisions
        bricks.forEach(b => {
          if (!b.alive) return;
          if (ball.x > b.x && ball.x < b.x + b.w && ball.y > b.y && ball.y < b.y + b.h) {
            b.alive = false; ball.vy *= -1; score++;
          }
        });

        win = bricks.every(b => !b.alive);
      }

      // Draw bricks
      bricks.forEach(b => {
        if (!b.alive) return;
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 4;
        ctx.fillRect(b.x, b.y, b.w, b.h);
        ctx.shadowBlur = 0;
      });

      // Ball
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Paddle
      ctx.fillStyle = '#ff2a2a';
      ctx.shadowColor = '#ff2a2a';
      ctx.shadowBlur = 8;
      ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
      ctx.shadowBlur = 0;

      // HUD
      ctx.fillStyle = '#ff2a2a';
      ctx.font = '14px Orbitron, monospace';
      ctx.fillText('SCORE: ' + score, 10, 20);
      ctx.fillText('LIVES: ' + '♥'.repeat(lives), W - 120, 20);

      if (dead || win) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = win ? '#00ff88' : '#ff2a2a';
        ctx.font = 'bold 30px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(win ? 'YOU WIN!' : 'GAME OVER', W / 2, H / 2 - 20);
        ctx.fillStyle = '#aaa';
        ctx.font = '14px Rajdhani, sans-serif';
        ctx.fillText('Score: ' + score + ' | SPACE to restart', W / 2, H / 2 + 20);
        ctx.textAlign = 'left';
      }
    }
    requestAnimationFrame(gameLoop);
  }

  // --- Pong ---
  function startPong(canvas, ctx) {
    const W = canvas.width, H = canvas.height;
    let player = { y: H / 2 - 40, h: 80, score: 0 };
    let ai = { y: H / 2 - 40, h: 80, score: 0 };
    let ball = { x: W / 2, y: H / 2, vx: 4, vy: 3 };
    const PW = 12, PX = 16;
    const keys = {};

    const keyHandler = (e) => { keys[e.key] = true; };
    const keyUpHandler = (e) => { keys[e.key] = false; };
    state.game.keyHandler = keyHandler;
    state.game.keyUpHandler = keyUpHandler;
    document.addEventListener('keydown', keyHandler);
    document.addEventListener('keyup', keyUpHandler);

    function gameLoop() {
      state.game.loop = requestAnimationFrame(gameLoop);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);

      if (keys['ArrowUp']) player.y = Math.max(0, player.y - 6);
      if (keys['ArrowDown']) player.y = Math.min(H - player.h, player.y + 6);

      // AI
      const center = ai.y + ai.h / 2;
      if (center < ball.y - 4) ai.y = Math.min(H - ai.h, ai.y + 4);
      else if (center > ball.y + 4) ai.y = Math.max(0, ai.y - 4);

      ball.x += ball.vx;
      ball.y += ball.vy;

      if (ball.y < 6 || ball.y > H - 6) ball.vy *= -1;

      // Player paddle
      if (ball.x < PX + PW && ball.y > player.y && ball.y < player.y + player.h && ball.vx < 0) {
        ball.vx *= -1.05;
        ball.vy += (ball.y - (player.y + player.h / 2)) / 15;
      }
      // AI paddle
      if (ball.x > W - PX - PW && ball.y > ai.y && ball.y < ai.y + ai.h && ball.vx > 0) {
        ball.vx *= -1.05;
        ball.vy += (ball.y - (ai.y + ai.h / 2)) / 15;
      }

      // Score
      if (ball.x < 0) { ai.score++; ball = { x: W / 2, y: H / 2, vx: 4, vy: 3 }; }
      if (ball.x > W) { player.score++; ball = { x: W / 2, y: H / 2, vx: -4, vy: 3 }; }

      ball.vx = Math.max(-10, Math.min(10, ball.vx));
      ball.vy = Math.max(-8, Math.min(8, ball.vy));

      // Center line
      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = 'rgba(255,42,42,0.2)';
      ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
      ctx.setLineDash([]);

      // Paddles
      ctx.fillStyle = '#ff2a2a';
      ctx.shadowColor = '#ff2a2a'; ctx.shadowBlur = 8;
      ctx.fillRect(PX, player.y, PW, player.h);
      ctx.fillStyle = '#ff6600';
      ctx.shadowColor = '#ff6600';
      ctx.fillRect(W - PX - PW, ai.y, PW, ai.h);
      ctx.shadowBlur = 0;

      // Ball
      ctx.fillStyle = '#fff';
      ctx.shadowColor = '#fff'; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(ball.x, ball.y, 7, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;

      // Score
      ctx.fillStyle = '#ff2a2a';
      ctx.font = 'bold 28px Orbitron, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(player.score, W / 4, 36);
      ctx.fillStyle = '#ff6600';
      ctx.fillText(ai.score, 3 * W / 4, 36);
      ctx.textAlign = 'left';
    }
    requestAnimationFrame(gameLoop);
  }

  // ===== TOAST =====
  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.3s';
      setTimeout(() => el.remove(), 300);
    }, 2000);
  }

  // ===== INIT =====
  window.addEventListener('DOMContentLoaded', boot);
})();
