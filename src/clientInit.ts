import 'module-alias/register';

import { app, BrowserWindow } from 'electron';
import path from 'path';

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1280,
    height: 768,
    autoHideMenuBar: true,
    webPreferences: {
      devTools: true,
      nodeIntegration: true,
      preload: path.resolve('dist/clientCode.js'),
    }
  });

  win.loadFile(path.resolve('assets/index.html'));
}

app.whenReady()
  .then(() => {
    createWindow();
  });

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
});
