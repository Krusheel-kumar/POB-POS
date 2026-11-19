const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  silentPrint: (options) => ipcRenderer.invoke('silent-print', options),
  silentPrintHtml: (options) => ipcRenderer.invoke('silent-print-html', options),
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  getVersion: () => ipcRenderer.invoke('get-app-version'),
  platform: process.platform,
});
