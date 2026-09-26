import { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Settings, 
  Plus, 
  ExternalLink, 
  Timer, 
  Globe, 
  Compass, 
  CheckCircle2, 
  Play, 
  Square,
  ArrowRight,
  Search,
  Save,
  Check
} from 'lucide-react';
import { ExtensionSettings, DEFAULT_SETTINGS } from '../types';
import { getSettings, saveSettings, onSettingsChanged } from '../utils/storage';
import { normalizeDomain, matchesDomainPattern, formatValidUrl } from '../utils/url-matcher';

export default function PopupApp() {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [currentTabUrl, setCurrentTabUrl] = useState<string>('');
  const [currentDomain, setCurrentDomain] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [editingTargetUrl, setEditingTargetUrl] = useState<string>('');
  const [targetSavedToast, setTargetSavedToast] = useState<boolean>(false);

  useEffect(() => {
    // Load initial settings
    getSettings().then((s) => {
      setSettings(s);
      setEditingTargetUrl(s.targetUrl);
      setLoading(false);
    });

    // Subscribe to settings changes
    const unsubscribe = onSettingsChanged((newSettings) => {
      setSettings(newSettings);
      setEditingTargetUrl(newSettings.targetUrl);
    });

    // Get current active tab
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url) {
          const url = tabs[0].url;
          setCurrentTabUrl(url);
          try {
            const host = new URL(url).hostname.replace(/^www\./, '');
            setCurrentDomain(host);
          } catch {
            setCurrentDomain('');
          }
        }
      });
    }

    return () => unsubscribe();
  }, []);

  // Update Pomodoro countdown ticker
  useEffect(() => {
    if (!settings.pomodoro.isActive || !settings.pomodoro.endsAt) {
      setTimeRemaining('');
      return;
    }

    const interval = setInterval(() => {
      const diff = (settings.pomodoro.endsAt || 0) - Date.now();
      if (diff <= 0) {
        setTimeRemaining('00:00');
        clearInterval(interval);
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeRemaining(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [settings.pomodoro]);

  const handleToggleEnabled = async () => {
    const updated = { ...settings, isEnabled: !settings.isEnabled };
    setSettings(updated);
    await saveSettings(updated);
  };

  const handleSaveTargetUrl = async () => {
    const cleanUrl = formatValidUrl(editingTargetUrl);
    const updated = { ...settings, targetUrl: cleanUrl };
    setSettings(updated);
    setEditingTargetUrl(cleanUrl);
    await saveSettings(updated);
    setTargetSavedToast(true);
    setTimeout(() => setTargetSavedToast(false), 2000);
  };

  const handleToggleSearchIntercept = async () => {
    const updated = { ...settings, interceptSearch: !settings.interceptSearch };
    setSettings(updated);
    await saveSettings(updated);
  };

  const isCurrentDomainAllowed = currentDomain
    ? settings.allowedDomains.some((d) => matchesDomainPattern(`https://${currentDomain}`, d))
    : false;

  const handleAddCurrentDomain = async () => {
    if (!currentDomain) return;
    const clean = normalizeDomain(currentDomain);
    if (!settings.allowedDomains.includes(clean)) {
      const updated = {
        ...settings,
        allowedDomains: [...settings.allowedDomains, clean]
      };
      setSettings(updated);
      await saveSettings(updated);
    }
  };

  const handleRemoveCurrentDomain = async () => {
    if (!currentDomain) return;
    const clean = normalizeDomain(currentDomain);
    const updated = {
      ...settings,
      allowedDomains: settings.allowedDomains.filter((d) => d !== clean && d !== currentDomain)
    };
    setSettings(updated);
    await saveSettings(updated);
  };

  const handleSetCurrentTabAsTarget = async () => {
    if (!currentTabUrl) return;
    const updated = { ...settings, targetUrl: currentTabUrl };
    setSettings(updated);
    setEditingTargetUrl(currentTabUrl);
    await saveSettings(updated);
    setTargetSavedToast(true);
    setTimeout(() => setTargetSavedToast(false), 2000);
  };

  const handleStartPomodoro = async (minutes: number) => {
    const endsAt = Date.now() + minutes * 60 * 1000;
    const updated = {
      ...settings,
      isEnabled: true,
      pomodoro: {
        isActive: true,
        durationMinutes: minutes,
        endsAt
      }
    };
    setSettings(updated);
    await saveSettings(updated);
  };

  const handleStopPomodoro = async () => {
    const updated = {
      ...settings,
      pomodoro: {
        ...settings.pomodoro,
        isActive: false,
        endsAt: null
      }
    };
    setSettings(updated);
    await saveSettings(updated);
  };

  const openOptionsPage = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('/options.html', '_blank');
    }
  };

  const openTargetSite = () => {
    const target = formatValidUrl(settings.targetUrl || 'https://notion.so');
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: target });
    } else {
      window.open(target, '_blank');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading FocusGuard...
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
          }}>
            <ShieldCheck size={18} color="#FFF" />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              FocusGuard
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Direct Smart Redirector
            </span>
          </div>
        </div>

        <button 
          onClick={openOptionsPage}
          className="btn-icon"
          title="Open Full Settings Dashboard"
        >
          <Settings size={16} />
        </button>
      </div>

      {/* Main Status & Toggle Card */}
      <div 
        className={`card ${settings.isEnabled ? 'card-glow' : ''}`}
        style={{
          padding: '12px 14px',
          background: settings.isEnabled 
            ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(17, 24, 39, 0.8) 100%)' 
            : 'var(--bg-glass-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: settings.isEnabled ? 'var(--success)' : 'var(--text-muted)',
            boxShadow: settings.isEnabled ? '0 0 10px var(--success)' : 'none'
          }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {settings.isEnabled ? 'Redirection Active' : 'Redirection Paused'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {settings.isEnabled ? 'Directly taking you to target URL' : 'Standard browsing allowed'}
            </div>
          </div>
        </div>

        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={settings.isEnabled} 
            onChange={handleToggleEnabled} 
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      {/* Primary Target Website Card (Editable in Popup) */}
      <div className="card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Compass size={13} /> Destination Website
          </span>
          <button 
            onClick={openTargetSite}
            style={{ 
              background: 'none', 
              color: 'var(--text-secondary)', 
              fontSize: '11px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              fontWeight: 600
            }}
          >
            Visit <ExternalLink size={11} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="https://notion.so or https://github.com"
            value={editingTargetUrl}
            onChange={(e) => setEditingTargetUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveTargetUrl()}
            style={{ fontSize: '12px', padding: '8px 10px', fontFamily: 'var(--font-mono)' }}
          />
          <button 
            onClick={handleSaveTargetUrl}
            className="btn btn-primary btn-sm"
            style={{ padding: '0 12px' }}
            title="Save destination URL"
          >
            {targetSavedToast ? <Check size={14} color="#FFF" /> : <Save size={14} />}
          </button>
        </div>

        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Any search or unapproved URL will immediately open this site.
        </span>
      </div>

      {/* Search & Omnibox Interception Quick Switch */}
      <div className="card" style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search size={14} color="var(--accent-cyan)" />
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Redirect All Chrome Searches
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              Take to target site when searching in address bar
            </div>
          </div>
        </div>

        <label className="toggle-switch" style={{ width: '40px', height: '22px' }}>
          <input 
            type="checkbox" 
            checked={settings.interceptSearch} 
            onChange={handleToggleSearchIntercept} 
          />
          <span className="toggle-slider"></span>
        </label>
      </div>

      {/* Current Tab Quick Action */}
      {currentDomain && !currentDomain.startsWith('chrome') && (
        <div className="card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
              <Globe size={13} color="var(--text-secondary)" />
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentDomain}
              </span>
            </div>
            {isCurrentDomainAllowed ? (
              <span className="badge badge-success" style={{ fontSize: '10px', padding: '2px 8px' }}>
                <CheckCircle2 size={9} /> Allowed
              </span>
            ) : (
              <span className="badge badge-danger" style={{ fontSize: '10px', padding: '2px 8px' }}>
                <ShieldAlert size={9} /> Redirects
              </span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {isCurrentDomainAllowed ? (
              <button 
                onClick={handleRemoveCurrentDomain}
                className="btn btn-danger btn-sm"
                style={{ fontSize: '11px', padding: '6px 4px' }}
              >
                Block / Redirect
              </button>
            ) : (
              <button 
                onClick={handleAddCurrentDomain}
                className="btn btn-primary btn-sm"
                style={{ fontSize: '11px', padding: '6px 4px' }}
              >
                <Plus size={12} /> Allow This Site
              </button>
            )}
            <button 
              onClick={handleSetCurrentTabAsTarget}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11px', padding: '6px 4px' }}
              title="Set this tab's URL as target destination"
            >
              Set as Target
            </button>
          </div>
        </div>
      )}

      {/* Focus Timer / Pomodoro */}
      <div className="card" style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Timer size={14} color="var(--accent-cyan)" />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Focus Timer
          </span>
        </div>

        {settings.pomodoro.isActive ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-primary animate-glow" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
              {timeRemaining || 'Active'}
            </span>
            <button onClick={handleStopPomodoro} className="btn btn-danger btn-sm" style={{ padding: '3px 8px' }}>
              <Square size={10} /> Stop
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => handleStartPomodoro(25)} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '10px' }}>
              <Play size={9} /> 25m
            </button>
            <button onClick={() => handleStartPomodoro(45)} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '10px' }}>
              <Play size={9} /> 45m
            </button>
          </div>
        )}
      </div>

      {/* Footer link to options */}
      <button 
        onClick={openOptionsPage}
        className="btn btn-secondary"
        style={{ width: '100%', fontSize: '12px', padding: '8px' }}
      >
        All Whitelist & Redirect Options <ArrowRight size={13} />
      </button>
    </div>
  );
}
