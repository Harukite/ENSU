"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [theme, setTheme] = useState("light");
  const [heavyTaskResult, setHeavyTaskResult] = useState<number>(0);
  useEffect(() => {
    console.log("Window object:", window);
    console.log("electronAPI available:", !!window.electronAPI);
    console.log("preloadExecuted:", window.preloadExecuted);
    window.electronAPI.getConfig("theme").then((savedTheme: string) => {
      if (savedTheme) setTheme(savedTheme);
    });
  }, []);
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
    console.log("theme:", theme);
    window.electronAPI.setConfig("theme", theme);
  };

  const handleShowDialog = () => {
    window.electronAPI?.showDialog();
  };

  return (
    <main
      className={`flex min-h-screen flex-col items-center p-10 ${
        theme === "dark" ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      <div className="flex justify-end">
        <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
      </div>
      <div>
        <div className="flex flex-col items-center space-y-4 mb-2">
          <h2 className="text-2xl font-bold">
            欢迎使用 Electron + Next.js + Shadcn UI 桌面应用
          </h2>
          <Image src="./icon.png" alt="png" width={200} height={200} />
        </div>
      </div>
      <div>
        <div className="text-center space-y-4">
          <ul className="list-disc list-inside text-left">
            <li>使用 Electron 作为桌面应用程序框架，提供原生应用体验</li>
            <li>
              采用 Next.js 作为前端开发框架，享受 React 生态系统的强大功能
            </li>
            <li>结合桌面应用的原生能力和 Web 技术的灵活性</li>
            <li>集成 Shadcn UI 组件库，打造精美的用户界面</li>
            <li>内置 ASAR 加密功能，保护您的应用代码</li>
            <li>使用 SQLite 数据库进行本地数据存储，支持配置信息持久化</li>
          </ul>
          <p className="text-sm ">
            开始探索这个强大的开发平台，创建令人惊叹的桌面应用程序！
          </p>
          <Button onClick={handleShowDialog}>显示对话框</Button>
        </div>
      </div>
    </main>
  );
}
