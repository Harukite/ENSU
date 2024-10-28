/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function customDeserialize(data) {
  const customHeader = data.slice(0, 18);
  if (customHeader.toString() !== "CUSTOM_V8_BYTECODE") {
    throw new Error("Invalid custom V8 bytecode");
  }
  return v8.deserialize(data.slice(18));
}

function decryptData(data, key) {
  const iv = data.slice(0, 16);
  const encrypted = data.slice(16);
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted;
}

const decryptAsar = () => {
  console.log("Starting ASAR decryption");

  const asarPath = path.join(__dirname, "..", "..", "resources", "app.asar");
  const tempPath = `${asarPath}.tmp`;

  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error("ENCRYPTION_KEY not found in environment variables");
  }

  const input = fs.createReadStream(asarPath);
  const output = fs.createWriteStream(tempPath);

  let iv;
  input.once("data", (chunk) => {
    iv = chunk.slice(0, 16);
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(key),
      iv
    );
    input.pipe(decipher).pipe(output);
  });

  return new Promise((resolve, reject) => {
    output.on("finish", () => {
      fs.unlinkSync(asarPath);
      fs.renameSync(tempPath, asarPath);
      console.log("ASAR decryption completed");
      resolve();
    });

    input.on("error", reject);
    output.on("error", reject);
  });
};

module.exports = {
  decryptAsar,
};
