const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hitodamaAPI', {
  // Window State Control: 'collapsed' (280x38), 'listening' (380x48), 'expanded' (740xH)
  setWindowMode: (mode, height) => ipcRenderer.send('set-window-mode', { mode, height }),
  setWindowBounds: (width, height) => ipcRenderer.send('set-window-bounds', { width, height }),
  setExpanded: (expanded, height) => ipcRenderer.send('set-expanded', { expanded, height }),
  minimize: () => ipcRenderer.send('window-minimize'),
  close: () => ipcRenderer.send('window-close'),

  // Automation & System Control
  openApp: (appName) => ipcRenderer.invoke('open-app', appName),
  openUrl: (url) => ipcRenderer.invoke('open-url', url),
  typeText: (text) => ipcRenderer.invoke('type-text', text),
  captureScreen: () => ipcRenderer.invoke('capture-screen'),
  toggleSystemDarkMode: () => ipcRenderer.invoke('toggle-system-dark-mode'),
  powerAction: (action) => ipcRenderer.invoke('power-action', action),
  getSystemStats: () => ipcRenderer.invoke('get-system-stats'),
  setWallpaper: (imagePath) => ipcRenderer.invoke('set-wallpaper', imagePath),

  // Hotkey / Event Listeners
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
});
