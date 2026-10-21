const { contextBridge, ipcRenderer, clipboard, nativeImage } = require('electron');

contextBridge.exposeInMainWorld('hitodamaAPI', {
  // Window State & Multi-Zone Hitbox Control
  setWindowMode: (mode, height) => ipcRenderer.send('set-window-mode', { mode, height }),
  setWindowBounds: (width, height) => ipcRenderer.send('set-window-bounds', { width, height }),
  setAppWindowRect: (rect) => ipcRenderer.send('set-app-window-rect', rect),
  setRoamingTargetRect: (rectOrRects) => ipcRenderer.send('set-roaming-target-rect', rectOrRects),
  setRoamingActive: (active) => ipcRenderer.send('set-roaming-active', active),
  setAgentDockActive: (active, isHovered) =>
    ipcRenderer.send(
      'set-agent-dock-active',
      typeof active === 'object' ? active : { active: !!active, isHovered: !!isHovered }
    ),
  setExpanded: (expanded, height) => ipcRenderer.send('set-expanded', { expanded, height }),
  minimize: () => ipcRenderer.send('window-minimize'),
  close: () => ipcRenderer.send('window-close'),

  // Direct Preload Clipboard Readers (Text + Screenshots/Images)
  readClipboardText: async () => {
    try {
      const raw = clipboard.readText();
      return (raw instanceof Promise || (raw && typeof raw.then === 'function'))
        ? await raw
        : String(raw || '');
    } catch (_) {
      return '';
    }
  },
  readClipboardImage: async () => {
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
                const base64 = buf.toString('base64');
                return {
                  dataUrl: `data:${imgType};base64,${base64}`,
                  width: 0,
                  height: 0,
                  mb: (buf.length / (1024 * 1024)).toFixed(2),
                };
              }
            }
          }
        }
      }
      if (typeof clipboard.readImage === 'function') {
        const img = clipboard.readImage();
        if (img && !img.isEmpty()) {
          const size = img.getSize();
          const png = img.toPNG();
          return {
            dataUrl: img.toDataURL(),
            width: size.width,
            height: size.height,
            mb: (png.length / (1024 * 1024)).toFixed(2),
          };
        }
      }
      return null;
    } catch (_) {
      return null;
    }
  },
  writeClipboardText: (text) => {
    try {
      clipboard.writeText(String(text || ''));
      return true;
    } catch (_) {
      return false;
    }
  },
  writeClipboardImage: (dataUrl) => {
    try {
      const img = nativeImage.createFromDataURL(String(dataUrl || ''));
      clipboard.writeImage(img);
      return true;
    } catch (_) {
      return false;
    }
  },

  // Real PC Automation, Telemetry, Audio, Media Seeking, Controls & Wallpaper
  openApp: (appName) => ipcRenderer.invoke('open-app', appName),
  getInstalledApps: () => ipcRenderer.invoke('get-installed-apps'),
  openUrl: (url) => ipcRenderer.invoke('open-url', url),
  typeText: (text) => ipcRenderer.invoke('type-text', text),
  captureScreen: () => ipcRenderer.invoke('capture-screen'),
  getControlsState: () => ipcRenderer.invoke('get-controls-state'),
  setVolume: (level) => ipcRenderer.invoke('set-volume', level),
  setMute: (mute) => ipcRenderer.invoke('set-mute', mute),
  toggleWifi: (enable, ssidName) => ipcRenderer.invoke('toggle-wifi', enable, ssidName),
  getWifiNetworks: () => ipcRenderer.invoke('get-wifi-networks'),
  toggleBluetooth: (enable) => ipcRenderer.invoke('toggle-bluetooth', enable),
  getBluetoothDevices: () => ipcRenderer.invoke('get-bluetooth-devices'),
  toggleNightLight: (enable, strength) => ipcRenderer.invoke('toggle-night-light', enable, strength),
  toggleSystemDarkMode: (targetDark) => ipcRenderer.invoke('toggle-system-dark-mode', targetDark),
  getNowPlaying: () => ipcRenderer.invoke('get-now-playing'),
  mediaControl: (action) => ipcRenderer.invoke('media-control', action),
  seekMedia: (seconds) => ipcRenderer.invoke('media-seek', seconds),
  getClipboardHistory: () => ipcRenderer.invoke('get-clipboard-history'),
  deleteClipboardItem: (id) => ipcRenderer.invoke('delete-clipboard-item', id),
  togglePinClipboardItem: (id) => ipcRenderer.invoke('toggle-pin-clipboard-item', id),
  clearClipboardHistory: () => ipcRenderer.invoke('clear-clipboard-history'),
  powerAction: (action) => ipcRenderer.invoke('power-action', action),
  getSystemStats: () => ipcRenderer.invoke('get-system-stats'),
  runSpeedTest: () => ipcRenderer.invoke('run-speed-test'),
  setWallpaper: (imagePath) => ipcRenderer.invoke('set-wallpaper', imagePath),
  getWallpaperDataUrl: (urlOrPath) => ipcRenderer.invoke('get-wallpaper-data-url', urlOrPath),
  pickWallpaperFiles: () => ipcRenderer.invoke('pick-wallpaper-files'),
  updateShortcuts: (shortcuts) => ipcRenderer.invoke('update-shortcuts', shortcuts),
  getShortcuts: () => ipcRenderer.invoke('get-shortcuts'),
  setLassoActive: (active) => ipcRenderer.invoke('set-lasso-active', active),
  scanUIElements: () => ipcRenderer.invoke('scan-ui-elements'),
  executeUIAction: (payload) => ipcRenderer.invoke('execute-ui-action', payload),

  // Hold-to-Speak & Release Event Listeners (`Win+Alt`, `Ctrl+Win`, `Ctrl+Shift`)
  onHotkeyEvent: (callback) => {
    const listener = (_event, action) => callback(action);
    ipcRenderer.on('hotkey-event', listener);
    return () => ipcRenderer.removeListener('hotkey-event', listener);
  },
  onTriggerLasso: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('trigger-lasso', listener);
    return () => ipcRenderer.removeListener('trigger-lasso', listener);
  },
  onTriggerDictation: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('trigger-dictation', listener);
    return () => ipcRenderer.removeListener('trigger-dictation', listener);
  },
  onTriggerAsk: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('trigger-ask', listener);
    return () => ipcRenderer.removeListener('trigger-ask', listener);
  },
  onOpenSettings: (callback) => {
    const listener = (_event, section) => callback(section);
    ipcRenderer.on('open-settings', listener);
    return () => ipcRenderer.removeListener('open-settings', listener);
  },
  onClipboardItemAdded: (callback) => {
    const listener = (_event, item) => callback(item);
    ipcRenderer.on('clipboard-item-added', listener);
    return () => ipcRenderer.removeListener('clipboard-item-added', listener);
  },
  onRoamingDismiss: (callback) => {
    const listener = () => callback();
    ipcRenderer.on('roaming-dismiss', listener);
    return () => ipcRenderer.removeListener('roaming-dismiss', listener);
  },
  onContextAppDetected: (callback) => {
    const listener = (_event, appId) => callback(appId);
    ipcRenderer.on('context-app-detected', listener);
    return () => ipcRenderer.removeListener('context-app-detected', listener);
  },
  openGeneratedPage: (htmlContent) => ipcRenderer.invoke('open-generated-page', htmlContent),
  getActivePageContext: () => ipcRenderer.invoke('get-active-page-context'),
  syncToNotion: (payload) => ipcRenderer.invoke('sync-to-notion', payload),
  playSpotify: (query, targetType) => ipcRenderer.invoke('play-spotify', query, targetType),
});