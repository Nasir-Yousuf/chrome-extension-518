import { getSettings, saveSettings, recordBlockEvent } from '../utils/storage';
import { isUrlAllowed, isSearchEngineQuery, isSystemUrl, formatValidUrl } from '../utils/url-matcher';

console.log('[FocusGuard] Background service worker initialized.');

// Update badge icon & color based on current settings
async function updateBadge() {
  const settings = await getSettings();
  
  if (!settings.isEnabled) {
    chrome.action.setBadgeText({ text: 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: '#64748B' });
    return;
  }

  if (settings.pomodoro.isActive && settings.pomodoro.endsAt) {
    const remainingMs = settings.pomodoro.endsAt - Date.now();
    if (remainingMs > 0) {
      const remainingMins = Math.ceil(remainingMs / 60000);
      chrome.action.setBadgeText({ text: `${remainingMins}m` });
      chrome.action.setBadgeBackgroundColor({ color: '#6366F1' });
      return;
    }
  }

  chrome.action.setBadgeText({ text: 'ON' });
  chrome.action.setBadgeBackgroundColor({ color: '#10B981' });
}

// Check navigation target and redirect if necessary
async function handleNavigation(details: chrome.webNavigation.WebNavigationBaseCallbackDetails) {
  // Only handle main frame navigations
  if (details.frameId !== 0) return;

  const url = details.url;
  if (!url || isSystemUrl(url)) return;

  const settings = await getSettings();

  // Check if FocusGuard is disabled
  if (!settings.isEnabled) return;

  // Check Pomodoro state
  if (settings.pomodoro.isActive && settings.pomodoro.endsAt) {
    if (Date.now() > settings.pomodoro.endsAt) {
      // Pomodoro finished
      settings.pomodoro.isActive = false;
      settings.pomodoro.endsAt = null;
      await saveSettings(settings);
      updateBadge();
      return;
    }
  }

  // 1. Check if user configured search redirection
  if (settings.interceptSearch && isSearchEngineQuery(url)) {
    console.log(`[FocusGuard] Intercepting search query: ${url}`);
    await redirectTab(details.tabId, url, settings);
    return;
  }

  // 2. Check if URL is allowed based on Whitelist/Blacklist
  const allowed = isUrlAllowed(url, settings.mode, settings.allowedDomains, settings.blockedDomains);

  if (!allowed) {
    console.log(`[FocusGuard] Blocked restricted navigation to: ${url}`);
    await redirectTab(details.tabId, url, settings);
  }
}

async function redirectTab(tabId: number, originalUrl: string, settings: Awaited<ReturnType<typeof getSettings>>) {
  // Prevent redirect loops if originalUrl is already target
  const targetFormatted = formatValidUrl(settings.targetUrl);
  if (originalUrl.startsWith(targetFormatted)) {
    return;
  }

  // Record stats
  await recordBlockEvent(originalUrl);

  let destinationUrl = '';
  if (settings.redirectMode === 'direct') {
    destinationUrl = targetFormatted;
  } else {
    // Redirect to custom interactive Focus Screen
    const blockedPageUrl = chrome.runtime.getURL('blocked.html');
    destinationUrl = `${blockedPageUrl}?url=${encodeURIComponent(originalUrl)}`;
  }

  try {
    await chrome.tabs.update(tabId, { url: destinationUrl });
  } catch (err) {
    console.warn('[FocusGuard] Failed to redirect tab:', err);
  }
}

// Listen to web navigation events
chrome.webNavigation.onBeforeNavigate.addListener(handleNavigation);

// Listen to storage changes to update badge immediately
chrome.storage.onChanged.addListener(() => {
  updateBadge();
});

// Periodic alarm for Pomodoro and badge countdown
chrome.alarms.create('focusguard_heartbeat', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'focusguard_heartbeat') {
    const settings = await getSettings();
    if (settings.pomodoro.isActive && settings.pomodoro.endsAt) {
      if (Date.now() > settings.pomodoro.endsAt) {
        settings.pomodoro.isActive = false;
        settings.pomodoro.endsAt = null;
        await saveSettings(settings);
      }
    }
    updateBadge();
  }
});

// Initialize on install or startup
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[FocusGuard] Installed successfully.');
  updateBadge();
});

chrome.runtime.onStartup.addListener(() => {
  updateBadge();
});
