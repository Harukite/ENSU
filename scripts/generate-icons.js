/* eslint-disable @typescript-eslint/no-require-imports */
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const pngToIco = require("png-to-ico");

const sourceIcon = path.join(__dirname, "../resources/icon.png");
const iconDir = path.join(__dirname, "../icon");

// 确保 icon 目录存在
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir);
}

// 生成 Windows 图标 (ICO)
async function generateWindowsIcon() {
  const sizes = [32, 64, 128, 256];
  const pngBuffers = await Promise.all(
    sizes.map((size) => sharp(sourceIcon).resize(size).png().toBuffer())
  );

  const icoBuffer = await pngToIco(pngBuffers);
  fs.writeFileSync(path.join(iconDir, "icon.ico"), icoBuffer);
  console.log("Windows icon generated");
}

// 生成 macOS 图标 (ICNS)
async function generateMacOSIcon() {
  const sizes = [32, 64, 128, 256];
  const icnsDir = path.join(iconDir, "icon.iconset");
  if (!fs.existsSync(icnsDir)) {
    fs.mkdirSync(icnsDir);
  }

  for (const size of sizes) {
    await sharp(sourceIcon)
      .resize(size)
      .toFile(path.join(icnsDir, `icon_${size}x${size}.png`));
    if (size <= 512) {
      await sharp(sourceIcon)
        .resize(size * 2)
        .toFile(path.join(icnsDir, `icon_${size}x${size}@2x.png`));
    }
  }

  console.log("macOS iconset generated");
  console.log("macOS to create .icns file, run: iconutil -c icns icon.iconset");
}

// 生成 Linux 图标 (PNG)
async function generateLinuxIcon() {
  const sizes = [32, 64, 128, 256];
  for (const size of sizes) {
    await sharp(sourceIcon)
      .resize(size)
      .toFile(path.join(iconDir, `icon_${size}x${size}.png`));
  }
  console.log("Linux icons generated");
}

async function generateIcons() {
  try {
    await generateWindowsIcon();
    await generateMacOSIcon();
    await generateLinuxIcon();
    console.log("All icons generated successfully");
  } catch (error) {
    console.error("Error generating icons:", error);
  }
}

generateIcons();
