# 🛡️ FocusGuard — Strict Focus & Smart Redirector Chrome Extension

A modern, high-performance Chrome Extension built with **React 19, TypeScript, and Vite** (Manifest V3) designed to strictly limit your web browsing to approved websites and automatically redirect unallowed sites and search queries to your designated workspace.

---

## ✨ Key Features

1. **Strict Whitelist Mode (Allowlist Only)**
   - Only websites you explicitly allow (e.g., `github.com`, `notion.so`, `chatgpt.com`, `docs.google.com`, `localhost`) can be opened.
   - Any other site is instantly blocked and intercepted.
   - Supports exact domains, wildcards (e.g., `*.google.com`), and specific paths.

2. **Smart Search & Omnibox Interception**
   - Whatever you search or navigate to on Chrome can automatically route directly to your chosen workspace (e.g. Notion, Linear, Google Docs, or Jira).

3. **Two Redirection Experiences**
   - **Interactive Deep Work Focus Screen**: Sleek dark/glassmorphic portal with your daily intention, motivational quote, 10s mindfulness pause, and 1-click jump to your workspace.
   - **Instant Direct Redirection**: Zero-friction immediate forward to your target URL.

4. **Interactive Control Popup**
   - Master Protection Switch (Active / Paused).
   - 1-Click "+ Add Current Tab to Whitelist" or "Set as Redirect Target".
   - 25m / 45m / 60m Deep Focus Pomodoro session launcher with badge countdown.

5. **Full Dashboard & Analytics (`options.html`)**
   - Quick Starter Packs (Developer, Student/Research, Minimalist Writer).
   - Live URL Permission Simulator to test patterns instantly.
   - Strict Friction Lock (Passcode PIN & 10s reflection pause).
   - Distraction counter & interception timeline.

---

## 🚀 How to Load into Google Chrome

1. Build the extension bundle (already built for you):
   ```bash
   npm run build
   ```
2. Open Google Chrome and navigate to:
   ```text
   chrome://extensions
   ```
3. In the top-right corner, turn **ON** the **Developer mode** toggle.
4. Click the **"Load unpacked"** button in the top-left.
5. Select the **`dist`** folder inside this project directory:
   ```text
   D:\Nasir (local disk)\nasir\OneDrive\Documents\Chrome Extension\dist
   ```
6. **Done!** Pin the FocusGuard shield icon in your Chrome toolbar.

---

## 🛠️ Development & Customization

- **Live Development Watcher**:
  ```bash
  npm run dev
  ```
- **Production Build**:
  ```bash
  npm run build
  ```

---

## 📂 Project Structure

```text
├── manifest.json              # Chrome Extension Manifest V3 configuration
├── popup.html                 # Extension toolbar action popup entry
├── options.html               # Full settings & analytics dashboard entry
├── blocked.html               # Deep work focus redirection screen entry
├── vite.config.ts             # Vite multi-page build configuration
├── public/icons/              # High-res extension icons (16, 32, 48, 128)
└── src/
    ├── types/                 # TypeScript interfaces & default settings
    ├── styles/theme.css       # Modern dark/glassmorphism design system
    ├── utils/
    │   ├── storage.ts         # Chrome storage helper with real-time sync
    │   └── url-matcher.ts     # Domain normalization, search & wildcard logic
    ├── background/
    │   └── service-worker.ts  # MV3 background interceptor & tab redirector
    ├── popup/                 # React Popup application
    ├── options/               # React Dashboard & Options application
    └── blocked/               # React Focus Block Screen application
```
