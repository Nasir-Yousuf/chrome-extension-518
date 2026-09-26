import React, { useEffect, useState } from 'react';
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
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ExtensionSettings, DEFAULT_SETTINGS } from '../types';
import { getSettings, saveSettings, onSettingsChanged } from '../utils/storage';
import { normalizeDomain, matchesDomainPattern } from '../utils/url-matcher';

export default function PopupApp() {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [currentTabUrl, setCurrentTabUrl] = useState<string>('');
  const [currentDomain, setCurrentDomain] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    // Load initial settings
    getSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });

    // Subscribe to settings changes
    const unsubscribe = onSettingsChanged((newSettings) => {
      setSettings(newSettings);
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

  const handleSetAsTarget = async () => {
    if (!currentTabUrl) return;
    const updated = { ...settings, targetUrl: currentTabUrl };
    setSettings(updated);
    await saveSettings(updated);
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
    let target = settings.targetUrl || 'https://notion.so';
    if (!/^https?:\/\//i.test(target)) target = `https://${target}`;
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
              {settings.mode === 'whitelist' ? 'Strict Whitelist Mode' : 'Blacklist Mode'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={openOptionsPage}
            className="btn-icon"
            title="Open Settings Dashboard"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Main Status & Toggle Card */}
      <div 
        className={`card ${settings.isEnabled ? 'card-glow' : ''}`}
        style={{
          padding: '14px 16px',
          background: settings.isEnabled 
            ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(17, 24, 39, 0.8) 100%)' 
            : 'var(--bg-glass-card)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: settings.isEnabled ? 'var(--success)' : 'var(--text-muted)',
            boxShadow: settings.isEnabled ? '0 0 10px var(--success)' : 'none'
          }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {settings.isEnabled ? 'Protection Active' : 'Protection Paused'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {settings.isEnabled 
                ? (settings.mode === 'whitelist' ? 'Only allowed sites can open' : 'Distractions blocked') 
                : 'All sites currently accessible'}
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

      {/* Quick Redirect Target Card */}
      <div className="card" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Redirect Destination
          </span>
          <button 
            onClick={openTargetSite}
            style={{ 
              background: 'none', 
              color: 'var(--primary-light)', 
              fontSize: '11px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              fontWeight: 600
            }}
          >
            Open <ExternalLink size={11} />
          </button>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-surface)',
          padding: '8px 10px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)'
        }}>
          <Compass size={15} color="var(--primary-light)" />
          <span style={{ 
            fontSize: '12px', 
            fontFamily: 'var(--font-mono)', 
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1
          }}>
            {settings.targetUrl || 'https://notion.so'}
          </span>
        </div>
      </div>

      {/* Current Tab Quick Action */}
      {currentDomain && !currentDomain.startsWith('chrome') && (
        <div className="card" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Current Website
            </span>
            {isCurrentDomainAllowed ? (
              <span className="badge badge-success">
                <CheckCircle2 size={10} /> Allowed
              </span>
            ) : (
              <span className="badge badge-danger">
                <ShieldAlert size={10} /> Restricted
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={14} color="var(--text-secondary)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentDomain}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '2px' }}>
            {isCurrentDomainAllowed ? (
              <button 
                onClick={handleRemoveCurrentDomain}
                className="btn btn-danger btn-sm"
              >
                Remove from Allowlist
              </button>
            ) : (
              <button 
                onClick={handleAddCurrentDomain}
                className="btn btn-primary btn-sm"
              >
                <Plus size={13} /> Allow Website
              </button>
            )}
            <button 
              onClick={handleSetAsTarget}
              className="btn btn-secondary btn-sm"
              title="Set current website as redirect target for unapproved sites/searches"
            >
              Set as Redirect Target
            </button>
          </div>
        </div>
      )}

      {/* Focus Timer / Pomodoro Card */}
      <div className="card" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Timer size={14} color="var(--accent-cyan)" />
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Deep Focus Session
            </span>
          </div>
          {settings.pomodoro.isActive && (
            <span className="badge badge-primary animate-glow" style={{ fontFamily: 'var(--font-mono)' }}>
              {timeRemaining || 'Active'}
            </span>
          )}
        </div>

        {settings.pomodoro.isActive ? (
          <button 
            onClick={handleStopPomodoro}
            className="btn btn-danger btn-sm"
            style={{ width: '100%' }}
          >
            <Square size={12} /> End Focus Session
          </button>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            <button 
              onClick={() => handleStartPomodoro(25)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11px', padding: '6px 4px' }}
            >
              <Play size={10} /> 25 min
            </button>
            <button 
              onClick={() => handleStartPomodoro(45)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11px', padding: '6px 4px' }}
            >
              <Play size={10} /> 45 min
            </button>
            <button 
              onClick={() => handleStartPomodoro(60)}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '11px', padding: '6px 4px' }}
            >
              <Play size={10} /> 60 min
            </button>
          </div>
        )}
      </div>

      {/* Quick Stats & Footer */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0 4px',
        fontSize: '11px',
        color: 'var(--text-muted)'
      }}>
        <span>🛡️ Blocks today: <strong style={{ color: 'var(--text-primary)' }}>{settings.stats.blocksToday}</strong></span>
        <span>📋 Allowed: <strong style={{ color: 'var(--text-primary)' }}>{settings.allowedDomains.length}</strong> sites</span>
      </div>

      <button 
        onClick={openOptionsPage}
        className="btn btn-secondary"
        style={{ width: '100%', fontSize: '12px' }}
      >
        Open Dashboard & Manage Whitelist <ArrowRight size={13} />
      </button>
    </div>
  );
}
