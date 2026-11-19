const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 700,
    title: "POP O' BOB — Commercial POS Terminal",
    autoHideMenuBar: true,
    backgroundColor: '#0f172a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
      sandbox: false,
    },
  });

  const isDev = process.env.ELECTRON_DEV === 'true';

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Hardware & Printing IPC Handlers
ipcMain.handle('get-printers', async () => {
  if (!mainWindow) return [];
  try {
    return await mainWindow.webContents.getPrintersAsync();
  } catch (err) {
    console.error('Failed to get printers:', err);
    return [];
  }
});

ipcMain.handle('silent-print', async (_event, options = {}) => {
  if (!mainWindow) return { success: false, failureReason: 'No window' };
  const { printerName = '', silent = true, copies = 1 } = options;

  return new Promise((resolve) => {
    mainWindow.webContents.print(
      {
        silent: silent !== false,
        printBackground: true,
        deviceName: printerName || undefined,
        copies: copies || 1,
        margins: { marginType: 'none' },
      },
      (success, failureReason) => {
        resolve({ success, failureReason });
      }
    );
  });
});

ipcMain.handle('silent-print-html', async (_event, options = {}) => {
  const { html = '', printerName = '', silent = true, copies = 1 } = options;
  if (!html) return { success: false, failureReason: 'Empty HTML content' };

  return new Promise((resolve) => {
    let hasResolved = false;
    const printWin = new BrowserWindow({
      show: false,
      width: 420,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    const cleanup = () => {
      if (printWin && !printWin.isDestroyed()) {
        try {
          printWin.destroy();
        } catch {}
      }
    };

    const timeout = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        cleanup();
        resolve({ success: false, failureReason: 'Print job timed out' });
      }
    }, 12000);

    printWin.webContents.on('did-finish-load', () => {
      setTimeout(() => {
        if (hasResolved || printWin.isDestroyed()) return;
        try {
          printWin.webContents.print(
            {
              silent: silent !== false,
              printBackground: true,
              deviceName: printerName || undefined, // undefined prints automatically to the Windows system default printer
              copies: copies || 1,
              margins: { marginType: 'none' },
            },
            (success, failureReason) => {
              if (!hasResolved) {
                hasResolved = true;
                clearTimeout(timeout);
                setTimeout(cleanup, 300);
                resolve({ success, failureReason });
              }
            }
          );
        } catch (err) {
          if (!hasResolved) {
            hasResolved = true;
            clearTimeout(timeout);
            cleanup();
            resolve({ success: false, failureReason: String(err) });
          }
        }
      }, 50);
    });

    printWin.webContents.on('did-fail-load', () => {
      if (!hasResolved) {
        hasResolved = true;
        clearTimeout(timeout);
        cleanup();
        resolve({ success: false, failureReason: 'Failed to load receipt HTML for printing' });
      }
    });

    printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  });
});

ipcMain.handle('toggle-fullscreen', () => {
  if (!mainWindow) return false;
  const isFullScreen = mainWindow.isFullScreen();
  mainWindow.setFullScreen(!isFullScreen);
  return !isFullScreen;
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
