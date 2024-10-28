/* eslint-disable @typescript-eslint/no-require-imports */
const { contextBridge, ipcRenderer } = require("electron");

console.log("Preload script is running");

const exposeElectronAPI = () => {
  if (window.electronAPI) {
    console.log("electronAPI already exposed, skipping...");
    return;
  }

  try {
    contextBridge.exposeInMainWorld("electronAPI", {
      showDialog: () => {
        console.log("showDialog called in preload");
        return ipcRenderer.invoke("show-dialog");
      },
      log: (message) => ipcRenderer.send("log", message),
      getConfig: (key) => ipcRenderer.invoke("get-config", key),
      setConfig: (key, value) => ipcRenderer.invoke("set-config", key, value),
      batchSetConfig: (configs) =>
        ipcRenderer.invoke("batch-set-config", configs),
      runWorkerTask: (data) => ipcRenderer.invoke("run-heavy-task", data),
      batchGetConfig: (keys) => ipcRenderer.invoke("batch-get-config", keys),
    });
    console.log("electronAPI exposed to renderer successfully");
  } catch (error) {
    console.error("Error exposing electronAPI:", error);
  }
};

exposeElectronAPI();

// 添加一个全局变量来检查 preload 脚本是否已运行
if (typeof window !== "undefined") {
  window.preloadExecuted = true;
}
