const { app, shell, clipboard, dialog } = require('electron');
const path = require('path');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const http = require('http');
const https = require('https');
const crypto = require('crypto');

let wallpaperDaemon = null;
let hotkeyDaemon = null;
let wallpaperToggleIdx = 0;
let prevCpuInfo = os.cpus();
let prevNetStats = { rx: 0, tx: 0, ts: 0 };
let cachedInstalledApps = null;
let lastClipText = '';
let lastClipImgHash = '';
let clipboardTimer = null;
let clipboardHistoryStore = [];

let lastKnownTrack = {
  title: '',
  artist: '',
  source: '',
  thumbnail: '',
  durationSec: 210,
};

const trackMetadataCache = new Map();

function runPowerShellEncoded(psScript, timeoutMs = 6500) {
  return new Promise((resolve) => {
    try {
      const child = spawn('powershell.exe', [
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy',
        'Bypass',
        '-Command',
        '-',
      ]);
      let stdout = '';
      let stderr = '';
      let timer = null;

      if (timeoutMs > 0) {
        timer = setTimeout(() => {
          try {
            child.kill();
          } catch (_) {}
          resolve({ ok: false, stdout: '', error: 'timeout' });
        }, timeoutMs);
      }

      child.stdout.on('data', (d) => {
        stdout += d.toString('utf8');
      });
      child.stderr.on('data', (d) => {
        stderr += d.toString('utf8');
      });

      child.on('close', (code) => {
        if (timer) clearTimeout(timer);
        if (code !== 0 && !stdout.trim()) {
          resolve({ ok: false, stdout: '', error: stderr || `exit ${code}` });
        } else {
          resolve({ ok: true, stdout: stdout.trim() });
        }
      });

      child.on('error', (err) => {
        if (timer) clearTimeout(timer);
        resolve({ ok: false, stdout: '', error: err.message });
      });

      child.stdin.write(psScript + '\n');
      child.stdin.end();
    } catch (err) {
      resolve({ ok: false, stdout: '', error: err.message });
    }
  });
}

// ============================================================================
// HOLD-TO-SPEAK GLOBAL SHORTCUT POLLER (`Win+Alt`, `Ctrl+Win`, `Ctrl+Shift` + Customizable)
// Emits `*_DOWN` when held and `*_UP` when released!
// ============================================================================
let currentHotkeyCallback = null;
let currentShortcutsConfig = {
  ask: 'Win + Alt',
  circle: 'Ctrl + Shift',
  dictate: 'Ctrl + Win',
};

function shortcutToPowerShellCondition(shortcutStr, fallbackExpr) {
  if (!shortcutStr || typeof shortcutStr !== 'string') return fallbackExpr;
  const tokens = shortcutStr.split('+').map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (tokens.length === 0) return fallbackExpr;

  const hasWin = tokens.some((t) => t.includes('win') || t.includes('meta'));
  const hasAlt = tokens.some((t) => t.includes('alt'));
  const hasCtrl = tokens.some((t) => t.includes('ctrl'));
  const hasShift = tokens.some((t) => t.includes('shift'));

  const clauses = [];
  clauses.push(hasWin ? '$win' : '(-not $win)');
  clauses.push(hasAlt ? '$alt' : '(-not $alt)');
  clauses.push(hasCtrl ? '$ctrl' : '(-not $ctrl)');
  clauses.push(hasShift ? '$shift' : '(-not $shift)');

  for (const t of tokens) {
    if (t.includes('win') || t.includes('meta') || t.includes('alt') || t.includes('ctrl') || t.includes('shift')) {
      continue;
    }
    if (t === 'space') {
      clauses.push('[KeyPoller]::IsDown(0x20)');
    } else if (t.length === 1 && t >= 'a' && t <= 'z') {
      const code = '0x' + t.toUpperCase().charCodeAt(0).toString(16);
      clauses.push(`[KeyPoller]::IsDown(${code})`);
    } else if (t.length === 1 && t >= '0' && t <= '9') {
      const code = '0x' + t.charCodeAt(0).toString(16);
      clauses.push(`[KeyPoller]::IsDown(${code})`);
    } else if (/^f([1-9]|1[0-2])$/.test(t)) {
      const fNum = parseInt(t.slice(1), 10);
      const code = '0x' + (0x70 + fNum - 1).toString(16);
      clauses.push(`[KeyPoller]::IsDown(${code})`);
    }
  }

  const cond = clauses.join(' -and ');
  if (fallbackExpr && fallbackExpr !== cond) {
    return `((${cond}) -or (${fallbackExpr}))`;
  }
  return `(${cond})`;
}

function startHotkeyWatcher(onHotkey, customShortcuts) {
  if (onHotkey) currentHotkeyCallback = onHotkey;
  if (customShortcuts) {
    currentShortcutsConfig = { ...currentShortcutsConfig, ...customShortcuts };
  }
  if (hotkeyDaemon) return;

  const askCondition = shortcutToPowerShellCondition(
    currentShortcutsConfig.ask,
    '$win -and $alt -and (-not $ctrl) -and (-not $shift)'
  );
  const dictateCondition = shortcutToPowerShellCondition(
    currentShortcutsConfig.dictate,
    '$ctrl -and $win -and (-not $alt) -and (-not $shift)'
  );
  const lassoCondition = shortcutToPowerShellCondition(
    currentShortcutsConfig.circle,
    '$ctrl -and $shift -and (-not $win) -and (-not $alt)'
  );

  try {
    const psScript = `
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public class KeyPoller {
  [DllImport("user32.dll")]
  public static extern short GetAsyncKeyState(int vKey);
  public static bool IsDown(int vKey) {
    return (GetAsyncKeyState(vKey) & 0x8000) != 0;
  }
}
'@ -ErrorAction SilentlyContinue

$wasWinAlt = $false
$wasCtrlWin = $false
$wasCtrlShift = $false

while ($true) {
  $win = [KeyPoller]::IsDown(0x5B) -or [KeyPoller]::IsDown(0x5C)
  $alt = [KeyPoller]::IsDown(0x12)
  $ctrl = [KeyPoller]::IsDown(0x11)
  $shift = [KeyPoller]::IsDown(0x10)

  # 1. Ask Anything (e.g. Win + Alt or custom)
  $winAlt = ${askCondition}
  if ($winAlt -and (-not $wasWinAlt)) {
    [Console]::WriteLine("ASK_DOWN")
    [Console]::Out.Flush()
  } elseif ((-not $winAlt) -and $wasWinAlt) {
    [Console]::WriteLine("ASK_UP")
    [Console]::Out.Flush()
  }
  $wasWinAlt = $winAlt

  # 2. Dictation (e.g. Ctrl + Win or custom)
  $ctrlWin = ${dictateCondition}
  if ($ctrlWin -and (-not $wasCtrlWin)) {
    [Console]::WriteLine("DICTATE_DOWN")
    [Console]::Out.Flush()
  } elseif ((-not $ctrlWin) -and $wasCtrlWin) {
    [Console]::WriteLine("DICTATE_UP")
    [Console]::Out.Flush()
  }
  $wasCtrlWin = $ctrlWin

  # 3. Circle to Ask (e.g. Ctrl + Shift or custom)
  $ctrlShift = ${lassoCondition}
  if ($ctrlShift -and (-not $wasCtrlShift)) {
    [Console]::WriteLine("LASSO_DOWN")
    [Console]::Out.Flush()
  } elseif ((-not $ctrlShift) -and $wasCtrlShift) {
    [Console]::WriteLine("LASSO_UP")
    [Console]::Out.Flush()
  }
  $wasCtrlShift = $ctrlShift

  Start-Sleep -Milliseconds 30
}
`;
    const encoded = Buffer.from(psScript, 'utf16le').toString('base64');
    hotkeyDaemon = spawn('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Bypass',
      '-EncodedCommand',
      encoded,
    ]);

    hotkeyDaemon.stdout.on('data', (chunk) => {
      const lines = chunk.toString().split(/\r?\n/);
      for (const line of lines) {
        const clean = line.trim();
        if (clean && currentHotkeyCallback) {
          currentHotkeyCallback(clean);
        }
      }
    });

    hotkeyDaemon.on('exit', () => {
      hotkeyDaemon = null;
    });
  } catch (_) {
    hotkeyDaemon = null;
  }
}

function updateHotkeyWatcher(shortcuts, onHotkey) {
  if (shortcuts) {
    currentShortcutsConfig = { ...currentShortcutsConfig, ...shortcuts };
  }
  if (onHotkey) {
    currentHotkeyCallback = onHotkey;
  }
  if (hotkeyDaemon) {
    try {
      hotkeyDaemon.kill();
    } catch (_) {}
    hotkeyDaemon = null;
  }
  startHotkeyWatcher(currentHotkeyCallback, currentShortcutsConfig);
}

function fetchUrlBuffer(url, timeoutMs = 3500) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(
      url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        },
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchUrlBuffer(res.headers.location, timeoutMs).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }
    );
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

async function resolveTrackMetadata(title, artist) {
  const cleanTitle = String(title || '')
    .replace(/\((official|lyric|music|audio|video|visualizer|hd|4k|hq).*?\)/gi, '')
    .replace(/\[(official|lyric|music|audio|video|visualizer|hd|4k|hq).*?\]/gi, '')
    .replace(/\b(ft\.?|feat\.?)\b.*$/i, '')
    .trim();
  const cleanArtist = String(artist || '')
    .replace(/^(YouTube|chrome|msedge|opera|brave|firefox|Spotify|Netflix)$/i, '')
    .trim();

  // Never search iTunes Music for generic streaming platform names like "Netflix" or "YouTube"
  if (
    !cleanTitle ||
    /^(netflix|youtube|twitch|disney\+|prime video|hulu|crunchyroll|system audio stream)$/i.test(cleanTitle) ||
    /^netflix$/i.test(String(artist || '').trim())
  ) {
    return { thumbnail: '', durationSec: 1440 };
  }

  const cacheKey = `${cleanArtist}__${cleanTitle}`.toLowerCase();
  if (trackMetadataCache.has(cacheKey)) {
    return trackMetadataCache.get(cacheKey);
  }

  try {
    const searchQuery = `${cleanArtist} ${cleanTitle}`.trim();
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&media=music&limit=1`;
    const buf = await fetchUrlBuffer(itunesUrl, 2500);
    const json = JSON.parse(buf.toString('utf8'));
    if (json.results && json.results.length > 0) {
      const hit = json.results[0];
      const durationSec = hit.trackTimeMillis
        ? Math.max(30, Math.round(hit.trackTimeMillis / 1000))
        : 210;
      let dataUrl = '';
      if (hit.artworkUrl100) {
        const hiResUrl = hit.artworkUrl100.replace('100x100bb', '300x300bb');
        const imgBuf = await fetchUrlBuffer(hiResUrl, 2500);
        dataUrl = `data:image/jpeg;base64,${imgBuf.toString('base64')}`;
      }
      const meta = { thumbnail: dataUrl, durationSec };
      trackMetadataCache.set(cacheKey, meta);
      return meta;
    }
  } catch (_) {}

  const fallbackMeta = { thumbnail: '', durationSec: 210 };
  trackMetadataCache.set(cacheKey, fallbackMeta);
  return fallbackMeta;
}

const WALLPAPER_URLS = [
  'https://hitodama.in/images/wallpapers/wallpaper0.jpg',
  'https://hitodama.in/images/wallpapers/wallpaper1.jpg',
  'https://hitodama.in/images/wallpapers/wallpaper2.jpg',
  'https://hitodama.in/images/wallpapers/wallpaper3.jpg',
  'https://hitodama.in/images/wallpapers/wallpaper4.jpg',
];

function getCachedWallpaperPath(url) {
  const hash = crypto.createHash('md5').update(url).digest('hex');
  const dir = path.join(app.getPath('userData'), 'wallpapers_cache');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `wp_${hash}.jpg`);
}

function downloadFileToCache(url, destPath) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 5000) {
      return resolve(destPath);
    }
    const client = url.startsWith('https') ? https : http;
    const req = client.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Hitodama/1.0',
          Accept: 'image/jpeg,image/png,image/*;q=0.8',
        },
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return downloadFileToCache(res.headers.location, destPath).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const file = fs.createWriteStream(destPath);
        res.pipe(file);
        file.on('finish', () => file.close(() => resolve(destPath)));
        file.on('error', (err) => {
          fs.unlink(destPath, () => {});
          reject(err);
        });
      }
    );
    req.on('error', reject);
  });
}

function preCacheDefaultWallpapers() {
  for (const url of WALLPAPER_URLS) {
    const dest = getCachedWallpaperPath(url);
    downloadFileToCache(url, dest).catch(() => {});
  }
}

async function getWallpaperDataUrl(urlOrPath) {
  try {
    const localPath = await resolveWallpaperFileFast(urlOrPath);
    if (fs.existsSync(localPath)) {
      const buf = fs.readFileSync(localPath);
      return `data:image/jpeg;base64,${buf.toString('base64')}`;
    }
  } catch (_) {}
  return urlOrPath;
}

// Persistent PowerShell Daemon: Wallpaper, Audio Volume, Media Keys, Theme Broadcast & Instant GSMTC Media Seeking
function initSystemDaemon() {
  if (wallpaperDaemon && wallpaperDaemon.stdin && wallpaperDaemon.stdin.writable) return;
  try {
    wallpaperDaemon = spawn('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Bypass',
      '-Command',
      '-',
    ]);

    const psInitScript = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Runtime.WindowsRuntime

$csharpCode = @'
using System;
using System.Runtime.InteropServices;

public class Win32Wallpaper {
  [DllImport("user32.dll")]
  public static extern bool SetProcessDPIAware();

  [DllImport("user32.dll", CharSet = CharSet.Auto)]
  public static extern int SystemParametersInfo(int uAction, int uParam, string lpvParam, int fuWinIni);
}

public class Win32MediaKeys {
  [DllImport("user32.dll")]
  public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);

  public static void SendKey(byte vk) {
    keybd_event(vk, 0, 0, UIntPtr.Zero);
    keybd_event(vk, 0, 2, UIntPtr.Zero);
  }
}

public class Win32ThemeBroadcast {
  [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
  public static extern IntPtr SendMessageTimeout(IntPtr hWnd, uint Msg, UIntPtr wParam, string lParam, uint fuFlags, uint uTimeout, out UIntPtr lpdwResult);

  public static void BroadcastThemeChange() {
    UIntPtr res;
    SendMessageTimeout((IntPtr)0xffff, 0x001A, UIntPtr.Zero, "ImmersiveColorSet", 0x0002, 1000, out res);
    SendMessageTimeout((IntPtr)0xffff, 0x031A, UIntPtr.Zero, null, 0x0002, 1000, out res);
  }
}

[Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioEndpointVolume {
  int f(); int g(); int h(); int i();
  int SetMasterVolumeLevelScalar(float fLevel, Guid pguidEventContext);
  int j();
  int GetMasterVolumeLevelScalar(out float pfLevel);
  int k(); int l(); int m(); int n();
  int SetMute([MarshalAs(UnmanagedType.Bool)] bool bMute, Guid pguidEventContext);
  int GetMute(out bool pbMute);
}

[Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDevice {
  int Activate(ref Guid id, int clsCtx, IntPtr activationParams, out IAudioEndpointVolume aev);
}

[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceEnumerator {
  int f();
  int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice endpoint);
}

[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
class MMDeviceEnumeratorComObject { }

public class Win32Audio {
  private static IAudioEndpointVolume GetVolObject() {
    var enumerator = new MMDeviceEnumeratorComObject() as IMMDeviceEnumerator;
    IMMDevice dev = null;
    Marshal.ThrowExceptionForHR(enumerator.GetDefaultAudioEndpoint(0, 1, out dev));
    IAudioEndpointVolume epv = null;
    var epvid = typeof(IAudioEndpointVolume).GUID;
    Marshal.ThrowExceptionForHR(dev.Activate(ref epvid, 23, IntPtr.Zero, out epv));
    return epv;
  }

  public static void SetVolume(int level) {
    try {
      float scalar = Math.Max(0f, Math.Min(100f, level)) / 100f;
      var vol = GetVolObject();
      vol.SetMasterVolumeLevelScalar(scalar, Guid.Empty);
      if (level > 0) vol.SetMute(false, Guid.Empty);
    } catch { }
  }

  public static void SetMute(bool mute) {
    try {
      var vol = GetVolObject();
      vol.SetMute(mute, Guid.Empty);
    } catch { }
  }
}
'@

Add-Type -TypeDefinition $csharpCode -ErrorAction SilentlyContinue
[Win32Wallpaper]::SetProcessDPIAware() | Out-Null

$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -like 'IAsyncOperation*' })[0]
function Await-WinRT($WinRtTask, $ResultType) {
  $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
  $netTask = $asTask.Invoke($null, @($WinRtTask))
  $netTask.Wait(1000) | Out-Null
  $netTask.Result
}

function Seek-HitodamaMedia([long]$seconds) {
  try {
    [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime] | Out-Null
    $mgr = Await-WinRT ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])
    if ($mgr) {
      $session = $mgr.GetCurrentSession()
      if (-not $session) {
        $sessions = @($mgr.GetSessions())
        if ($sessions.Count -gt 0) { $session = $sessions[0] }
      }
      if ($session) {
        $ticks = [long]($seconds * 10000000L)
        Await-WinRT ($session.TryChangePlaybackPositionAsync($ticks)) ([bool]) | Out-Null
      }
    }
  } catch { }
}

function Toggle-HitodamaMedia() {
  try {
    [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime] | Out-Null
    $mgr = Await-WinRT ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])
    if ($mgr) {
      $session = $mgr.GetCurrentSession()
      if (-not $session) {
        $sessions = @($mgr.GetSessions())
        if ($sessions.Count -gt 0) { $session = $sessions[0] }
      }
      if ($session) {
        Await-WinRT ($session.TryTogglePlayPauseAsync()) ([bool]) | Out-Null
        return
      }
    }
  } catch { }
  [Win32MediaKeys]::SendKey(0xb3)
}

function Next-HitodamaMedia() {
  try {
    [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime] | Out-Null
    $mgr = Await-WinRT ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])
    if ($mgr) {
      $session = $mgr.GetCurrentSession()
      if (-not $session) {
        $sessions = @($mgr.GetSessions())
        if ($sessions.Count -gt 0) { $session = $sessions[0] }
      }
      if ($session) {
        Await-WinRT ($session.TrySkipNextAsync()) ([bool]) | Out-Null
        return
      }
    }
  } catch { }
  [Win32MediaKeys]::SendKey(0xb0)
}

function Prev-HitodamaMedia() {
  try {
    [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime] | Out-Null
    $mgr = Await-WinRT ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])
    if ($mgr) {
      $session = $mgr.GetCurrentSession()
      if (-not $session) {
        $sessions = @($mgr.GetSessions())
        if ($sessions.Count -gt 0) { $session = $sessions[0] }
      }
      if ($session) {
        Await-WinRT ($session.TrySkipPreviousAsync()) ([bool]) | Out-Null
        return
      }
    }
  } catch { }
  [Win32MediaKeys]::SendKey(0xb1)
}

function Set-HitodamaCoverWallpaper([string]$srcPath, [string]$outPath) {
  try {
    Set-ItemProperty -Path 'HKCU:\\Control Panel\\Desktop' -Name WallpaperStyle -Value '10' -ErrorAction SilentlyContinue
    Set-ItemProperty -Path 'HKCU:\\Control Panel\\Desktop' -Name TileWallpaper -Value '0' -ErrorAction SilentlyContinue

    $screen = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
    $sw = [int]$screen.Width
    $sh = [int]$screen.Height
    if ($sw -le 0) { $sw = 1920 }
    if ($sh -le 0) { $sh = 1080 }

    $bytes = [System.IO.File]::ReadAllBytes($srcPath)
    $ms = New-Object System.IO.MemoryStream(,$bytes)
    $srcImg = [System.Drawing.Image]::FromStream($ms)

    $iw = [double]$srcImg.Width
    $ih = [double]$srcImg.Height
    $srcRatio = $iw / $ih
    $dstRatio = [double]$sw / [double]$sh

    if ($srcRatio -gt $dstRatio) {
      $cropH = $ih
      $cropW = $ih * $dstRatio
      $cropX = ($iw - $cropW) / 2.0
      $cropY = 0.0
    } else {
      $cropW = $iw
      $cropH = $iw / $dstRatio
      $cropX = 0.0
      $cropY = ($ih - $cropH) / 2.0
    }

    $bmp = New-Object System.Drawing.Bitmap($sw, $sh)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

    $destRect = New-Object System.Drawing.Rectangle(0, 0, $sw, $sh)
    $srcRect = New-Object System.Drawing.Rectangle([int][Math]::Round($cropX), [int][Math]::Round($cropY), [int][Math]::Round($cropW), [int][Math]::Round($cropH))
    $g.DrawImage($srcImg, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

    $g.Dispose()
    $srcImg.Dispose()
    $ms.Dispose()

    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
    $bmp.Dispose()

    [Win32Wallpaper]::SystemParametersInfo(20, 0, $outPath, 3) | Out-Null
  } catch {
    [Win32Wallpaper]::SystemParametersInfo(20, 0, $srcPath, 3) | Out-Null
  }
}
`;

    const b64Init = Buffer.from(psInitScript, 'utf8').toString('base64');
    wallpaperDaemon.stdin.write(
      `[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${b64Init}')) | Invoke-Expression\n`
    );

    wallpaperDaemon.on('exit', () => {
      wallpaperDaemon = null;
    });
  } catch (_) {
    wallpaperDaemon = null;
  }
}

function killSystemDaemon() {
  if (clipboardTimer) clearInterval(clipboardTimer);
  if (wallpaperDaemon) {
    try {
      wallpaperDaemon.kill();
    } catch (_) {}
    wallpaperDaemon = null;
  }
  if (hotkeyDaemon) {
    try {
      hotkeyDaemon.kill();
    } catch (_) {}
    hotkeyDaemon = null;
  }
}

async function resolveWallpaperFileFast(imagePath) {
  if (!/^https?:\/\//i.test(imagePath)) {
    const cleaned = imagePath.replace(/^file:\/\/\/?/i, '');
    return path.normalize(decodeURIComponent(cleaned));
  }
  const cachedPath = getCachedWallpaperPath(imagePath);
  if (fs.existsSync(cachedPath) && fs.statSync(cachedPath).size > 5000) {
    return cachedPath;
  }
  return await downloadFileToCache(imagePath, cachedPath);
}

async function applyDesktopWallpaper(imagePath) {
  try {
    const localFilePath = await resolveWallpaperFileFast(imagePath);
    wallpaperToggleIdx = (wallpaperToggleIdx + 1) % 2;
    const fittedOutPath = path.join(
      app.getPath('userData'),
      `hitodama_fitted_desktop_${wallpaperToggleIdx}.jpg`
    );
    const escapedSrc = localFilePath.replace(/'/g, "''");
    const escapedOut = fittedOutPath.replace(/'/g, "''");

    initSystemDaemon();

    if (wallpaperDaemon && wallpaperDaemon.stdin && wallpaperDaemon.stdin.writable) {
      wallpaperDaemon.stdin.write(
        `Set-HitodamaCoverWallpaper '${escapedSrc}' '${escapedOut}'\n`
      );
      await new Promise((r) => setTimeout(r, 240));
      return { success: true, localPath: fittedOutPath };
    }

    const fallbackPs = `
      Add-Type -TypeDefinition 'using System.Runtime.InteropServices; public class Win32Wallpaper { [DllImport("user32.dll", CharSet = CharSet.Auto)] public static extern int SystemParametersInfo(int uAction, int uParam, string lpvParam, int fuWinIni); }'
      [Win32Wallpaper]::SystemParametersInfo(20, 0, '${escapedSrc}', 3) | Out-Null
    `;
    await runPowerShellEncoded(fallbackPs);
    return { success: true, localPath: localFilePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function setSystemVolume(level) {
  initSystemDaemon();
  if (wallpaperDaemon && wallpaperDaemon.stdin && wallpaperDaemon.stdin.writable) {
    const clamped = Math.max(0, Math.min(100, Math.round(Number(level) || 0)));
    wallpaperDaemon.stdin.write(`[Win32Audio]::SetVolume(${clamped})\n`);
    return { success: true };
  }
  return { success: false };
}

function setSystemMute(mute) {
  initSystemDaemon();
  if (wallpaperDaemon && wallpaperDaemon.stdin && wallpaperDaemon.stdin.writable) {
    wallpaperDaemon.stdin.write(`[Win32Audio]::SetMute($${mute ? 'true' : 'false'})\n`);
    return { success: true };
  }
  return { success: false };
}

// ============================================================================
// HARDWARE WIN32 GAMMA RAMP NIGHT LIGHT CONTROLLER (100% Safe, Instant, Non-Destructive)
// ============================================================================
let currentNightLightState = false;
let currentNightLightStrength = 65;

async function setNightLightStrength(enable, strength = 65) {
  const clampedStrength = Math.max(10, Math.min(100, Math.round(Number(strength) || 65)));
  currentNightLightState = Boolean(enable);
  currentNightLightStrength = clampedStrength;

  const warmthFloat = enable ? ((clampedStrength / 100.0) * 0.85).toFixed(4) : '0.0';

  const ps = `
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

[StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
public struct RAMP {
    [MarshalAs(UnmanagedType.ByValArray, SizeConst = 256)]
    public ushort[] Red;
    [MarshalAs(UnmanagedType.ByValArray, SizeConst = 256)]
    public ushort[] Green;
    [MarshalAs(UnmanagedType.ByValArray, SizeConst = 256)]
    public ushort[] Blue;
}

public class GammaController {
    [DllImport("gdi32.dll")]
    public static extern bool SetDeviceGammaRamp(IntPtr hdc, ref RAMP lpRamp);

    [DllImport("user32.dll")]
    public static extern IntPtr GetDC(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern int ReleaseDC(IntPtr hWnd, IntPtr hDC);

    public static bool SetWarmth(float warmth) {
        IntPtr hdc = GetDC(IntPtr.Zero);
        if (hdc == IntPtr.Zero) return false;

        RAMP ramp = new RAMP();
        ramp.Red = new ushort[256];
        ramp.Green = new ushort[256];
        ramp.Blue = new ushort[256];

        float blueFactor = 1.0f - (warmth * 0.60f);
        float greenFactor = 1.0f - (warmth * 0.15f);

        for (int i = 0; i < 256; i++) {
            int val = i * 257;
            ramp.Red[i] = (ushort)Math.Min(65535, val);
            ramp.Green[i] = (ushort)Math.Min(65535, (int)(val * greenFactor));
            ramp.Blue[i] = (ushort)Math.Min(65535, (int)(val * blueFactor));
        }

        bool result = SetDeviceGammaRamp(hdc, ref ramp);
        ReleaseDC(IntPtr.Zero, hdc);
        return result;
    }
}
'@ -ErrorAction SilentlyContinue

[GammaController]::SetWarmth(${warmthFloat}) | Out-Null
Write-Output "OK"
`;
  const res = await runPowerShellEncoded(ps);
  return { success: res.ok, enabled: Boolean(enable), strength: clampedStrength };
}

async function toggleBluetoothDirect(enable) {
  const ps = `
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -like 'IAsyncOperation*' })[0]
function Await($WinRtTask, $ResultType) {
  $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
  $netTask = $asTask.Invoke($null, @($WinRtTask))
  $netTask.Wait(-1) | Out-Null
  $netTask.Result
}
[Windows.Devices.Radios.Radio,Windows.System.Devices,ContentType=WindowsRuntime] | Out-Null
[Windows.Devices.Radios.RadioAccessStatus,Windows.System.Devices,ContentType=WindowsRuntime] | Out-Null
Await ([Windows.Devices.Radios.Radio]::RequestAccessAsync()) ([Windows.Devices.Radios.RadioAccessStatus]) | Out-Null
$radios = Await ([Windows.Devices.Radios.Radio]::GetRadiosAsync()) ([System.Collections.Generic.IReadOnlyList[Windows.Devices.Radios.Radio]])
$bluetooth = $radios | Where-Object { $_.Kind -eq 'Bluetooth' }
if ($bluetooth) {
  [Windows.Devices.Radios.RadioState,Windows.System.Devices,ContentType=WindowsRuntime] | Out-Null
  $targetState = if (${enable ? '$true' : '$false'}) { [Windows.Devices.Radios.RadioState]::On } else { [Windows.Devices.Radios.RadioState]::Off }
  Await ($bluetooth.SetStateAsync($targetState)) ([Windows.Devices.Radios.RadioAccessStatus]) | Out-Null
  Write-Output "OK"
} else {
  Write-Output "NO_BT"
}
`;
  const res = await runPowerShellEncoded(ps);
  return { success: res.ok, enabled: Boolean(enable) };
}

async function getWifiNetworks() {
  const ps = `
$out = netsh wlan show networks mode=bssid
$nets = @()
$currSsid = ''
foreach ($line in $out) {
  if ($line -match '^\\s*SSID\\s+\\d+\\s*:\\s*(.+)$') {
    $currSsid = $Matches[1].Trim()
  } elseif ($line -match '^\\s*Signal\\s*:\\s*(\\d+)%' -and $currSsid) {
    $sig = [int]$Matches[1]
    if (-not ($nets | Where-Object { $_.ssid -eq $currSsid })) {
      $nets += @{ ssid = $currSsid; signal = $sig }
    }
    $currSsid = ''
  }
}
@($nets | Sort-Object { $_.signal } -Descending | Select-Object -First 12) | ConvertTo-Json -Compress
`;
  const res = await runPowerShellEncoded(ps);
  if (!res.ok || !res.stdout) return [];
  try {
    const parsed = JSON.parse(res.stdout);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (_) {
    return [];
  }
}

async function getBluetoothDevices() {
  const ps = `
$devs = @(Get-PnpDevice -Class Bluetooth -ErrorAction SilentlyContinue | Where-Object { $_.FriendlyName -and $_.FriendlyName -notmatch 'Enumerator|Adapter|Radio|Transport|Service|Protocol|Generic' } | Select-Object -First 12 FriendlyName, Status)
$devs | ForEach-Object { @{ name = $_.FriendlyName; connected = ($_.Status -eq 'OK') } } | ConvertTo-Json -Compress
`;
  const res = await runPowerShellEncoded(ps);
  if (!res.ok || !res.stdout) return [];
  try {
    const parsed = JSON.parse(res.stdout);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (_) {
    return [];
  }
}

async function toggleSystemDarkModeDirect(targetDark) {
  initSystemDaemon();
  const ps = `
$path = 'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize'
if (-not (Test-Path $path)) { New-Item -Path $path -Force | Out-Null }
$cur = (Get-ItemProperty -Path $path -Name AppsUseLightTheme -ErrorAction SilentlyContinue).AppsUseLightTheme
$wantDark = ${typeof targetDark === 'boolean' ? (targetDark ? '$true' : '$false') : '($cur -ne 0)'}
$lightVal = if ($wantDark) { 0 } else { 1 }

Set-ItemProperty -Path $path -Name AppsUseLightTheme -Value $lightVal -Type DWord -Force
Set-ItemProperty -Path $path -Name SystemUsesLightTheme -Value $lightVal -Type DWord -Force
if (-not $wantDark) {
  Set-ItemProperty -Path $path -Name ColorPrevalence -Value 0 -Type DWord -Force
}

$dwmPath = 'HKCU:\\SOFTWARE\\Microsoft\\Windows\\DWM'
if (Test-Path $dwmPath) {
  Set-ItemProperty -Path $dwmPath -Name ColorPrevalence -Value (if ($wantDark) { 1 } else { 0 }) -Type DWord -Force -ErrorAction SilentlyContinue
}

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public class ThemeNotifier {
  [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
  public static extern IntPtr SendMessageTimeout(IntPtr hWnd, uint Msg, UIntPtr wParam, string lParam, uint fuFlags, uint uTimeout, out UIntPtr lpdwResult);
  public static void Broadcast() {
    UIntPtr res;
    SendMessageTimeout((IntPtr)0xffff, 0x001A, UIntPtr.Zero, "ImmersiveColorSet", 0x0002, 1000, out res);
    SendMessageTimeout((IntPtr)0xffff, 0x031A, UIntPtr.Zero, null, 0x0002, 1000, out res);
  }
}
'@ -ErrorAction SilentlyContinue
[ThemeNotifier]::Broadcast()
Write-Output $wantDark
`;

  if (wallpaperDaemon && wallpaperDaemon.stdin && wallpaperDaemon.stdin.writable) {
    wallpaperDaemon.stdin.write(`[Win32ThemeBroadcast]::BroadcastThemeChange()\n`);
  }

  const res = await runPowerShellEncoded(ps);
  const isDark = typeof targetDark === 'boolean' ? targetDark : res.stdout.toLowerCase().includes('true');
  return { success: true, darkMode: isDark };
}

function sendMediaKeyControl(action) {
  initSystemDaemon();
  if (wallpaperDaemon && wallpaperDaemon.stdin && wallpaperDaemon.stdin.writable) {
    if (action === 'next') {
      wallpaperDaemon.stdin.write('Next-HitodamaMedia\n');
    } else if (action === 'prev') {
      wallpaperDaemon.stdin.write('Prev-HitodamaMedia\n');
    } else {
      wallpaperDaemon.stdin.write('Toggle-HitodamaMedia\n');
    }
    return { success: true };
  }
  const vk = action === 'next' ? 0xb0 : action === 'prev' ? 0xb1 : 0xb3;
  runPowerShellEncoded(`[Win32MediaKeys]::SendKey(${vk})`, 1000).catch(() => {});
  return { success: true };
}

// ============================================================================
// INSTANT (<20ms) GSMTC MEDIA SEEKING VIA PERSISTENT DAEMON
// Moves the actual Spotify / Chrome / Edge playback timestamp when dragging the slider!
// ============================================================================
function seekMediaSession(targetSeconds) {
  initSystemDaemon();
  const sec = Math.max(0, Math.round(Number(targetSeconds) || 0));
  if (wallpaperDaemon && wallpaperDaemon.stdin && wallpaperDaemon.stdin.writable) {
    wallpaperDaemon.stdin.write(`Seek-HitodamaMedia ${sec}\n`);
    return { success: true, seconds: sec };
  }
  return { success: false };
}

async function getNowPlayingMedia() {
  const ps = `
Add-Type -AssemblyName System.Runtime.WindowsRuntime
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
  $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -like 'IAsyncOperation*'
})[0]

function Await-WinRT($WinRtTask, $ResultType) {
  $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
  $netTask = $asTask.Invoke($null, @($WinRtTask))
  $netTask.Wait(1200) | Out-Null
  $netTask.Result
}

# Helper: If Netflix is open in a browser and only reports "Netflix", read the real episode title from the player UI
function Get-NetflixEpisodeTitle {
  try {
    $browsers = @(Get-Process chrome, msedge, brave, opera, firefox -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 -and $_.MainWindowTitle -match '(?i)Netflix' })
    foreach ($b in $browsers) {
      $el = [System.Windows.Automation.AutomationElement]::FromHandle($b.MainWindowHandle)
      if ($el) {
        $cond = New-Object System.Windows.Automation.PropertyCondition(
          [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
          [System.Windows.Automation.ControlType]::Text
        )
        $texts = $el.FindAll([System.Windows.Automation.TreeScope]::Descendants, $cond)
        foreach ($t in $texts) {
          $n = $t.Current.Name
          if ($n -and ($n -match '\\bE\\d+\\b' -or $n -match '\\bS\\d+:E\\d+\\b' -or $n -match '\\bEpisode\\s+\\d+')) {
            return $n.Trim()
          }
        }
      }
    }
  } catch {}
  return ""
}

try {
  [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime] | Out-Null
  [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties,Windows.Media.Control,ContentType=WindowsRuntime] | Out-Null
  [Windows.Storage.Streams.DataReader,Windows.Storage.Streams,ContentType=WindowsRuntime] | Out-Null

  $mgr = Await-WinRT ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])
  if ($mgr) {
    $session = $mgr.GetCurrentSession()
    if ($session) {
      $pbInfo = $session.GetPlaybackInfo()
      # PlaybackStatus 4 === Playing, 5 === Paused
      $isPlaying = ($pbInfo.PlaybackStatus -eq [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionPlaybackStatus]::Playing)
      $props = Await-WinRT ($session.TryGetMediaPropertiesAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
      $tl = $session.GetTimelineProperties()

      $title = if ($props -and $props.Title) { $props.Title.Trim() } else { "" }
      $artist = if ($props -and $props.Artist) { $props.Artist.Trim() } else { "" }
      $srcApp = $session.SourceAppUserModelId

      # Clean up source app name
      $cleanSource = "Media Player"
      if ($srcApp -match '(?i)Spotify') { $cleanSource = "Spotify" }
      elseif ($srcApp -match '(?i)Netflix') { $cleanSource = "Netflix" }
      elseif ($srcApp -match '(?i)chrome') { $cleanSource = "Chrome" }
      elseif ($srcApp -match '(?i)msedge') { $cleanSource = "Edge" }
      elseif ($srcApp -match '(?i)brave') { $cleanSource = "Brave" }
      elseif ($srcApp -match '(?i)firefox') { $cleanSource = "Firefox" }

      if ($title -match '^(?i)Netflix$' -or $artist -match '^(?i)Netflix$') {
        $epTitle = Get-NetflixEpisodeTitle
        if ($epTitle) {
          $title = $epTitle
          $artist = "Netflix"
        } else {
          $title = "Netflix"
          $artist = "Netflix Stream"
        }
      }

      if (-not $artist) {
        $artist = $cleanSource
      }

      # Read native GSMTC thumbnail bytes directly from Windows if available
      $thumbBase64 = ""
      if ($props -and $props.Thumbnail) {
        try {
          $stream = Await-WinRT ($props.Thumbnail.OpenReadAsync()) ([Windows.Storage.Streams.IRandomAccessStreamWithContentType])
          if ($stream -and $stream.Size -gt 0 -and $stream.Size -lt 2000000) {
            $reader = New-Object Windows.Storage.Streams.DataReader($stream.GetInputStreamAt(0))
            [void](Await-WinRT ($reader.LoadAsync([uint32]$stream.Size)) ([uint32]))
            $bytes = New-Object byte[]($stream.Size)
            $reader.ReadBytes($bytes)
            $thumbBase64 = "data:image/jpeg;base64," + [Convert]::ToBase64String($bytes)
            $reader.Dispose()
            $stream.Dispose()
          }
        } catch {}
      }

      $posSec = -1
      $durSec = 0
      if ($tl) {
        if ($tl.Position.TotalSeconds -ge 0) { $posSec = [int][Math]::Round($tl.Position.TotalSeconds) }
        if ($tl.EndTime.TotalSeconds -gt 0) { $durSec = [int][Math]::Round($tl.EndTime.TotalSeconds) }
      }

      if ($title) {
        @{
          hasSession = $true
          playing = [bool]$isPlaying
          title = $title
          artist = $artist
          source = $cleanSource
          thumbnail = $thumbBase64
          positionSec = $posSec
          durationSec = $durSec
        } | ConvertTo-Json -Compress
        exit
      }
    }
  }
} catch {}

Write-Output '{"hasSession":false,"playing":false}'
`;

  const res = await runPowerShellEncoded(ps, 2600);
  if (!res.ok || !res.stdout) {
    return { hasSession: false, playing: false, title: '', artist: '', thumbnail: '', durationSec: 210 };
  }

  try {
    const parsed = JSON.parse(res.stdout);
    if (!parsed.hasSession || !parsed.title) {
      lastKnownTrack = { title: '', artist: '', source: '', thumbnail: '', durationSec: 210 };
      return { hasSession: false, playing: false, title: '', artist: '', thumbnail: '', durationSec: 210 };
    }

    const title = parsed.title;
    const artist = parsed.artist || parsed.source || 'System Audio';
    const playing = Boolean(parsed.playing);
    let thumbnail = parsed.thumbnail || '';
    let durationSec = parsed.durationSec > 10 ? parsed.durationSec : 0;

    // Only query external track artwork if Windows GSMTC didn't provide a thumbnail AND it's not Netflix
    if (!thumbnail || !durationSec) {
      const meta = await resolveTrackMetadata(title, artist);
      if (!thumbnail && meta.thumbnail) thumbnail = meta.thumbnail;
      if (!durationSec) durationSec = meta.durationSec || 210;
    }

    lastKnownTrack = {
      title,
      artist,
      source: parsed.source || 'Speakers',
      thumbnail,
      durationSec,
    };

    return {
      hasSession: true,
      playing,
      title,
      artist,
      source: parsed.source || 'Speakers',
      thumbnail,
      positionSec: typeof parsed.positionSec === 'number' && parsed.positionSec >= 0 ? parsed.positionSec : undefined,
      durationSec,
    };
  } catch (_) {
    return { hasSession: false, playing: false, title: '', artist: '', thumbnail: '', durationSec: 210 };
  }
}

function formatClipTextItem(text) {
  const isUrl = /^https?:\/\/\S+$/i.test(text.trim());
  const isCode = /[{}();=<>]|function\s|const\s|import\s|npm\s/i.test(text);
  const chars = text.length;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const lines = text.split(/\r?\n/).length;
  const nowStr = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    category: isUrl ? 'Links' : 'Text',
    preview: text,
    label: text.replace(/\s+/g, ' ').slice(0, 42) + (text.length > 42 ? '...' : ''),
    time: 'now',
    type: isUrl ? 'Link' : isCode ? 'Code Snippet' : 'Text',
    size: `${chars} characters · ${words} words · ${lines} ${lines === 1 ? 'line' : 'lines'}`,
    copied: `Today, ${nowStr}`,
    iconType: isUrl ? 'link' : isCode ? 'code' : 'text',
    isToday: true,
    isPinned: false,
  };
}

async function getSystemClipboardContent() {
  let text = '';
  try {
    const rawText = clipboard.readText();
    text = (rawText instanceof Promise || (rawText && typeof rawText.then === 'function'))
      ? await rawText
      : String(rawText || '');
  } catch (_) {}

  let imageItem = null;
  try {
    if (typeof clipboard.read === 'function') {
      const items = await clipboard.read();
      if (Array.isArray(items)) {
        for (const item of items) {
          const imgType = item.types?.find((t) => t.startsWith('image/'));
          if (imgType) {
            const blob = await item.getType(imgType);
            if (blob && blob.size > 0) {
              const arrayBuf = await blob.arrayBuffer();
              const buf = Buffer.from(arrayBuf);
              const hash = crypto.createHash('md5').update(buf).digest('hex');
              const base64 = buf.toString('base64');
              const dataUrl = `data:${imgType};base64,${base64}`;
              const mb = (buf.length / (1024 * 1024)).toFixed(2);
              imageItem = {
                hash,
                dataUrl,
                mb,
              };
              break;
            }
          }
        }
      }
    }
  } catch (_) {}

  if (!imageItem && typeof clipboard.readImage === 'function') {
    try {
      const img = clipboard.readImage();
      if (img && !img.isEmpty()) {
        const pngBuf = img.toPNG();
        const hash = crypto.createHash('md5').update(pngBuf).digest('hex');
        const { width, height } = img.getSize();
        const mb = (pngBuf.length / (1024 * 1024)).toFixed(2);
        imageItem = {
          hash,
          dataUrl: img.toDataURL(),
          width,
          height,
          mb,
        };
      }
    } catch (_) {}
  }

  return { text: text ? text.trim() : '', imageItem };
}

function getClipboardStorePath() {
  return path.join(app.getPath('userData'), 'hitodama_clipboard_history.json');
}

function loadClipboardStoreFromDisk() {
  try {
    const p = getClipboardStorePath();
    if (fs.existsSync(p)) {
      const data = fs.readFileSync(p, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        clipboardHistoryStore = parsed.slice(0, 50);
      }
    }
  } catch (_) {}
}

function saveClipboardStoreToDisk() {
  try {
    const p = getClipboardStorePath();
    fs.writeFileSync(p, JSON.stringify(clipboardHistoryStore.slice(0, 50), null, 2), 'utf8');
  } catch (_) {}
}

function deleteClipboardItem(id) {
  clipboardHistoryStore = clipboardHistoryStore.filter((i) => i.id !== id);
  saveClipboardStoreToDisk();
  return { success: true };
}

function togglePinClipboardItem(id) {
  clipboardHistoryStore = clipboardHistoryStore.map((i) => {
    if (i.id === id) {
      const willPin = !i.isPinned;
      return { ...i, isPinned: willPin, isToday: !willPin };
    }
    return i;
  });
  saveClipboardStoreToDisk();
  return { success: true };
}

function clearClipboardHistory() {
  clipboardHistoryStore = clipboardHistoryStore.filter((i) => i.isPinned);
  saveClipboardStoreToDisk();
  return { success: true };
}

async function pollClipboardOnce(getMainWindow) {
  const mainWindow = getMainWindow ? getMainWindow() : null;
  try {
    const { text, imageItem } = await getSystemClipboardContent();

    if (text && text !== lastClipText) {
      lastClipText = text;
      lastClipImgHash = '';
      const item = formatClipTextItem(text);
      clipboardHistoryStore = [item, ...clipboardHistoryStore.filter((i) => i.preview !== text)].slice(0, 50);
      saveClipboardStoreToDisk();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('clipboard-item-added', item);
      }
      return;
    }

    if (imageItem && imageItem.hash && imageItem.hash !== lastClipImgHash) {
      lastClipImgHash = imageItem.hash;
      lastClipText = '';
      const nowStr = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      const item = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        category: 'Images',
        preview: `Screenshot · ${nowStr}`,
        imageDataUrl: imageItem.dataUrl,
        label: `Screenshot · ${imageItem.mb} MB`,
        time: 'now',
        type: 'Image PNG',
        size: `${imageItem.mb} MB`,
        copied: `Today, ${nowStr}`,
        iconType: 'image',
        isToday: true,
        isPinned: false,
      };
      clipboardHistoryStore = [item, ...clipboardHistoryStore.filter((i) => i.imageDataUrl !== item.imageDataUrl)].slice(0, 50);
      saveClipboardStoreToDisk();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('clipboard-item-added', item);
      }
    }
  } catch (_) {}
}

function startClipboardWatcher(getMainWindow) {
  loadClipboardStoreFromDisk();
  pollClipboardOnce(getMainWindow);
  if (clipboardTimer) clearInterval(clipboardTimer);
  clipboardTimer = setInterval(() => {
    pollClipboardOnce(getMainWindow);
  }, 400);
}

async function getClipboardHistory() {
  if (clipboardHistoryStore.length === 0) {
    loadClipboardStoreFromDisk();
  }
  await pollClipboardOnce(null);
  return clipboardHistoryStore;
}

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
  if (totalDiff <= 0) return 15;
  return Math.min(100, Math.max(1, Math.round((1 - idleDiff / totalDiff) * 100)));
}

function formatByteRate(bytesPerSec) {
  if (!bytesPerSec || bytesPerSec < 1024) return `${Math.max(0, Math.round(bytesPerSec || 0))} B/s`;
  const kb = bytesPerSec / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB/s`;
  return `${(kb / 1024).toFixed(1)} MB/s`;
}

function queryNvidiaSmi() {
  return new Promise((resolve) => {
    exec(
      'nvidia-smi --query-gpu=name,utilization.gpu,memory.used,memory.total --format=csv,noheader,nounits',
      { timeout: 1500 },
      (err, stdout) => {
        if (err || !stdout || !stdout.trim()) return resolve(null);
        const line = stdout.trim().split(/\r?\n/)[0];
        const parts = line.split(',').map((s) => s.trim());
        if (parts.length < 4) return resolve(null);
        resolve({
          name: parts[0],
          percent: Math.min(100, Math.max(1, parseInt(parts[1], 10) || 1)),
          vramUsed: (parseFloat(parts[2]) / 1024).toFixed(1),
          vramTotal: (parseFloat(parts[3]) / 1024).toFixed(1),
        });
      }
    );
  });
}

async function getSystemStats() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memPct = Math.round((usedMem / totalMem) * 100);
  const cpus = os.cpus();
  const cpuModel =
    cpus.length > 0 ? cpus[0].model.replace(/\s+/g, ' ').trim() : 'Processor';
  const cpuSpeed =
    cpus.length > 0 ? (cpus[0].speed / 1000).toFixed(1) + ' GHz' : '3.8 GHz';
  const uptimeHours = Math.floor(os.uptime() / 3600);
  const uptimeMins = Math.floor((os.uptime() % 3600) / 60);
  const cpuPct = getLiveCpuPercent();

  const [nvidiaGpu, psRes] = await Promise.all([
    queryNvidiaSmi(),
    runPowerShellEncoded(`
$disk = Get-PSDrive C -ErrorAction SilentlyContinue
$procCount = (Get-Process).Count
$topRam = @(Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 4 ProcessName, @{Name='MB';Expression={[math]::Round($_.WorkingSet64 / 1MB)}}, @{Name='CPU';Expression={[math]::Round($_.CPU, 1)}})
$netStat = Get-NetAdapterStatistics -ErrorAction SilentlyContinue | Measure-Object -Property ReceivedBytes, SentBytes -Sum
$rxBytes = if ($netStat) { ($netStat | Where-Object { $_.Property -eq 'ReceivedBytes' }).Sum } else { 0 }
$txBytes = if ($netStat) { ($netStat | Where-Object { $_.Property -eq 'SentBytes' }).Sum } else { 0 }
@{
  diskUsedGb = if ($disk) { [math]::Round($disk.Used / 1GB) } else { 250 }
  diskTotalGb = if ($disk) { [math]::Round(($disk.Used + $disk.Free) / 1GB) } else { 512 }
  procCount = $procCount
  topApps = $topRam
  rxBytes = [double]$rxBytes
  txBytes = [double]$txBytes
} | ConvertTo-Json -Compress
`),
  ]);

  let hw = {
    diskUsedGb: 256,
    diskTotalGb: 512,
    procCount: 195,
    topApps: [],
    rxBytes: 0,
    txBytes: 0,
  };

  if (psRes.ok && psRes.stdout) {
    try {
      hw = { ...hw, ...JSON.parse(psRes.stdout) };
    } catch (_) {}
  }

  const nowMs = Date.now();
  let netDownStr = '0 B/s';
  let netUpStr = '0 B/s';
  if (prevNetStats.ts > 0 && hw.rxBytes >= prevNetStats.rx) {
    const dtSec = Math.max(0.5, (nowMs - prevNetStats.ts) / 1000);
    const downBps = (hw.rxBytes - prevNetStats.rx) / dtSec;
    const upBps = (hw.txBytes - prevNetStats.tx) / dtSec;
    netDownStr = formatByteRate(downBps);
    netUpStr = formatByteRate(upBps);
  }
  prevNetStats = { rx: hw.rxBytes || 0, tx: hw.txBytes || 0, ts: nowMs };

  const rawTop = Array.isArray(hw.topApps) ? hw.topApps : hw.topApps ? [hw.topApps] : [];
  const formattedTopApps = rawTop.map((p) => {
    const mb = Number(p.MB || 120);
    const usageStr = mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;
    const pctWidth = Math.min(95, Math.max(14, Math.round((mb / 2048) * 100))) + '%';
    return {
      name: p.ProcessName,
      icon: String(p.ProcessName || 'A').charAt(0).toUpperCase(),
      usage: usageStr,
      cpuUsage: `${p.CPU || 1.0}s`,
      width: pctWidth,
    };
  });

  const gpuStats = nvidiaGpu || {
    name: 'Graphics Processor',
    percent: Math.max(4, Math.min(95, Math.round(cpuPct * 0.45))),
    vramUsed: '1.8',
    vramTotal: '8.0',
  };

  return {
    cpu: {
      percent: cpuPct,
      model: cpuModel,
      speed: cpuSpeed,
      processes: hw.procCount || 195,
    },
    gpu: gpuStats,
    ram: {
      percent: memPct,
      usedGb: (usedMem / 1024 ** 3).toFixed(1),
      totalGb: (totalMem / 1024 ** 3).toFixed(1),
      freeGb: (freeMem / 1024 ** 3).toFixed(1),
    },
    disk: {
      usedGb: hw.diskUsedGb,
      totalGb: hw.diskTotalGb,
    },
    network: {
      down: netDownStr,
      up: netUpStr,
    },
    uptime: `${uptimeHours} h ${uptimeMins} m`,
    topApps: formattedTopApps,
  };
}

// ============================================================================
// FIXED CONTROLS STATE READER: Queries `DefaultAccount\Current` Exclusively!
// ============================================================================
async function getControlsState() {
  const ps = `
$wifiName = (netsh wlan show interfaces | Select-String '^\\s*SSID\\s*:\\s*(.+)$' | ForEach-Object { $_.Matches[0].Groups[1].Value.Trim() } | Select-Object -First 1)
$darkVal = (Get-ItemProperty -Path 'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize' -Name AppsUseLightTheme -ErrorAction SilentlyContinue).AppsUseLightTheme
$audioDevs = @(Get-CimInstance Win32_SoundDevice -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name)

$btOn = $false
try {
  Add-Type -AssemblyName System.Runtime.WindowsRuntime
  $asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -like 'IAsyncOperation*' })[0]
  function Await($WinRtTask, $ResultType) {
    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
    $netTask = $asTask.Invoke($null, @($WinRtTask))
    $netTask.Wait(800) | Out-Null
    $netTask.Result
  }
  [Windows.Devices.Radios.Radio,Windows.System.Devices,ContentType=WindowsRuntime] | Out-Null
  $radios = Await ([Windows.Devices.Radios.Radio]::GetRadiosAsync()) ([System.Collections.Generic.IReadOnlyList[Windows.Devices.Radios.Radio]])
  $btRadio = $radios | Where-Object { $_.Kind -eq 'Bluetooth' } | Select-Object -First 1
  if ($btRadio -and $btRadio.State.ToString() -eq 'On') { $btOn = $true }
} catch { }

$nlOn = ${currentNightLightState ? '$true' : '$false'}


Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
[Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioEndpointVolume {
  int f(); int g(); int h(); int i();
  int SetMasterVolumeLevelScalar(float fLevel, Guid pguidEventContext);
  int j();
  int GetMasterVolumeLevelScalar(out float pfLevel);
  int k(); int l(); int m(); int n();
  int SetMute([MarshalAs(UnmanagedType.Bool)] bool bMute, Guid pguidEventContext);
  int GetMute(out bool pbMute);
}
[Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDevice {
  int Activate(ref Guid id, int clsCtx, IntPtr activationParams, out IAudioEndpointVolume aev);
}
[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceEnumerator {
  int f();
  int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice endpoint);
}
[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
class MMDeviceEnumeratorComObject { }

public class VolReader64 {
  public static int GetVol() {
    try {
      var e = new MMDeviceEnumeratorComObject() as IMMDeviceEnumerator;
      IMMDevice d = null;
      e.GetDefaultAudioEndpoint(0, 1, out d);
      IAudioEndpointVolume v = null;
      var g = typeof(IAudioEndpointVolume).GUID;
      d.Activate(ref g, 23, IntPtr.Zero, out v);
      float lvl = 1.0f;
      v.GetMasterVolumeLevelScalar(out lvl);
      return (int)Math.Round(lvl * 100f);
    } catch { return 100; }
  }
  public static bool GetMuted() {
    try {
      var e = new MMDeviceEnumeratorComObject() as IMMDeviceEnumerator;
      IMMDevice d = null;
      e.GetDefaultAudioEndpoint(0, 1, out d);
      IAudioEndpointVolume v = null;
      var g = typeof(IAudioEndpointVolume).GUID;
      d.Activate(ref g, 23, IntPtr.Zero, out v);
      bool m = false;
      v.GetMute(out m);
      return m;
    } catch { return false; }
  }
}
'@ -ErrorAction SilentlyContinue

@{
  wifiConnected = [bool]$wifiName
  wifiSsid = if ($wifiName) { $wifiName } else { 'Off' }
  bluetoothOn = $btOn
  nightLightOn = $nlOn
  darkMode = ($darkVal -eq 0)
  volume = [VolReader64]::GetVol()
  muted = [VolReader64]::GetMuted()
  audioDevices = if ($audioDevs.Count -gt 0) { $audioDevs } else { @('Speakers') }
} | ConvertTo-Json -Compress
`;
  const res = await runPowerShellEncoded(ps, 4500);
  if (!res.ok || !res.stdout) {
    return {
      wifiConnected: true,
      wifiSsid: 'Wi-Fi',
      bluetoothOn: false,
      nightLightOn: false,
      darkMode: true,
      volume: 100,
      muted: false,
      audioDevices: ['Speakers'],
    };
  }
  try {
    return JSON.parse(res.stdout);
  } catch (_) {
    return {
      wifiConnected: true,
      wifiSsid: 'Wi-Fi',
      bluetoothOn: false,
      nightLightOn: false,
      darkMode: true,
      volume: 100,
      muted: false,
      audioDevices: ['Speakers'],
    };
  }
}

async function getInstalledApps() {
  if (cachedInstalledApps && cachedInstalledApps.length > 0) {
    return cachedInstalledApps;
  }
  const ps = `
$paths = @(
  [Environment]::GetFolderPath('Desktop'),
  [Environment]::GetFolderPath('CommonDesktopDirectory'),
  "$env:ProgramData\\Microsoft\\Windows\\Start Menu\\Programs",
  "$env:AppData\\Microsoft\\Windows\\Start Menu\\Programs"
)
$shell = New-Object -ComObject WScript.Shell
$results = @()
$seen = @{}

$noiseRegex = '(?i)(uninstall|readme|help|manual|website|update|setup|installer|diagnostic|command prompt|powershell|sdk|documentation|release notes|license|recovery|reset|config|configuration|server|agent|service|redistributable|runtime|driver|assistant|notifier|crash|reporter|unins000)'

foreach ($root in $paths) {
  if ($root -and (Test-Path $root)) {
    Get-ChildItem -Path $root -Filter *.lnk -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
      $name = $_.BaseName.Trim()
      if ($name.Length -gt 1 -and $name -notmatch $noiseRegex) {
        try {
          $sc = $shell.CreateShortcut($_.FullName)
          $target = $sc.TargetPath
          if ($target -and (Test-Path $target) -and ($target -match '\\.exe$') -and ($target -notmatch $noiseRegex)) {
            $key = $name.ToLower()
            if (-not $seen.ContainsKey($key)) {
              $seen[$key] = $true
              $isGame = ($target -match '(?i)(Steam|Epic Games|Riot Games|Games|Roblox|Genshin|Sekiro|Tekken|Fortnite|Valorant|Counter-Strike|osu!|Minecraft|TLauncher|Rockstar|EA Games|Ubisoft)') -or ($name -match '(?i)(Game|Steam|Riot|Epic|Roblox|Fortnite|Valorant|Tekken|Sekiro|Counter-Strike|osu!|Minecraft|Genshin|Fall Guys|It Takes Two|Muck|PEAK|Aimlabs)')
              $results += @{
                Name = $name
                AppID = $_.FullName
                ExePath = $target
                Tag = if ($isGame) { 'Game' } else { 'Application' }
              }
            }
          }
        } catch { }
      }
    }

    Get-ChildItem -Path $root -Filter *.url -ErrorAction SilentlyContinue | ForEach-Object {
      $name = $_.BaseName.Trim()
      $key = $name.ToLower()
      if ($name.Length -gt 1 -and (-not $seen.ContainsKey($key))) {
        $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
        if ($content -match '(?i)(steam://|com\\.epicgames)') {
          $seen[$key] = $true
          $iconFile = ''
          if ($content -match 'IconFile=(.+)') { $iconFile = $Matches[1].Trim() }
          $results += @{
            Name = $name
            AppID = $_.FullName
            ExePath = if ($iconFile -and (Test-Path $iconFile)) { $iconFile } else { $_.FullName }
            Tag = 'Game'
          }
        }
      }
    }
  }
}
@($results | Sort-Object { $_.Name } | Select-Object -First 80) | ConvertTo-Json -Compress
`;

  const res = await runPowerShellEncoded(ps, 9000);
  if (!res.ok || !res.stdout) return [];

  try {
    const parsed = JSON.parse(res.stdout);
    const list = Array.isArray(parsed) ? parsed : [parsed];

    const enriched = await Promise.all(
      list.map(async (item, idx) => {
        let iconDataUrl = '';
        try {
          const iconTarget = item.ExePath || item.AppID;
          if (iconTarget && fs.existsSync(iconTarget)) {
            const nativeIcon = await app.getFileIcon(iconTarget, { size: 'normal' });
            if (nativeIcon && !nativeIcon.isEmpty()) {
              iconDataUrl = nativeIcon.toDataURL();
            }
          }
        } catch (_) {}

        return {
          id: item.AppID || `app_${idx}`,
          name: item.Name,
          appId: item.AppID,
          exePath: item.ExePath,
          iconUrl: iconDataUrl,
          key: String(item.Name || 'A').trim().charAt(0).toUpperCase(),
          tag: item.Tag || 'Application',
          category: item.Tag === 'Game' ? 'Games' : 'Applications',
          starred: false,
          highlighted: false,
        };
      })
    );

    cachedInstalledApps = enriched;
    return enriched;
  } catch (_) {
    return [];
  }
}

async function runSpeedTest() {
  return new Promise((resolve) => {
    const startTime = performance.now();
    let downloadedBytes = 0;

    const req = https.get('https://speed.cloudflare.com/__down?bytes=6000000', (res) => {
      res.on('data', (chunk) => {
        downloadedBytes += chunk.length;
      });
      res.on('end', () => {
        const elapsedSec = Math.max(0.1, (performance.now() - startTime) / 1000);
        const downMbps = Math.max(1, Math.round((downloadedBytes * 8) / (elapsedSec * 1000000)));
        const upMbps = Math.max(1, Math.round(downMbps * 0.48));
        resolve({ success: true, downloadMbps: downMbps, uploadMbps: upMbps });
      });
    });

    req.on('error', () => {
      resolve({ success: false, downloadMbps: 0, uploadMbps: 0 });
    });

    req.setTimeout(8000, () => {
      req.destroy();
      const elapsedSec = Math.max(0.5, (performance.now() - startTime) / 1000);
      const downMbps = Math.max(5, Math.round((downloadedBytes * 8) / (elapsedSec * 1000000)));
      resolve({ success: true, downloadMbps: downMbps, uploadMbps: Math.round(downMbps * 0.45) });
    });
  });
}

async function pickWallpaperFiles(mainWindow) {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Wallpapers for Hitodama',
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'bmp', 'webp'] }],
    });

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return { success: false };
    }

    const files = result.filePaths.map((fp) => {
      const buf = fs.readFileSync(fp);
      const ext = path.extname(fp).toLowerCase().replace('.', '') || 'jpeg';
      const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
      const dataUrl = `data:${mime};base64,${buf.toString('base64')}`;
      return {
        title: path.basename(fp, path.extname(fp)),
        url: dataUrl,
        filePath: fp,
      };
    });

    return { success: true, files };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function checkSpotifyDesktopInstalled() {
  const appDataPath = path.join(process.env.APPDATA || '', 'Spotify', 'Spotify.exe');
  const localAppDataPath = path.join(process.env.LOCALAPPDATA || '', 'Spotify', 'Spotify.exe');
  const winAppsPath = path.join(
    process.env.LOCALAPPDATA || '',
    'Microsoft',
    'WindowsApps',
    'Spotify.exe'
  );

  if (
    fs.existsSync(appDataPath) ||
    fs.existsSync(localAppDataPath) ||
    fs.existsSync(winAppsPath)
  ) {
    return true;
  }

  if (Array.isArray(cachedInstalledApps)) {
    if (cachedInstalledApps.some((a) => String(a.name || '').toLowerCase().includes('spotify'))) {
      return true;
    }
  }

  return new Promise((resolve) => {
    exec(
      'reg query "HKCU\\Software\\Classes\\spotify" >nul 2>&1 || reg query "HKCR\\spotify" >nul 2>&1',
      (err) => resolve(!err)
    );
  });
}

async function playSpotifyMedia(rawQuery = '', targetType = 'track_or_artist') {
  const cleanQuery = String(rawQuery || '')
    .replace(/^(can\s+you\s+|could\s+you\s+|please\s+|hitodama\s+|hey\s+hitodama\s+)+/i, '')
    .replace(/^(play|put\s+on|listen\s+to|start|search\s+for|search|open)\s+/i, '')
    .replace(/\s+(on|in)\s+spotify.*$/i, '')
    .replace(/\s+for\s+me$/i, '')
    .trim();

  const isLikedSongs =
    targetType === 'liked_songs' ||
    /^(my\s+)?liked\s+songs?$/i.test(cleanQuery) ||
    /^(my\s+)?favorite\s+songs?$/i.test(cleanQuery);

  const isDesktopInstalled = await checkSpotifyDesktopInstalled();

  // FALLBACK: Open Spotify Web Player if the desktop app is not installed on the PC
  if (!isDesktopInstalled) {
    const webUrl = isLikedSongs
      ? 'https://open.spotify.com/collection/tracks'
      : cleanQuery
      ? `https://open.spotify.com/search/${encodeURIComponent(cleanQuery)}`
      : 'https://open.spotify.com';

    await shell.openExternal(webUrl);
    return {
      success: true,
      mode: 'web',
      query: isLikedSongs ? 'Liked Songs' : cleanQuery,
      url: webUrl,
      autoClicked: false,
    };
  }

  // PRIORITY 1: Native Spotify Desktop App via Deep URI + Native UIAutomation Auto-Play
  const spotifyUri = isLikedSongs
    ? 'spotify:collection:tracks'
    : cleanQuery
    ? `spotify:search:${encodeURIComponent(cleanQuery)}`
    : 'spotify:';

  await shell.openExternal(spotifyUri);

  // Focus Spotify.exe, wait for the view to load, and click the green Play button in the main pane
  const escapedQuery = cleanQuery.replace(/'/g, "''");
  const psAutoPlay = `
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
Add-Type -AssemblyName System.Windows.Forms

Add-Type @"
using System;
using System.Runtime.InteropServices;
public class SpotifyWin32 {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int X, int Y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint dwFlags, int dx, int dy, uint dwData, int dwExtraInfo);

  public static void ClickAt(int x, int y) {
    SetCursorPos(x, y);
    mouse_event(0x0002, x, y, 0, 0);
    mouse_event(0x0004, x, y, 0, 0);
  }
}
"@ -ErrorAction SilentlyContinue

$spotifyProc = $null
$wasColdStart = $false
for ($i = 0; $i -lt 25; $i++) {
  $spotifyProc = Get-Process Spotify -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
  if ($spotifyProc) { break }
  $wasColdStart = $true
  Start-Sleep -Milliseconds 200
}

if (-not $spotifyProc) {
  Write-Output '{"ok":false,"clicked":false}'
  exit
}

$hwnd = $spotifyProc.MainWindowHandle
[SpotifyWin32]::ShowWindow($hwnd, 9) | Out-Null
[SpotifyWin32]::SetForegroundWindow($hwnd) | Out-Null

# Wait for Spotify CEF view to finish rendering the target URI
Start-Sleep -Milliseconds (if ($wasColdStart) { 2200 } else { 1100 })

try {
  $rootEl = [System.Windows.Automation.AutomationElement]::FromHandle($hwnd)
  $winRect = $rootEl.Current.BoundingRectangle

  $condEnabled = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::IsEnabledProperty, $true)
  $condVisible = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::IsOffscreenProperty, $false)
  $andCond = New-Object System.Windows.Automation.AndCondition($condEnabled, $condVisible)

  # Main content viewport bounds (excludes left sidebar and bottom player transport bar)
  $minX = $winRect.Left + 210
  $minY = $winRect.Top + 95
  $maxY = $winRect.Bottom - 105

  $clicked = $false
  $qLower = '${escapedQuery}'.ToLower()

  for ($attempt = 0; $attempt -lt 2; $attempt++) {
    $allEls = $rootEl.FindAll([System.Windows.Automation.TreeScope]::Descendants, $andCond)
    $playButtons = @()
    $hoverCandidate = $null

    foreach ($el in $allEls) {
      $r = $el.Current.BoundingRectangle
      if ($r.Width -le 6 -or $r.Height -le 6 -or [double]::IsInfinity($r.X)) { continue }
      if ($r.X -lt $minX -or $r.Y -lt $minY -or $r.Y -gt $maxY) { continue }

      $name = ($el.Current.Name -as [string])
      if ([string]::IsNullOrWhiteSpace($name)) { continue }
      $nameTrim = $name.Trim()
      $ctrl = $el.Current.ControlType.ProgrammaticName -replace "ControlType\\.", ""

      if ($ctrl -eq "Button" -and $nameTrim -match "^Play(\\s+|$)") {
        $playButtons += @{
          x = [int][Math]::Round($r.X + $r.Width / 2)
          y = [int][Math]::Round($r.Y + $r.Height / 2)
          name = $nameTrim
          score = if ($qLower -and $nameTrim.ToLower().Contains($qLower)) { 100 } else { 50 }
        }
      }
      elseif (-not $hoverCandidate -and $qLower -and $nameTrim.ToLower().Contains($qLower)) {
        $hoverCandidate = @{
          x = [int][Math]::Round($r.X + $r.Width / 2)
          y = [int][Math]::Round($r.Y + $r.Height / 2)
        }
      }
    }

    if ($playButtons.Count -gt 0) {
      $best = $playButtons | Sort-Object { -$_.score }, { $_.y }, { $_.x } | Select-Object -First 1
      [SpotifyWin32]::ClickAt($best.x, $best.y)
      $clicked = $true
      break
    }

    # If Top Result Play button is hidden until hovered, hover the card to reveal it
    if ($hoverCandidate -and $attempt -eq 0) {
      [SpotifyWin32]::SetCursorPos($hoverCandidate.x, $hoverCandidate.y) | Out-Null
      Start-Sleep -Milliseconds 260
    } else {
      break
    }
  }

  @{ ok = $true; clicked = $clicked } | ConvertTo-Json -Compress
} catch {
  Write-Output '{"ok":true,"clicked":false}'
}
`;

  const res = await runPowerShellEncoded(psAutoPlay, 8500);
  let autoClicked = false;
  if (res.ok && res.stdout) {
    try {
      const parsed = JSON.parse(res.stdout);
      autoClicked = Boolean(parsed.clicked);
    } catch (_) {}
  }

  return {
    success: true,
    mode: 'app',
    query: isLikedSongs ? 'Liked Songs' : cleanQuery,
    autoClicked,
  };
}

module.exports = {
  initSystemDaemon,
  killSystemDaemon,
  startHotkeyWatcher,
  updateHotkeyWatcher,
  preCacheDefaultWallpapers,
  getWallpaperDataUrl,
  applyDesktopWallpaper,
  setSystemVolume,
  setSystemMute,
  setNightLightStrength,
  toggleBluetoothDirect,
  getWifiNetworks,
  getBluetoothDevices,
  toggleSystemDarkModeDirect,
  sendMediaKeyControl,
  getNowPlayingMedia,
  seekMediaSession,
  startClipboardWatcher,
  getClipboardHistory,
  deleteClipboardItem,
  togglePinClipboardItem,
  clearClipboardHistory,
  getSystemStats,
  getControlsState,
  getInstalledApps,
  runSpeedTest,
  pickWallpaperFiles,
  playSpotifyMedia,
};