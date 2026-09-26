import { ExtensionSettings, DEFAULT_SETTINGS } from '../types';

const STORAGE_KEY = 'focusguard_settings';

export async function getSettings(): Promise<ExtensionSettings> {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return new Promise((resolve) => {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        const stored = (result && result[STORAGE_KEY]) as Partial<ExtensionSettings> | undefined;
        if (stored) {
          const merged: ExtensionSettings = {
            ...DEFAULT_SETTINGS,
            ...stored,
            stats: {
              ...DEFAULT_SETTINGS.stats,
              ...(stored.stats || {})
            },
            strictMode: {
              ...DEFAULT_SETTINGS.strictMode,
              ...(stored.strictMode || {})
            },
            pomodoro: {
              ...DEFAULT_SETTINGS.pomodoro,
              ...(stored.pomodoro || {})
            }
          };
          resolve(merged);
        } else {
          // Initialize with default
          chrome.storage.local.set({ [STORAGE_KEY]: DEFAULT_SETTINGS });
          resolve(DEFAULT_SETTINGS);
        }
      });
    });
  }

  // Fallback for browser preview during development
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(local) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [STORAGE_KEY]: settings }, () => {
        resolve();
      });
    });
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function onSettingsChanged(callback: (newSettings: ExtensionSettings) => void): () => void {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'local' && changes[STORAGE_KEY]) {
        callback(changes[STORAGE_KEY].newValue as ExtensionSettings);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  }

  // Fallback storage event
  const listener = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY && event.newValue) {
      callback(JSON.parse(event.newValue));
    }
  };
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener('storage', listener);
  };
}

export async function recordBlockEvent(url: string): Promise<void> {
  const settings = await getSettings();
  const today = new Date().toISOString().split('T')[0];
  let domain = '';
  try {
    domain = new URL(url).hostname;
  } catch {
    domain = url;
  }

  const isNewDay = settings.stats.lastBlockDate !== today;
  const blocksToday = isNewDay ? 1 : settings.stats.blocksToday + 1;
  const totalBlocks = settings.stats.totalBlocks + 1;

  const newEvent = {
    id: Math.random().toString(36).substring(2, 9),
    url,
    domain,
    timestamp: Date.now()
  };

  const recentBlocks = [newEvent, ...(settings.stats.recentBlocks || [])].slice(0, 50);

  const updated: ExtensionSettings = {
    ...settings,
    stats: {
      blocksToday,
      lastBlockDate: today,
      totalBlocks,
      recentBlocks
    }
  };

  await saveSettings(updated);
}
