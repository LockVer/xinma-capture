import { contextBridge, ipcRenderer } from 'electron';
import fs from 'fs';

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: ipcRenderer,
  fs: fs,
  // 其他 Node.js 模块
});
