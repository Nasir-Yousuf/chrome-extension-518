import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ArrowRight,
  Target,
  Sparkles,
  Settings,
  Heart,
  ExternalLink,
  Lock,
  Plus
} from 'lucide-react';
import { ExtensionSettings, DEFAULT_SETTINGS } from '../types';
import { getSettings, saveSettings } from '../utils/storage';
import { normalizeDomain, formatValidUrl } from '../utils/url-matcher';

const QUOTES = [
  "“Focus is a muscle. The more you protect it, the stronger it grows.”",
  "“Do what is hard now so life will be easy later.”",
  "“You don’t have to be extreme, just consistent.”",
  "“The secret of getting ahead is getting started on the right things.”",
  "“Deep work is the superpower of the 21st century.”"
];

export default function BlockedApp() {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [blockedUrl, setBlockedUrl] = useState<string>('');
  const [blockedDomain, setBlockedDomain] = useState<string>('');
  const [quote, setQuote] = useState<string>(QUOTES[0]);
  const [breathCount, setBreathCount] = useState<number>(0);
  const [isBreathing, setIsBreathing] = useState<boolean>(false);
  const [showAddPrompt, setShowAddPrompt] = useState<boolean>(false);
  const [passcodeAttempt, setPasscodeAttempt] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState<boolean>(false);

  useEffect(() => {
    // Pick random quote
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

    // Extract blocked URL from query params
    const params = new URLSearchParams(window.location.search);
    const url = params.get('url') || '';
    setBlockedUrl(url);

    if (url) {
      try {
        const parsed = new URL(url);
        setBlockedDomain(parsed.hostname.replace(/^www\./, ''));
      } catch {
        setBlockedDomain(url);
      }
    }

    getSettings().then((s) => setSettings(s));
  }, []);

  // Keyboard shortcut: Press Enter to jump to workspace
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !showAddPrompt) {
        handleGoToWorkspace();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.targetUrl, showAddPrompt]);

  const handleGoToWorkspace = () => {
    const target = formatValidUrl(settings.targetUrl || 'https://notion.so');
    window.location.href = target;
  };

  const handleAddDomainToAllowlist = async () => {
    if (settings.strictMode.requirePasscode) {
      if (passcodeAttempt !== settings.strictMode.passcode) {
        setPasscodeError(true);
        return;
      }
    }

    if (!blockedDomain) return;
    const clean = normalizeDomain(blockedDomain);
    const updated = {
      ...settings,
      allowedDomains: Array.from(new Set([...settings.allowedDomains, clean]))
    };
    await saveSettings(updated);

    // Redirect to the originally blocked URL now that it's whitelisted
    if (blockedUrl) {
      window.location.href = blockedUrl;
    }
  };

  const openSettings = () => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('/options.html', '_blank');
    }
  };

  const handleStartBreathing = () => {
    setIsBreathing(true);
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setBreathCount(count);
      if (count >= 10) {
        clearInterval(interval);
        setIsBreathing(false);
      }
    }, 1000);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        position: 'relative',
        background: 'radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.15) 0%, #0B0F19 70%)',
        overflow: 'hidden'
      }}
    >
      {/* Background Decorative Rings */}
      <div
        style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          border: '1px solid rgba(99, 102, 241, 0.1)',
          pointerEvents: 'none',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '850px',
          height: '850px',
          borderRadius: '50%',
          border: '1px dashed rgba(255, 255, 255, 0.05)',
          pointerEvents: 'none',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      />

      {/* Main Glassmorphic Container */}
      <div
        className="card card-glow"
        style={{
          maxWidth: '560px',
          width: '100%',
          padding: '40px 36px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 10,
          background: 'rgba(17, 24, 39, 0.85)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(99, 102, 241, 0.3)'
        }}
      >
        {/* Shield Icon Badge */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(99, 102, 241, 0.2) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.2)'
          }}
        >
          <ShieldAlert size={32} color="#F87171" />
        </div>

        {/* Heading */}
        <h1 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.02em' }}>
          Deep Work Shield Active
        </h1>

        {/* Blocked URL / Search feedback */}
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          {blockedDomain ? (
            <>
              Access to <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{blockedDomain}</strong> is restricted under your active productivity whitelist.
            </>
          ) : (
            'This website is restricted under your active productivity whitelist.'
          )}
        </p>

        {/* Active Goal / Intention Card */}
        {settings.customGoal && (
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'left'
            }}
          >
            <Target size={20} color="var(--primary-light)" style={{ flexShrink: 0 }} />
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--primary-light)', letterSpacing: '0.05em' }}>
                Your Primary Intention
              </span>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                {settings.customGoal}
              </div>
            </div>
          </div>
        )}

        {/* Motivational Quote */}
        <div style={{ fontStyle: 'italic', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '28px', lineHeight: 1.5 }}>
          {quote}
        </div>

        {/* Big CTA: Jump to Primary Workspace */}
        <button
          onClick={handleGoToWorkspace}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '14px 24px',
            fontSize: '16px',
            fontWeight: 700,
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px'
          }}
        >
          Jump to Your Workspace <ArrowRight size={18} />
        </button>

        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Press <kbd style={{ background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)' }}>Enter ↵</kbd> to redirect immediately
        </span>

        {/* Secondary Options Divider */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '24px 0 16px', paddingTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Mindfulness 10s button */}
          <button
            onClick={handleStartBreathing}
            disabled={isBreathing}
            className="btn btn-secondary btn-sm"
          >
            <Heart size={13} color="var(--danger-light)" />
            {isBreathing ? `Breathe (${10 - breathCount}s)` : '10s Reset Pause'}
          </button>

          {/* Quick Whitelist Button if actually needed for work */}
          {blockedDomain && (
            <button
              onClick={() => setShowAddPrompt(!showAddPrompt)}
              className="btn btn-secondary btn-sm"
            >
              <Plus size={13} /> Need this for work?
            </button>
          )}

          {/* Settings link */}
          <button
            onClick={openSettings}
            className="btn btn-secondary btn-sm"
          >
            <Settings size={13} /> Settings
          </button>
        </div>

        {/* Whitelist Confirmation Dialog with optional Passcode */}
        {showAddPrompt && (
          <div
            className="animate-fade-in"
            style={{
              marginTop: '12px',
              padding: '14px',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-medium)',
              textAlign: 'left'
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
              Add <code>{blockedDomain}</code> to Approved Allowlist?
            </span>

            {settings.strictMode.requirePasscode && (
              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Enter PIN to verify:
                </label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Passcode"
                  value={passcodeAttempt}
                  onChange={(e) => {
                    setPasscodeAttempt(e.target.value);
                    setPasscodeError(false);
                  }}
                  style={{ fontSize: '13px', padding: '6px 10px' }}
                />
                {passcodeError && (
                  <span style={{ fontSize: '11px', color: 'var(--danger-light)', marginTop: '4px', display: 'block' }}>
                    Incorrect passcode.
                  </span>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddPrompt(false)} className="btn btn-secondary btn-sm">
                Cancel
              </button>
              <button onClick={handleAddDomainToAllowlist} className="btn btn-primary btn-sm">
                Confirm & Open Site
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div style={{ marginTop: '24px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', zIndex: 10 }}>
        <span>Powered by FocusGuard</span>
        <span>•</span>
        <a
          href={formatValidUrl(settings.targetUrl)}
          style={{ color: 'var(--primary-light)', textDecoration: 'none' }}
        >
          {settings.targetUrl}
        </a>
      </div>
    </div>
  );
}
