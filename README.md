# Hito (人)

> **Give your computer a soul.**  
> A living desktop presence and dynamic island companion for Windows that researches, automates, and assists across your entire computer.

---

## 🌟 Overview

**Hito** merges high-utility productivity tools with an intelligent, living desktop presence. It floats at the top edge of your monitor as a hardware-embedded liquid notch that seamlessly adapts, breathes, and expands into a full 8-tab dashboard, multitask autonomous agent dock, and voice-guided desktop companion.

---

## ⚡ Key Features

### 💧 Living Canvas Soul Engine
- **Procedural Physics Mathematics**: Smooth superellipse spine algorithms, procedural breathing cycles, and organic idle drifting.
- **Interactive Emotional Expressions**: Reacts to your interactions with expressive eye states—Normal, Poking, Annoyed, Angry, Yawning, Happy, and Peeking.
- **3D Spatial Eye Tracking**: Real-time cursor tracking with depth scaling and gentle smoothing.
- **Soul Loadout System**: Switchable skins, particle glow shaders, ability nodes, and voice personalities.

### 🎛️ Native Windows Dynamic Island
- **Hardware-Embedded Notch**: Obsidian liquid notch flush against your monitor's top bezel (280×38px idle) that expands smoothly when hovered or triggered.
- **Zero Fullscreen Blackout**: Engine-level bypass for Windows DWM DirectComposition overlays—interacting with Hito never blacks out YouTube videos, games, or fullscreen Discord streams.
- **Multi-Zone Hitboxes**: Click-through transparency (`WS_EX_TRANSPARENT`) outside the active notch boundary, so your desktop remains 100% interactive.

### 📑 8-Tab Expanded Dashboard
1. **`Controls`**: Direct toggles for Wi-Fi, Bluetooth, Audio Output switcher, Night Light temperature slider, System Dark Mode, Volume, and Media Player with real-time scrub bar and album artwork.
2. **`Today`**: Split typography clock, live local weather, weekly calendar, focus countdown ring, interactive to-do list, and scheduled routines.
3. **`Stats`**: Circular telemetry gauges for CPU, GPU, and RAM, Disk C capacity, live Network stats, top RAM-consuming processes, and an integrated real-time Internet speed test.
4. **`Clipboard`**: Real-time clipboard history with category filters (All, Text, Images, Links), item pinning, single-click copying, and zero-IPC-lag preload memory readers.
5. **`Apps`**: Universal 6-tier app and web launcher (`Win+A`), category pills, Starred apps, Recent list, and native Windows launching for Win32, UWP Store apps, Steam games, and web services.
6. **`Agents`**: Multitask agent command center displaying active background tasks, progress bars, website replicas, Notion database syncs, and code inspection.
7. **`Wallpaper`**: 3D perspective-skewed carousel of curated wallpapers with instant desktop switching and a custom local file picker.
8. **`Power`**: Tactile one-click tiles for Lock, Sleep, Restart, and Shut Down.

### 🤖 Multitask Autonomous Agents & Proactive App Links
- **Proactive Context App Notch**: Automatically detects when you open supported apps (Notion, GitHub, VS Code, Figma, Gmail) and surfaces contextual marquee suggestions.
- **Persistent App Linking**: Connect or unlink apps directly from the notch banner or the Settings drawer.
- **Floating Top-Right Agent Dock**: Collapses into a floating squircle soul while tasks run in the background, featuring live progress bars and quick actions (*Open Website*, *Copy Code*, *View in Agents*).
- **Visual Website Cloner**: Captures your active screen, analyzes layout, colors, and typography using Gemini Vision, and builds standalone HTML replicas.
- **Autonomous Notion Sync**: Conducts web research via Tavily and creates structured, categorized database entries directly in your Notion workspace.

### 🎙️ AI Voice & Autonomous Computer Use
- **Voice Assistant (`Win+Alt`)**: Hold-to-speak voice interaction with real-time speech recognition, self-correcting transcriptions, and speech output via the Gemini Live voice engine.
- **Circle-to-Ask / Lasso (`Ctrl+Shift`)**: Circle any portion of your screen, speak a question, and receive an instant visual explanation and answer.
- **Voice Dictation (`Ctrl+Win`)**: *"Talk messy. Send it clean."* High-speed voice typing that automatically strips filler words, corrects grammar, and types directly into whichever window is active.
- **Autonomous Screen Roamer & Pointer**: Vision-guided spatial locator that physically navigates the soul across your monitor to point out buttons, text, or errors.

---

## ⌨️ Global Hotkeys

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| `Win + Alt` (Hold) | **Ask Hito** | Hold and speak to query Hito or run commands |
| `Ctrl + Win` (Hold) | **Voice Dictation** | Speak freely; Hito cleans and types directly into your active window |
| `Ctrl + Shift` (Hold) | **Circle-to-Ask (Lasso)** | Circle any area on your monitor and speak to analyze it |
| `Win + A` | **Open Apps Drawer** | Quickly launch any application, game, or tool |
| `Win + Shift + H` | **Tuck / Untuck Notch** | Minimizes Hito into a discreet top bezel sliver |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **yarn**
- **Operating System**: Windows 10 or Windows 11 (64-bit)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/RaahimAlavi/hitodama.git
   cd hitodama
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure API Keys**:
   - Launch Hito and click the **Settings** drawer (or press `Alt + Space` / click the gear icon).
   - Navigate to **API keys**:
     - **Google Gemini API Key**: Paste your key from [Google AI Studio](https://aistudio.google.com/) (free tier supported).
     - **Tavily API Key** *(Optional)*: Add a free Tavily key from [tavily.com](https://tavily.com/) for live web search and deep research workflows.
   - Keys are stored encrypted locally on your machine via `localStorage`.

---

## 💻 Running Hito

### Run Native Windows Dynamic Island Companion (Electron)
```bash
npm run app
```
*Launches Hito as a seamless, transparent desktop companion at the top of your primary display with full hardware integration, global hotkeys, and system controls.*

### Run Web Landing Page
```bash
npm run dev
```
*Starts the Vite development server at [http://localhost:5173/](http://localhost:5173/).*

### Run In-Browser Island Preview
Open [http://localhost:5173/?mode=desktop](http://localhost:5173/?mode=desktop) in any modern browser to test the notch tabs, animations, media player, and soul physics without Electron.

### Production Build
```bash
npm run build
```
*Compiles TypeScript and bundles production assets via Vite into `dist/`.*

---

## 🛠️ Tech Stack

- **Frontend Framework**: React 18, TypeScript, Vite
- **Desktop Runtime**: Electron
- **Graphics & Shaders**: HTML5 Canvas, Bezier Superellipse Mathematics, GSAP
- **Smooth Scrolling**: Lenis
- **AI Core**: Google Gemini API (Multimodal Vision, Audio Transcription, Voice Engine)
- **Search & Research**: Tavily Search API
- **Windows Integration**: PowerShell native interop, Windows Audio/Media APIs, Win32 `shell:AppsFolder`

---

## 📄 License

MIT © 2026 Hito.
