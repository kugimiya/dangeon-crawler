import 'module-alias/register';

import { app, BrowserWindow, WebContents } from 'electron';
import path from 'path';

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 768,
    autoHideMenuBar: true,
    roundedCorners: true,
    webPreferences: {
      devTools: true,
      nodeIntegration: true,
      preload: path.resolve('dist/clientCode.js'),
    }
  });

  require('@electron/remote/main').initialize();
  require('@electron/remote/main').enable(win.webContents);

  win.loadFile(path.resolve('assets/index.html'));
}

app.whenReady()
  .then(() => {
    createWindow();
  });

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
});
