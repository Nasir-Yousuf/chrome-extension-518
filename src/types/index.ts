export type FilterMode = 'whitelist' | 'blacklist';
export type RedirectMode = 'direct' | 'blocked_page';

export interface PomodoroState {
  isActive: boolean;
  durationMinutes: number;
  endsAt: number | null; // timestamp
}

export interface BlockEvent {
  id: string;
  url: string;
  domain: string;
  timestamp: number;
}

export interface StrictModeSettings {
  requirePasscode: boolean;
  passcode: string;
  enableFrictionDelay: boolean;
  frictionSeconds: number;
}

export interface ExtensionSettings {
  isEnabled: boolean;
  mode: FilterMode;
  allowedDomains: string[];
  blockedDomains: string[];
  redirectMode: RedirectMode;
  targetUrl: string;
  interceptSearch: boolean;
  customGoal: string;
  pomodoro: PomodoroState;
  strictMode: StrictModeSettings;
  stats: {
    blocksToday: number;
    lastBlockDate: string;
    totalBlocks: number;
    recentBlocks: BlockEvent[];
  };
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  isEnabled: true,
  mode: 'whitelist',
  allowedDomains: [
    'github.com',
    'notion.so',
    'chatgpt.com',
    'claude.ai',
    'docs.google.com',
    'stackoverflow.com',
    'localhost'
  ],
  blockedDomains: [
    'youtube.com',
    'facebook.com',
    'instagram.com',
    'twitter.com',
    'x.com',
    'tiktok.com',
    'reddit.com',
    'netflix.com'
  ],
  redirectMode: 'direct', // Direct redirection by default (no intermediate screen)
  targetUrl: 'https://notion.so', // Target URL where unapproved visits & searches land
  interceptSearch: true, // Automatically redirect search queries to target URL
  customGoal: 'Focus on high-value development and study',
  pomodoro: {
    isActive: false,
    durationMinutes: 25,
    endsAt: null
  },
  strictMode: {
    requirePasscode: false,
    passcode: '',
    enableFrictionDelay: false,
    frictionSeconds: 10
  },
  stats: {
    blocksToday: 0,
    lastBlockDate: new Date().toISOString().split('T')[0],
    totalBlocks: 0,
    recentBlocks: []
  }
};
