/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("path");
const { Worker } = require("worker_threads");
const fs = require("fs");
const {
  initDatabase,
  getConfig,
  setConfig,
  batchSetConfig,
  batchGetConfig,
} = require("./database");
const { decryptAsar } = require("./helpers");
require("dotenv").config();

let mainWindow;
// 添加热重载功能
if (!app.isPackaged) {
  try {
    const electronReload = require("electron-reload");
    electronReload(__dirname, {
      electron: path.join(__dirname, "..", "node_modules", ".bin", "electron"),
      forceHardReset: false,
      hardResetMethod: "exit",
    });
    console.log("Electron reload configured successfully");
  } catch (error) {
    console.error("Error configuring electron-reload:", error);
  }
}

let appServe;
(async () => {
  const serve = await import("electron-serve");
  appServe = app.isPackaged ? serve.default({ directory: "out" }) : null;
})();

const createWindow = async () => {
  const preloadPath = path.join(__dirname, "preload.js");
  console.log("Preload script path:", preloadPath);
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 700,
    icon: path.join(__dirname, "../icon/icon.ico"), // 更新这一行
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      spellcheck: false,
      devTools: !app.isPackaged,
      sandbox: false, // 禁用沙箱以允许 preload 脚本正常工作
    },
    nodeIntegrationInSubFrames: true,
  });

  if (app.isPackaged) {
    await appServe(mainWindow);
    await mainWindow.loadURL("app://-");
  } else {
    await mainWindow.loadURL("http://localhost:3000");
    // mainWindow.webContents.openDevTools();
    mainWindow.webContents.on("did-fail-load", () => {
      mainWindow.webContents.reloadIgnoringCache();
    });

    // 添加快捷键监听器
    mainWindow.webContents.on("before-input-event", (event, input) => {
      if (input.key === "F12") {
        // 在新窗口中打开 DevTools
        mainWindow.webContents.openDevTools({ mode: "detach" });
        event.preventDefault();
      }
    });
  }
  // 设置 CSP 可以限制不必要的资源加载，减少内存使用： 这里的优化能解决大部分内存占用，尽量不关闭
  mainWindow.webContents.session.webRequest.onHeadersReceived(
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          "Content-Security-Policy": ["default-src 'self'; script-src 'self'"],
        },
      });
    }
  );
  // 添加 IPC 处理器
  ipcMain.handle("show-dialog", () => {
    return dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "系统弹窗",
      message: "这是一个来自主进程的系统弹窗！",
      buttons: ["确定"],
    });
  });
};

// 现在你可以在 main.js 中使用 log 函数
console.log("Electron app is starting...");
// 在应用启动时解密
app.on("ready", async () => {
  console.log("Electron app is ready");

  if (app.isPackaged) {
    console.log("App is packaged, attempting to decrypt ASAR");
    try {
      // await decryptAsar();
    } catch (error) {
      console.error("Failed to decrypt ASAR:", error);
      app.quit();
      return;
    }
  } else {
    console.log("App is not packaged, skipping ASAR decryption");
  }

  await initDatabase();
  console.log("Database initialized");
  createWindow();
  setInterval(checkMemoryUsage, 60000);
});

// 添加这些 IPC 处理器
ipcMain.handle("get-config", async (event, key) => {
  return await getConfig(key);
});

ipcMain.handle("set-config", async (event, key, value) => {
  await setConfig(key, value);
});

ipcMain.handle("batch-set-config", async (event, configs) => {
  try {
    await batchSetConfig(configs);
    return true;
  } catch (error) {
    console.error("Error in batch set config:", error);
    return false;
  }
});

ipcMain.handle("batch-get-config", async (event, keys) => {
  try {
    const configs = await batchGetConfig(keys);
    return configs;
  } catch (error) {
    console.error("Error in batch get config:", error);
    return null;
  }
});

// 在适当的地方使用 runWorker 函数
// 例如，可以在 IPC 处理器中使用
ipcMain.handle("run-heavy-task", async (event, { taskType, data }) => {
  try {
    const result = await runWorker(taskType, data);
    return result;
  } catch (error) {
    console.error("Worker error:", error);
    return null;
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 内存限制为100MB
const MEMORY_LIMIT = 100 * 1024; // 100MB

function checkMemoryUsage() {
  Promise.all([process.getProcessMemoryInfo()]).then(([processInfo]) => {
    console.log("Main Process Memory Info:", processInfo);
    // 比较进程内存和系统内存
    if (processInfo.private > MEMORY_LIMIT) {
      console.warn("Memory usage exceeded limit. Garbage collecting...");
      if (global.gc) {
        global.gc();
      }
    }
  });
}

// 在 worker 中运行任务
function runWorker(taskType, data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, "worker.js"));
    worker.on("message", (message) => {
      if (message.error) {
        reject(new Error(message.error));
      } else {
        resolve(message.result);
      }
    });
    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0)
        reject(new Error(`Worker stopped with exit code ${code}`));
    });
    worker.postMessage({ taskType, data });
  });
}
