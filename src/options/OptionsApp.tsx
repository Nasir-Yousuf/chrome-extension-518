import { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  Globe,
  Compass,
  Lock,
  Target,
  BarChart3,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
  ExternalLink,
  Sparkles,
  Zap,
  Code,
  BookOpen,
  PenTool,
  RefreshCw,
  Clock,
  Check
} from 'lucide-react';
import { ExtensionSettings, DEFAULT_SETTINGS, FilterMode } from '../types';
import { getSettings, saveSettings, onSettingsChanged } from '../utils/storage';
import { normalizeDomain, matchesDomainPattern, formatValidUrl } from '../utils/url-matcher';

type Tab = 'allowlist' | 'redirect' | 'strictness' | 'goals' | 'analytics';

const PRESETS = [
  {
    id: 'developer',
    name: 'Developer Stack',
    icon: Code,
    desc: 'GitHub, StackOverflow, Claude, ChatGPT, Docs & Localhost',
    domains: ['github.com', 'stackoverflow.com', 'chatgpt.com', 'claude.ai', 'docs.google.com', 'localhost', 'developer.mozilla.org']
  },
  {
    id: 'student',
    name: 'Research & Study',
    icon: BookOpen,
    desc: 'Google Docs, Wikipedia, JSTOR, Scholar & Notion',
    domains: ['docs.google.com', 'notion.so', 'wikipedia.org', 'scholar.google.com', 'canvas.net']
  },
  {
    id: 'writer',
    name: 'Writer & Deep Work',
    icon: PenTool,
    desc: 'Pure writing workspaces & dictionaries',
    domains: ['notion.so', 'docs.google.com', 'thesaurus.com', 'merriam-webster.com', 'medium.com']
  }
];

const TARGET_PRESETS = [
  { name: 'Notion Workspace', url: 'https://notion.so' },
  { name: 'Google Docs', url: 'https://docs.google.com' },
  { name: 'GitHub Dashboard', url: 'https://github.com' },
  { name: 'Linear / Tasks', url: 'https://linear.app' },
  { name: 'Trello Board', url: 'https://trello.com' },
  { name: 'Obsidian Web / Sync', url: 'https://obsidian.md' }
];

export default function OptionsApp() {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<Tab>('allowlist');
  const [newDomain, setNewDomain] = useState<string>('');
  const [testUrl, setTestUrl] = useState<string>('');
  const [testResult, setTestResult] = useState<{ allowed: boolean; matchedPattern?: string } | null>(null);
  const [savedToast, setSavedToast] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });

    const unsubscribe = onSettingsChanged((newSettings) => {
      setSettings(newSettings);
    });

    return () => unsubscribe();
  }, []);

  const triggerSave = async (updated: ExtensionSettings) => {
    setSettings(updated);
    await saveSettings(updated);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleAddDomain = () => {
    if (!newDomain.trim()) return;
    const clean = normalizeDomain(newDomain);
    if (!clean) return;

    if (settings.mode === 'whitelist') {
      if (!settings.allowedDomains.includes(clean)) {
        const updated = {
          ...settings,
          allowedDomains: [clean, ...settings.allowedDomains]
        };
        triggerSave(updated);
      }
    } else {
      if (!settings.blockedDomains.includes(clean)) {
        const updated = {
          ...settings,
          blockedDomains: [clean, ...settings.blockedDomains]
        };
        triggerSave(updated);
      }
    }
    setNewDomain('');
  };

  const handleRemoveDomain = (domainToRemove: string) => {
    if (settings.mode === 'whitelist') {
      const updated = {
        ...settings,
        allowedDomains: settings.allowedDomains.filter((d) => d !== domainToRemove)
      };
      triggerSave(updated);
    } else {
      const updated = {
        ...settings,
        blockedDomains: settings.blockedDomains.filter((d) => d !== domainToRemove)
      };
      triggerSave(updated);
    }
  };

  const handleApplyPreset = (domains: string[]) => {
    const combined = Array.from(new Set([...settings.allowedDomains, ...domains]));
    const updated = {
      ...settings,
      mode: 'whitelist' as FilterMode,
      allowedDomains: combined
    };
    triggerSave(updated);
  };

  const handleTestUrl = () => {
    if (!testUrl.trim()) {
      setTestResult(null);
      return;
    }
    const formatted = formatValidUrl(testUrl);
    const domainList = settings.mode === 'whitelist' ? settings.allowedDomains : settings.blockedDomains;
    const matched = domainList.find((pattern) => matchesDomainPattern(formatted, pattern));

    if (settings.mode === 'whitelist') {
      setTestResult({
        allowed: !!matched,
        matchedPattern: matched
      });
    } else {
      setTestResult({
        allowed: !matched,
        matchedPattern: matched
      });
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading FocusGuard Dashboard...</p>
      </div>
    );
  }

  const activeDomains = settings.mode === 'whitelist' ? settings.allowedDomains : settings.blockedDomains;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      {/* Top Navigation Bar */}
      <header style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366F1 0%, #4338CA 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px var(--primary-glow)'
          }}>
            <ShieldCheck size={22} color="#FFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: 800 }}>FocusGuard</h1>
              <span className="badge badge-primary">V3 Pro</span>
            </div>
            <p style={{ fontSize: '12px', margin: 0 }}>Strict Browsing Whitelist & Smart Redirector</p>
          </div>
        </div>

        {/* Master Control & Auto-Save status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {savedToast && (
            <span className="badge badge-success animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Check size={12} /> Saved Automatically
            </span>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-surface)', padding: '6px 14px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: settings.isEnabled ? 'var(--success-light)' : 'var(--text-muted)' }}>
              {settings.isEnabled ? 'System Active' : 'System Paused'}
            </span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={settings.isEnabled}
                onChange={(e) => triggerSave({ ...settings, isEnabled: e.target.checked })}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <div style={{ flex: 1, display: 'flex', maxWidth: '1280px', margin: '0 auto', width: '100%', padding: '24px' }}>
        {/* Sidebar Nav */}
        <aside style={{ width: '260px', flexShrink: 0, paddingRight: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => setActiveTab('allowlist')}
            className="btn"
            style={{
              justifyContent: 'flex-start',
              background: activeTab === 'allowlist' ? 'var(--bg-surface-elevated)' : 'transparent',
              color: activeTab === 'allowlist' ? 'var(--primary-light)' : 'var(--text-secondary)',
              border: activeTab === 'allowlist' ? '1px solid var(--border-glow)' : '1px solid transparent'
            }}
          >
            <Globe size={18} /> Approved Websites
          </button>

          <button
            onClick={() => setActiveTab('redirect')}
            className="btn"
            style={{
              justifyContent: 'flex-start',
              background: activeTab === 'redirect' ? 'var(--bg-surface-elevated)' : 'transparent',
              color: activeTab === 'redirect' ? 'var(--primary-light)' : 'var(--text-secondary)',
              border: activeTab === 'redirect' ? '1px solid var(--border-glow)' : '1px solid transparent'
            }}
          >
            <Compass size={18} /> Redirect & Search Rules
          </button>

          <button
            onClick={() => setActiveTab('goals')}
            className="btn"
            style={{
              justifyContent: 'flex-start',
              background: activeTab === 'goals' ? 'var(--bg-surface-elevated)' : 'transparent',
              color: activeTab === 'goals' ? 'var(--primary-light)' : 'var(--text-secondary)',
              border: activeTab === 'goals' ? '1px solid var(--border-glow)' : '1px solid transparent'
            }}
          >
            <Target size={18} /> Focus Goal & Mantras
          </button>

          <button
            onClick={() => setActiveTab('strictness')}
            className="btn"
            style={{
              justifyContent: 'flex-start',
              background: activeTab === 'strictness' ? 'var(--bg-surface-elevated)' : 'transparent',
              color: activeTab === 'strictness' ? 'var(--primary-light)' : 'var(--text-secondary)',
              border: activeTab === 'strictness' ? '1px solid var(--border-glow)' : '1px solid transparent'
            }}
          >
            <Lock size={18} /> Strict Friction Lock
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className="btn"
            style={{
              justifyContent: 'flex-start',
              background: activeTab === 'analytics' ? 'var(--bg-surface-elevated)' : 'transparent',
              color: activeTab === 'analytics' ? 'var(--primary-light)' : 'var(--text-secondary)',
              border: activeTab === 'analytics' ? '1px solid var(--border-glow)' : '1px solid transparent'
            }}
          >
            <BarChart3 size={18} /> Distraction Analytics
          </button>

          <div style={{ marginTop: 'auto', padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Zap size={16} color="var(--warning)" />
              <strong style={{ fontSize: '12px' }}>Pro Tip</strong>
            </div>
            <p style={{ fontSize: '11px', margin: 0, lineHeight: 1.4 }}>
              In <strong>Strict Whitelist Mode</strong>, any domain not listed here is automatically blocked and redirected to your workspace.
            </p>
          </div>
        </aside>

        {/* Tab View Area */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {/* TAB 1: ALLOWLIST & DOMAIN RULES */}
          {activeTab === 'allowlist' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Mode Selector Card */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <h2 style={{ fontSize: '16px', marginBottom: '4px' }}>Enforcement Strategy</h2>
                    <p style={{ fontSize: '13px' }}>Choose how FocusGuard controls website accessibility.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-surface)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <button
                      onClick={() => triggerSave({ ...settings, mode: 'whitelist' })}
                      className={`btn btn-sm ${settings.mode === 'whitelist' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ border: 'none' }}
                    >
                      🛡️ Strict Whitelist (Recommended)
                    </button>
                    <button
                      onClick={() => triggerSave({ ...settings, mode: 'blacklist' })}
                      className={`btn btn-sm ${settings.mode === 'blacklist' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ border: 'none' }}
                    >
                      🚫 Blacklist Only
                    </button>
                  </div>
                </div>

                <div style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: settings.mode === 'whitelist' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  border: `1px solid ${settings.mode === 'whitelist' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  {settings.mode === 'whitelist' ? (
                    <>
                      <Sparkles size={18} color="var(--primary-light)" />
                      <span><strong>Strict Whitelist Mode Active:</strong> Only approved domains below are permitted. Everything else immediately routes to your chosen redirect destination.</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={18} color="var(--danger-light)" />
                      <span><strong>Blacklist Mode Active:</strong> All websites are open except the specific domains added to your blocklist.</span>
                    </>
                  )}
                </div>
              </div>

              {/* Quick Presets */}
              {settings.mode === 'whitelist' && (
                <div className="card">
                  <h3 style={{ fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={16} color="var(--primary-light)" /> Quick Productivity Starter Packs
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    {PRESETS.map((preset) => {
                      const Icon = preset.icon;
                      return (
                        <div
                          key={preset.id}
                          style={{
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-md)',
                            padding: '14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Icon size={16} color="var(--primary-light)" />
                            <strong style={{ fontSize: '13px' }}>{preset.name}</strong>
                          </div>
                          <p style={{ fontSize: '11px', margin: 0, flex: 1 }}>{preset.desc}</p>
                          <button
                            onClick={() => handleApplyPreset(preset.domains)}
                            className="btn btn-secondary btn-sm"
                            style={{ width: '100%', marginTop: '4px' }}
                          >
                            + Add Preset Sites
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add New Domain Card */}
              <div className="card">
                <h3 style={{ fontSize: '14px', marginBottom: '12px' }}>
                  {settings.mode === 'whitelist' ? 'Add Approved Website' : 'Add Blocked Website'}
                </h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. github.com, notion.so, *.google.com, docs.google.com/document"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
                    style={{ flex: 1 }}
                  />
                  <button onClick={handleAddDomain} className="btn btn-primary">
                    <Plus size={16} /> Add Domain
                  </button>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Tip: Supports full domains (<code>notion.so</code>), wildcards (<code>*.edu</code>), or path prefixes (<code>docs.google.com/document</code>).
                </p>
              </div>

              {/* Active Domains List */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '15px' }}>
                    {settings.mode === 'whitelist' ? 'Allowed Domains' : 'Blocked Domains'} ({activeDomains.length})
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {settings.mode === 'whitelist' ? 'Sites you are permitted to visit' : 'Sites forbidden to browse'}
                  </span>
                </div>

                {activeDomains.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No domains added yet. Click a preset above or add a domain to begin.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    {activeDomains.map((domain) => (
                      <div
                        key={domain}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          background: 'var(--bg-surface)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <Globe size={15} color="var(--primary-light)" />
                          <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {domain}
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveDomain(domain)}
                          className="btn-icon"
                          style={{ width: '28px', height: '28px' }}
                          title="Remove domain"
                        >
                          <Trash2 size={13} color="var(--danger-light)" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Instant Simulator / Rule Tester */}
              <div className="card">
                <h3 style={{ fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Search size={16} color="var(--accent-cyan)" /> Live URL Permission Tester
                </h3>
                <p style={{ fontSize: '12px', marginBottom: '12px' }}>
                  Type any URL to test whether FocusGuard will allow it or redirect it.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. https://www.reddit.com/r/programming or https://github.com/myrepo"
                    value={testUrl}
                    onChange={(e) => {
                      setTestUrl(e.target.value);
                      setTestResult(null);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleTestUrl()}
                    style={{ flex: 1 }}
                  />
                  <button onClick={handleTestUrl} className="btn btn-secondary">
                    Test URL
                  </button>
                </div>

                {testResult && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: testResult.allowed ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                      border: `1px solid ${testResult.allowed ? 'var(--success)' : 'var(--danger)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '13px'
                    }}
                  >
                    {testResult.allowed ? (
                      <>
                        <CheckCircle2 size={18} color="var(--success-light)" />
                        <span>
                          <strong>ALLOWED:</strong> This URL will load normally{' '}
                          {testResult.matchedPattern ? `(matched: ${testResult.matchedPattern})` : ''}.
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={18} color="var(--danger-light)" />
                        <span>
                          <strong>REDIRECTED:</strong> This URL will be intercepted and redirected to{' '}
                          <code>{settings.targetUrl}</code>.
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: REDIRECT & SEARCH RULES */}
          {activeTab === 'redirect' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Target Destination Configuration */}
              <div className="card">
                <h2 style={{ fontSize: '16px', marginBottom: '6px' }}>Primary Redirect Destination</h2>
                <p style={{ fontSize: '13px', marginBottom: '16px' }}>
                  When you visit a restricted site or perform an unallowed search, where should Chrome take you?
                </p>

                <div className="input-group" style={{ marginBottom: '16px' }}>
                  <label className="input-label">Redirect Target URL</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="https://notion.so or https://docs.google.com"
                      value={settings.targetUrl}
                      onChange={(e) => triggerSave({ ...settings, targetUrl: e.target.value })}
                      style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
                    />
                    <a
                      href={formatValidUrl(settings.targetUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                    >
                      <ExternalLink size={15} /> Test Open
                    </a>
                  </div>
                </div>

                <div style={{ marginTop: '12px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Quick Select Workspace:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                    {TARGET_PRESETS.map((preset) => (
                      <button
                        key={preset.url}
                        onClick={() => triggerSave({ ...settings, targetUrl: preset.url })}
                        className={`btn btn-sm ${settings.targetUrl === preset.url ? 'btn-primary' : 'btn-secondary'}`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Redirection Behavior (Direct vs Focus Portal) */}
              <div className="card">
                <h2 style={{ fontSize: '16px', marginBottom: '6px' }}>Redirection Experience</h2>
                <p style={{ fontSize: '13px', marginBottom: '16px' }}>
                  Choose what happens the instant an unallowed website is opened.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {/* Option 1: Focus Screen */}
                  <div
                    onClick={() => triggerSave({ ...settings, redirectMode: 'blocked_page' })}
                    style={{
                      cursor: 'pointer',
                      background: settings.redirectMode === 'blocked_page' ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-surface)',
                      border: `2px solid ${settings.redirectMode === 'blocked_page' ? 'var(--primary)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-lg)',
                      padding: '16px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span className="badge badge-primary">Interactive</span>
                      {settings.redirectMode === 'blocked_page' && <CheckCircle2 size={18} color="var(--primary-light)" />}
                    </div>
                    <h3 style={{ fontSize: '14px', marginBottom: '4px' }}>Deep Work Focus Screen</h3>
                    <p style={{ fontSize: '12px', margin: 0 }}>
                      Displays an aesthetic motivation portal showing your active goals, a 1-click button to jump to your workspace, and mindfulness breaks.
                    </p>
                  </div>

                  {/* Option 2: Instant Direct Redirect */}
                  <div
                    onClick={() => triggerSave({ ...settings, redirectMode: 'direct' })}
                    style={{
                      cursor: 'pointer',
                      background: settings.redirectMode === 'direct' ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-surface)',
                      border: `2px solid ${settings.redirectMode === 'direct' ? 'var(--primary)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-lg)',
                      padding: '16px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span className="badge badge-success">Zero Friction</span>
                      {settings.redirectMode === 'direct' && <CheckCircle2 size={18} color="var(--success-light)" />}
                    </div>
                    <h3 style={{ fontSize: '14px', marginBottom: '4px' }}>Instant Direct Redirect</h3>
                    <p style={{ fontSize: '12px', margin: 0 }}>
                      Immediately forwards the tab to your target workspace URL with zero intermediate screens or distractions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Omnibox / Search Engine Interception */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h2 style={{ fontSize: '16px', marginBottom: '4px' }}>Omnibox & Search Engine Override</h2>
                    <p style={{ fontSize: '13px', margin: 0 }}>
                      When enabled, searches from Google, Bing, Yahoo, or DuckDuckGo will automatically redirect to your workspace.
                    </p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.interceptSearch}
                      onChange={(e) => triggerSave({ ...settings, interceptSearch: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FOCUS GOAL & MANTRAS */}
          {activeTab === 'goals' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card">
                <h2 style={{ fontSize: '16px', marginBottom: '6px' }}>Active Daily Goal & Intention</h2>
                <p style={{ fontSize: '13px', marginBottom: '16px' }}>
                  This intention will be prominently showcased on your focus screen to keep your priorities top of mind.
                </p>

                <div className="input-group" style={{ marginBottom: '16px' }}>
                  <label className="input-label">What are you working on right now?</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Build authentication flow, finish research paper, or review pull requests"
                    value={settings.customGoal}
                    onChange={(e) => triggerSave({ ...settings, customGoal: e.target.value })}
                  />
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontSize: '14px', marginBottom: '10px' }}>Focus Session Presets</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <Clock size={16} color="var(--primary-light)" style={{ marginBottom: '6px' }} />
                    <strong style={{ fontSize: '13px', display: 'block' }}>25 Min Sprint</strong>
                    <p style={{ fontSize: '11px', margin: 0 }}>Classic Pomodoro interval for rapid focus bursts.</p>
                  </div>
                  <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <Clock size={16} color="var(--accent-cyan)" style={{ marginBottom: '6px' }} />
                    <strong style={{ fontSize: '13px', display: 'block' }}>45 Min Deep Work</strong>
                    <p style={{ fontSize: '11px', margin: 0 }}>Optimal cognitive flow state for engineering & writing.</p>
                  </div>
                  <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <Clock size={16} color="var(--success-light)" style={{ marginBottom: '6px' }} />
                    <strong style={{ fontSize: '13px', display: 'block' }}>Always Active</strong>
                    <p style={{ fontSize: '11px', margin: 0 }}>Unbroken boundary until you decide to pause.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STRICTNESS & FRICTION */}
          {activeTab === 'strictness' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <h2 style={{ fontSize: '16px', marginBottom: '4px' }}>Mindful Reflection Delay</h2>
                    <p style={{ fontSize: '13px', margin: 0 }}>
                      Adds an intentional 10-second pause before letting you disable protection or bypass a block.
                    </p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.strictMode.enableFrictionDelay}
                      onChange={(e) =>
                        triggerSave({
                          ...settings,
                          strictMode: { ...settings.strictMode, enableFrictionDelay: e.target.checked }
                        })
                      }
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div>
                    <h2 style={{ fontSize: '16px', marginBottom: '4px' }}>Passcode Lock</h2>
                    <p style={{ fontSize: '13px', margin: 0 }}>
                      Require a PIN code to alter whitelist settings or turn off focus mode.
                    </p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.strictMode.requirePasscode}
                      onChange={(e) =>
                        triggerSave({
                          ...settings,
                          strictMode: { ...settings.strictMode, requirePasscode: e.target.checked }
                        })
                      }
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                {settings.strictMode.requirePasscode && (
                  <div className="input-group" style={{ marginTop: '14px' }}>
                    <label className="input-label">Set 4-Digit Passcode / Secret PIN</label>
                    <input
                      type="password"
                      className="input-field"
                      maxLength={12}
                      placeholder="e.g. 2026"
                      value={settings.strictMode.passcode}
                      onChange={(e) =>
                        triggerSave({
                          ...settings,
                          strictMode: { ...settings.strictMode, passcode: e.target.value }
                        })
                      }
                      style={{ maxWidth: '240px' }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Stat Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div className="card" style={{ padding: '20px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Distractions Blocked Today
                  </span>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary-light)', marginTop: '4px' }}>
                    {settings.stats.blocksToday}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Saved approximately {Math.round(settings.stats.blocksToday * 3.5)} minutes of focus
                  </span>
                </div>

                <div className="card" style={{ padding: '20px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    All-Time Blocks
                  </span>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '4px' }}>
                    {settings.stats.totalBlocks}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Total temptations deflected
                  </span>
                </div>

                <div className="card" style={{ padding: '20px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    Approved Domains
                  </span>
                  <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--success-light)', marginTop: '4px' }}>
                    {settings.allowedDomains.length}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Active productive destinations
                  </span>
                </div>
              </div>

              {/* Recent Block Events Log */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '15px' }}>Recent Interceptions</h3>
                  <button
                    onClick={() =>
                      triggerSave({
                        ...settings,
                        stats: { ...settings.stats, recentBlocks: [], blocksToday: 0, totalBlocks: 0 }
                      })
                    }
                    className="btn btn-secondary btn-sm"
                  >
                    <RefreshCw size={12} /> Reset Counters
                  </button>
                </div>

                {settings.stats.recentBlocks.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No interruptions recorded yet. Clean focus streak!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {settings.stats.recentBlocks.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          background: 'var(--bg-surface)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '13px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Shield size={14} color="var(--danger-light)" />
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{item.domain}</span>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
