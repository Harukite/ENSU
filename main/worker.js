/* eslint-disable @typescript-eslint/no-require-imports */
const { parentPort } = require("worker_threads");

// 错误处理函数
function handleError(error) {
  console.error("Worker error:", error);
  parentPort.postMessage({ error: error.message });
}

// 退出处理函数
function handleExit(code) {
  if (code !== 0) {
    console.error(`Worker stopped with exit code ${code}`);
  }
  parentPort.close();
}

// 定义不同类型的大型运算
const heavyTasks = {
  sumLargeNumbers: (data) => {
    let result = 0;
    for (let i = 0; i < data.iterations; i++) {
      result += i;
    }
    return { iterations: result };
  },

  // 可以继续添加更多类型的大型运算
};

try {
  parentPort.on("message", (message) => {
    try {
      const { taskType, data } = message;
      if (taskType in heavyTasks) {
        const result = heavyTasks[taskType](data);
        parentPort.postMessage({ result });
      } else {
        throw new Error(`Unknown task type: ${taskType}`);
      }
    } catch (error) {
      handleError(error);
    }
  });

  // 添加错误事件监听器
  process.on("uncaughtException", handleError);
  process.on("unhandledRejection", handleError);

  // 添加退出事件监听器
  process.on("exit", handleExit);
} catch (error) {
  handleError(error);
}
