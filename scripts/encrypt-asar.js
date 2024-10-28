/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-require-imports */
const asar = require("@electron/asar");
const fs = require("fs");
const path = require("path");
const v8 = require("v8");
const crypto = require("crypto");
require("dotenv").config();

const asarPath = path.join(
  __dirname,
  "../dist/win-unpacked/resources/app.asar"
);
const outputPath = path.join(
  __dirname,
  "../dist/win-unpacked/resources/app.asar.v8"
);

function customSerialize(data) {
  const serialized = v8.serialize(data);
  // 添加自定义的标记和混淆
  const customHeader = Buffer.from("CUSTOM_V8_BYTECODE");
  return Buffer.concat([customHeader, serialized]);
}

function encryptData(data, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return Buffer.concat([iv, encrypted]);
}

function encryptAsar(asarPath) {
  console.log("Starting ASAR encryption");

  const outputPath = `${asarPath}.enc`;
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error("ENCRYPTION_KEY not found in environment variables");
  }

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key), iv);

  const input = fs.createReadStream(asarPath);
  const output = fs.createWriteStream(outputPath);

  output.write(iv);

  input.pipe(cipher).pipe(output);

  return new Promise((resolve, reject) => {
    output.on("finish", () => {
      fs.unlinkSync(asarPath);
      fs.renameSync(outputPath, asarPath);
      console.log("ASAR encryption completed");
      resolve();
    });

    input.on("error", reject);
    output.on("error", reject);
  });
}

module.exports = { encryptAsar };
