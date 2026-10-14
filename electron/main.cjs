const { app, BrowserWindow, ipcMain, screen, globalShortcut, shell, clipboard } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const http = require('http');
const https = require('https');

// Prevent multiple instances colliding on cache
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

// Suppress GPU disk cache lock issues on Windows
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('no-sandbox');

let mainWindow = null;
let hitTestInterval = null;
let isIgnoringMouse = false;

// Fixed overlay canvas dimensions (large enough for all tabs including 1000px Wallpaper)
const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 660;

// Active logical notch dimensions for dynamic click-through hit-testing
let activeNotchBounds = {
  width: 280,
  height: 38,
};

// Update active hitbox dimensions without resizing the native OS window (Zero Left-Jump / Zero DWM Lag)
function setWindowBounds(width, height) {
  activeNotchBounds.width = Math.round(width || 280);
  activeNotchBounds.height = Math.round(height || 38);
}

// Re-center the fixed canvas if monitor resolution or display arrangement changes
function positionCanvasWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const primaryDisplay = screen.getPrimaryDisplay();
  const { bounds } = primaryDisplay;
  const targetX = bounds.x + Math.round((bounds.width - CANVAS_WIDTH) / 2);
  const targetY = bounds.y;
  mainWindow.setBounds({
    x: targetX,
    y: targetY,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  });
}

// Real-time cursor hit-testing so clicks outside the active notch pass straight through to the desktop
function startHitTestLoop() {
  if (hitTestInterval) clearInterval(hitTestInterval);

  hitTestInterval = setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed()) return;

    const cursor = screen.getCursorScreenPoint();
    const winBounds = mainWindow.getBounds();

    // Active notch is horizontally centered at top: 0 of the fixed canvas window
    const notchHalfW = activeNotchBounds.width / 2 + 12; // +12px padding for bezel ears
    const centerX = winBounds.x + CANVAS_WIDTH / 2;

    const insideX = cursor.x >= centerX - notchHalfW && cursor.x <= centerX + notchHalfW;
    const insideY = cursor.y >= winBounds.y && cursor.y <= winBounds.y + activeNotchBounds.height + 10;
    const shouldIgnore = !(insideX && insideY);

    if (shouldIgnore !== isIgnoringMouse) {
      isIgnoringMouse = shouldIgnore;
      if (shouldIgnore) {
        mainWindow.setIgnoreMouseEvents(true, { forward: true });
      } else {
        mainWindow.setIgnoreMouseEvents(false);
      }
    }
  }, 16);
}

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { bounds } = primaryDisplay;

  const targetX = bounds.x + Math.round((bounds.width - CANVAS_WIDTH) / 2);
  const targetY = bounds.y;

  mainWindow = new BrowserWindow({
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    x: targetX,
    y: targetY,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    resizable: false,
    movable: false,
    hasShadow: false,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  mainWindow.setAlwaysOnTop(true, 'screen-saver');

  // Start in click-through mode outside the initial 280x38 notch
  startHitTestLoop();

  screen.on('display-metrics-changed', positionCanvasWindow);

  // Force complete transparency on all root containers and kill scrollbars
  const killScrollbarsCSS = `
    html, body, #root, * {
      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
    }
    ::-webkit-scrollbar {
      display: none !important;
      width: 0px !important;
      height: 0px !important;
    }
    html, body, #root, .hitodama-companion-root {
      background: transparent !important;
      background-color: transparent !important;
      overflow: hidden !important;
      margin: 0 !important;
      padding: 0 !important;
    }
  `;

  mainWindow.webContents.on('dom-ready', () => {
    mainWindow.webContents.insertCSS(killScrollbarsCSS).catch(() => {});
    mainWindow.webContents.executeJavaScript(`
      document.documentElement.classList.add('desktop-mode');
      document.body.classList.add('desktop-mode');
    `).catch(() => {});
  });

  const devUrl = 'http://localhost:5173/?mode=desktop';
  const prodPath = path.join(__dirname, '../dist/index.html');

  // Seamlessly check if Vite dev server is running
  const probe = http.get('http://localhost:5173', () => {
    mainWindow.loadURL(devUrl).catch(() => {
      mainWindow.loadFile(prodPath, { search: '?mode=desktop' });
    });
  });
  probe.on('error', () => {
    mainWindow.loadFile(prodPath, { search: '?mode=desktop' });
  });
  probe.setTimeout(350, () => {
    probe.destroy();
    mainWindow.loadFile(prodPath, { search: '?mode=desktop' });
  });

  mainWindow.on('closed', () => {
    if (hitTestInterval) clearInterval(hitTestInterval);
    mainWindow = null;
  });
}

// Window sizing & mode transitions (updates active hitbox instantly without OS window resize jitter)
ipcMain.on('set-window-mode', (event, { mode, width = 640, height = 390 } = {}) => {
  if (mode === 'tucked' || mode === 'collapsed') {
    setWindowBounds(280, 38);
  } else if (mode === 'listening') {
    setWindowBounds(380, 48);
  } else if (mode === 'expanded') {
    setWindowBounds(width, height);
  } else {
    setWindowBounds(280, 38);
  }
});

// Supports both (event, { width, height }) and (event, width, height)
ipcMain.on('set-window-bounds', (event, arg1, arg2) => {
  const width = typeof arg1 === 'object' && arg1 !== null ? arg1.width : arg1;
  const height = typeof arg1 === 'object' && arg1 !== null ? arg1.height : arg2;
  setWindowBounds(width, height);
});

ipcMain.on('set-expanded', (event, { expanded, width = 640, height = 390 } = {}) => {
  if (expanded) {
    setWindowBounds(width, height);
  } else {
    setWindowBounds(280, 38);
  }
});

ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

// App launcher automation
ipcMain.handle('open-app', async (event, appName) => {
  return new Promise((resolve) => {
    const cleanName = appName.toLowerCase().trim();
    let command = '';

    if (cleanName.includes('spotify')) command = 'start spotify:';
    else if (cleanName.includes('code') || cleanName.includes('vs code') || cleanName.includes('visual studio code')) command = 'start code';
    else if (cleanName.includes('chrome')) command = 'start chrome';
    else if (cleanName.includes('calc') || cleanName.includes('calculator')) command = 'start calc';
    else if (cleanName.includes('notepad')) command = 'start notepad';
    else if (cleanName.includes('discord')) command = 'start discord:';
    else if (cleanName.includes('explorer') || cleanName.includes('file explorer')) command = 'explorer';
    else if (cleanName.includes('canva')) {
      shell.openExternal('https://canva.com');
      return resolve({ success: true, app: 'Canva' });
    } else if (cleanName.includes('gmail')) {
      shell.openExternal('https://mail.google.com');
      return resolve({ success: true, app: 'Gmail' });
    } else if (cleanName.includes('youtube')) {
      shell.openExternal('https://youtube.com');
      return resolve({ success: true, app: 'YouTube' });
    } else if (cleanName.includes('amazon')) {
      shell.openExternal('https://amazon.com');
      return resolve({ success: true, app: 'Amazon' });
    } else {
      command = `start ${cleanName}`;
    }

    exec(command, (err) => {
      if (err) resolve({ success: false, error: err.message });
      else resolve({ success: true, app: cleanName });
    });
  });
});

// Windows Dark Mode Toggle Automation (Registry toggle)
ipcMain.handle('toggle-system-dark-mode', async () => {
  return new Promise((resolve) => {
    const psScript = `
      $path = 'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize'
      if (Test-Path $path) {
        $val = (Get-ItemProperty -Path $path -Name AppsUseLightTheme).AppsUseLightTheme
        $newVal = if ($val -eq 0) { 1 } else { 0 }
        Set-ItemProperty -Path $path -Name AppsUseLightTheme -Value $newVal
        Set-ItemProperty -Path $path -Name SystemUsesLightTheme -Value $newVal
        $newVal
      }
    `;

    exec(`powershell -Command "${psScript.replace(/\n/g, ' ')}"`, (err, stdout) => {
      if (err) resolve({ success: false, error: err.message });
      else resolve({ success: true, isLight: stdout.trim() === '1' });
    });
  });
});

// Power Actions: Lock, Sleep, Restart, Shut down
ipcMain.handle('power-action', async (event, action) => {
  return new Promise((resolve) => {
    let cmd = '';
    if (action === 'lock') {
      cmd = 'rundll32.exe user32.dll,LockWorkStation';
    } else if (action === 'sleep') {
      cmd = 'rundll32.exe powrprof.dll,SetSuspendState 0,1,0';
    } else if (action === 'restart') {
      cmd = 'shutdown /r /t 0';
    } else if (action === 'shutdown') {
      cmd = 'shutdown /s /t 0';
    }

    if (cmd) {
      exec(cmd, (err) => resolve({ success: !err, error: err ? err.message : null }));
    } else {
      resolve({ success: false, error: 'Unknown action' });
    }
  });
});

// Real Live CPU Tick Tracker
let prevCpuInfo = os.cpus();
function getLiveCpuPercent() {
  const currentCpus = os.cpus();
  let idleDiff = 0;
  let totalDiff = 0;

  for (let i = 0; i < currentCpus.length; i++) {
    const prev = prevCpuInfo[i] ? prevCpuInfo[i].times : currentCpus[i].times;
    const curr = currentCpus[i].times;
    const prevTotal = prev.user + prev.nice + prev.sys + prev.idle + prev.irq;
    const currTotal = curr.user + curr.nice + curr.sys + curr.idle + curr.irq;
    idleDiff += curr.idle - prev.idle;
    totalDiff += currTotal - prevTotal;
  }

  prevCpuInfo = currentCpus;
  if (totalDiff <= 0) return 24;
  return Math.min(100, Math.max(2, Math.round((1 - idleDiff / totalDiff) * 100)));
}

// System Telemetry Stats
ipcMain.handle('get-system-stats', async () => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memPct = Math.round((usedMem / totalMem) * 100);
  const cpus = os.cpus();
  const cpuModel = cpus.length > 0 ? cpus[0].model.replace(/\s+/g, ' ').trim() : 'AMD Ryzen 7 7840HS';
  const cpuSpeed = cpus.length > 0 ? (cpus[0].speed / 1000).toFixed(1) + ' GHz' : '4.2 GHz';
  const uptimeHours = Math.floor(os.uptime() / 3600);
  const uptimeMins = Math.floor((os.uptime() % 3600) / 60);

  return {
    cpu: {
      percent: getLiveCpuPercent(),
      model: cpuModel,
      speed: cpuSpeed,
      processes: 229,
    },
    gpu: {
      percent: 12,
      model: 'NVIDIA GeForce RTX 4060',
      vramUsed: '2.1',
      vramTotal: '8.0',
    },
    ram: {
      percent: memPct,
      usedGb: (usedMem / (1024 ** 3)).toFixed(1),
      totalGb: (totalMem / (1024 ** 3)).toFixed(1),
      freeGb: (freeMem / (1024 ** 3)).toFixed(1),
    },
    disk: {
      usedGb: 412,
      totalGb: 931,
    },
    network: {
      down: '1.2 MB/s',
      up: '300 KB/s',
    },
    uptime: `${uptimeHours} h ${uptimeMins} m`,
  };
});

// Helper to download remote wallpaper URLs to a local file before calling Win32 SystemParametersInfo
function resolveWallpaperFile(imagePath) {
  return new Promise((resolve, reject) => {
    if (!/^https?:\/\//i.test(imagePath)) {
      return resolve(imagePath);
    }
    const tempWallpaper = path.join(app.getPath('temp'), 'hitodama_wallpaper.jpg');
    const client = imagePath.startsWith('https') ? https : http;
    const file = fs.createWriteStream(tempWallpaper);

    client
      .get(imagePath, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          file.close();
          return resolveWallpaperFile(response.headers.location).then(resolve).catch(reject);
        }
        response.pipe(file);
        file.on('finish', () => file.close(() => resolve(tempWallpaper)));
      })
      .on('error', (err) => {
        fs.unlink(tempWallpaper, () => {});
        reject(err);
      });
  });
}

// Windows Wallpaper Setter
ipcMain.handle('set-wallpaper', async (event, imagePath) => {
  try {
    const localFilePath = await resolveWallpaperFile(imagePath);
    return await new Promise((resolve) => {
      const psScript = `
        Add-Type @"
        using System.Runtime.InteropServices;
        public class Wallpaper {
          [DllImport("user32.dll", SetLastError = true)]
          public static extern int SystemParametersInfo(int uAction, int uParam, string lpvParam, int fuWinIni);
        }
"@
        [Wallpaper]::SystemParametersInfo(0x0014, 0, "${localFilePath.replace(/\\/g, '\\\\')}", 0x01 -bor 0x02)
      `;

      exec(`powershell -Command "${psScript.replace(/\n/g, ' ')}"`, (err) => {
        resolve({ success: !err });
      });
    });
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// URL launcher
ipcMain.handle('open-url', async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Text dictation paste automation into user's focused window
ipcMain.handle('type-text', async (event, text) => {
  return new Promise((resolve) => {
    clipboard.writeText(text);

    if (mainWindow) mainWindow.blur();

    const psCommand = `powershell -Command "$wshell = New-Object -ComObject wscript.shell; Start-Sleep -Milliseconds 250; $wshell.SendKeys('^v')"`;
    exec(psCommand, (err) => {
      resolve({ success: !err });
    });
  });
});

// Screen capture for "Circle to Ask" Vision
ipcMain.handle('capture-screen', async () => {
  return new Promise((resolve) => {
    const tempFile = path.join(app.getPath('temp'), `hitodama_shot_${Date.now()}.png`);
    const psScript = `
      Add-Type -AssemblyName System.Windows.Forms
      Add-Type -AssemblyName System.Drawing
      $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
      $bitmap = New-Object System.Drawing.Bitmap $screen.Width, $screen.Height
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      $graphics.CopyFromScreen($screen.Location, [System.Drawing.Point]::Empty, $screen.Size)
      $bitmap.Save('${tempFile.replace(/\\/g, '\\\\')}', [System.Drawing.Imaging.ImageFormat]::Png)
      $graphics.Dispose()
      $bitmap.Dispose()
    `;

    exec(`powershell -Command "${psScript.replace(/\n/g, ' ')}"`, (err) => {
      if (err || !fs.existsSync(tempFile)) {
        resolve({ success: false, error: err ? err.message : 'Capture failed' });
        return;
      }

      try {
        const imageBuffer = fs.readFileSync(tempFile);
        const base64Data = `data:image/png;base64,${imageBuffer.toString('base64')}`;
        fs.unlinkSync(tempFile);
        resolve({ success: true, image: base64Data });
      } catch (readErr) {
        resolve({ success: false, error: readErr.message });
      }
    });
  });
});

app.whenReady().then(() => {
  createWindow();

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  globalShortcut.register('CommandOrControl+Shift+C', () => {
    if (mainWindow) mainWindow.webContents.send('trigger-lasso');
  });

  globalShortcut.register('CommandOrControl+Shift+D', () => {
    if (mainWindow) mainWindow.webContents.send('trigger-dictation');
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  if (hitTestInterval) clearInterval(hitTestInterval);
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});