interface ElectronAPI {
  getConfig: (key: string) => Promise<string>;
  setConfig: (key: string, value: string) => void;
  showDialog: () => void;
  runWorkerTask: <T>(task: { taskType: string; data: T }) => Promise<T>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    preloadExecuted: boolean;
  }
}

export {};
