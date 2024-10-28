/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { encryptAsar } = require("./encrypt-asar");

exports.default = async function (context) {
  console.log("AfterPack hook started");

  const { appOutDir, packager, electronPlatformName } = context;

  // 确定 app.asar 的路径
  const asarPath = path.join(appOutDir, "resources", "app.asar");

  if (fs.existsSync(asarPath)) {
    console.log("Found app.asar, starting encryption");
    try {
      // await encryptAsar(asarPath);
      console.log("ASAR encryption completed successfully");
    } catch (error) {
      console.error("Error during ASAR encryption:", error);
      throw error;
    }
  } else {
    console.error("app.asar not found at expected location:", asarPath);
  }

  console.log("AfterPack hook completed");
};
