# Hitodama (人魂)

> **Give your computer a soul.**  
> A high-fidelity recreation of [hitodama.in](https://hitodama.in/) and a fully functional native Windows Dynamic Island desktop companion.

---

## 🌟 Overview

**Hitodama** is a combination of productivity tools and a living desktop presence. It lives at the top edge of your monitor as a hardware-embedded liquid notch that seamlessly adapts, breathes, and expands into a full 7-tab dashboard.

### Features

- 💧 **Living Canvas Soul Engine**: Procedural superellipse spine mathematics, breathing cycles, blinking, and 3D eye tracking that follows your mouse cursor.
- 🎛️ **Native Dynamic Island**:
  - **Idle Notch**: 280×38px sleek obsidian notch flush with the screen bezel, leaving your desktop 100% unobstructed.
  - **Status / Action Notch**: Notification HUD with action icons (Hold, Expand, Dismiss).
  - **Media Player Notch**: Live scrub bar, album art, and playback controls.
  - **Expanded Island (7 Tabs)**:
    1. **`Controls`**: Wi-Fi, Bluetooth, Audio switcher, Night Light, Dark Mode toggle, Volume slider, and Media card.
    2. **`Today`**: Stacked split clock, live weather, weekly calendar, focus countdown ring, and interactive to-do list.
    3. **`Stats`**: Circular telemetry gauges for CPU, GPU, and RAM, Disk C / Network stats, top RAM apps list, and interactive Internet speed test.
    4. **`Clipboard`**: Real-time clipboard history, category filters (All, Text, Images, Links), detail inspection, and one-click copy/paste.
    5. **`Apps`**: Quick search launcher with `Win+A`, quick tag pills, Starred, Recent, and Applications with native Windows launching.
    6. **`Wallpaper`**: 3D perspective skewed carousel of 5 wallpapers with instant desktop wallpaper switching.
    7. **`Power`**: Tactile quick-action tiles for Lock, Sleep, Restart, and Shut Down.
- 🔮 **Interactive Soul Loadout Mind-Map**: 4 connected radial nodes (Soul, Abilities, Personality, Voice) radiating from a central glowing portal.
- 🎙️ **Voice Dictation ("Talk badly. Send it clean.")**: Speech-to-text with self-correction cleaning and typing automation.
- 🌐 **1:1 Web Landing Recreation**: Built with React, TypeScript, Vite, and Lenis smooth scrolling.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Installation

```bash
git clone https://github.com/RaahimAlavi/hitodama.git
cd hitodama
npm install
```

### Development

#### Run Web Landing Page
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your browser.

#### Run Browser Island Preview
Open [http://localhost:5173/?mode=desktop](http://localhost:5173/?mode=desktop) to test all island tabs, media controls, and animations in the browser.

#### Run Native Windows Dynamic Island App (Electron)
```bash
npm run app
```

### Production Build

```bash
npm run build
```

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Desktop Runtime**: Electron
- **Graphics & Animation**: Procedural HTML5 Canvas, Bezier Superellipse math, CSS Transitions
- **Smooth Scroll**: Lenis
- **AI Backend**: Google Gemini API (Voice & Vision)

---

## 📄 License

MIT
