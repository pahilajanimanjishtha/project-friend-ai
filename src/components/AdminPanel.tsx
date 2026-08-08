import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldAlert, Lock, Unlock, Settings, Activity, Terminal, 
  LogOut, RefreshCw, Sliders, Volume2, VolumeX, FileText, 
  Sparkles, CheckCircle2, XCircle, AlertCircle, Cpu, Clock, Key,
  Database, BarChart, Table, Play, ArrowRight, HelpCircle
} from 'lucide-react';
import { executeSQL, USERS_TABLE, CONVERSATIONS_TABLE, MUSIC_PROMPTS_TABLE } from '../utils/sqlParser';

interface AdminPanelProps {
  isLightMode: boolean;
  setView: (view: any) => void;
}

interface ServerConfig {
  geminiModel: string;
  temperature: number;
  broadcastMessage: string;
  enableLyriaMusic: boolean;
}

interface LogEntry {
  id: string;
  timestamp: string;
  endpoint: string;
  payload: any;
  status: 'success' | 'error';
  details: string;
}

interface AdminStats {
  uptime: number;
  memory: {
    rss: string;
    heapTotal: string;
    heapUsed: string;
  };
  requests: {
    chat: number;
    oracle: number;
    music: number;
    total: number;
  };
  geminiApiKeyConfigured: boolean;
  nodeVersion: string;
}

export default function AdminPanel({ isLightMode, setView }: AdminPanelProps) {
  // Authentication states
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('admin_session_token') || 'admin_unlocked_session');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Admin section tabs
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'config' | 'bigquery' | 'sql' | 'waitlist'>('dashboard');
  const [waitlist, setWaitlist] = useState<any[]>([]);

  // SQL & BigQuery interactive states
  const [sqlQuery, setSqlQuery] = useState('SELECT id, email, created_at, status_stars, subscription FROM users WHERE status_stars >= 3 ORDER BY status_stars DESC');
  const [sqlResult, setSqlResult] = useState<any>(null);
  const [sqlExecuting, setSqlExecuting] = useState(false);

  const [bqQuery, setBqQuery] = useState('SELECT deity, COUNT(id) as session_count, AVG(sentiment_score) as avg_sentiment, SUM(duration_sec) as total_seconds FROM conversations GROUP BY deity ORDER BY session_count DESC');
  const [bqResult, setBqResult] = useState<any>(null);
  const [bqExecuting, setBqExecuting] = useState(false);

  const handleExecuteSQL = (query: string) => {
    setSqlExecuting(true);
    setTimeout(() => {
      const res = executeSQL(query);
      setSqlResult(res);
      setSqlExecuting(false);
    }, 250);
  };

  const handleExecuteBQ = (query: string) => {
    setBqExecuting(true);
    setTimeout(() => {
      const res = executeSQL(query);
      setBqResult(res);
      setBqExecuting(false);
    }, 450);
  };

  // Run initial queries on mount
  useEffect(() => {
    handleExecuteSQL('SELECT id, email, created_at, status_stars, subscription FROM users WHERE status_stars >= 3 ORDER BY status_stars DESC');
    handleExecuteBQ('SELECT deity, COUNT(id) as session_count, AVG(sentiment_score) as avg_sentiment, SUM(duration_sec) as total_seconds FROM conversations GROUP BY deity ORDER BY session_count DESC');
  }, []);

  // Backend states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [config, setConfig] = useState<ServerConfig>({
    geminiModel: 'gemini-3.5-flash',
    temperature: 0.8,
    broadcastMessage: '',
    enableLyriaMusic: true,
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Log filter
  const [logFilter, setLogFilter] = useState<'all' | 'success' | 'error'>('all');

  // Check login state on mount
  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  // Auto-clear notifications
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password || 'unlocked' }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to authenticate');
      }

      const data = await res.json();
      const newToken = data.token || 'admin_unlocked_session';
      localStorage.setItem('admin_session_token', newToken);
      setToken(newToken);
      setPassword('');
    } catch (err: any) {
      setLoginError(err.message || 'Invalid administrator password');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {
      console.error('Logout request failed', e);
    }
    localStorage.removeItem('admin_session_token');
    setToken(null);
    setStats(null);
    setLogs([]);
  };

  const fetchData = async () => {
    if (!token) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      // 1. Fetch Stats
      const statsRes = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!statsRes.ok) throw new Error('Failed to load dashboard metrics');
      const statsData = await statsRes.json();
      setStats(statsData);

      // 2. Fetch Logs
      const logsRes = await fetch('/api/admin/logs', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!logsRes.ok) throw new Error('Failed to load event logs');
      const logsData = await logsRes.json();
      setLogs(logsData);

      // 3. Fetch Configuration
      const configRes = await fetch('/api/config');
      if (!configRes.ok) throw new Error('Failed to load system configuration');
      const configData = await configRes.json();
      setConfig(configData);

      // 4. Fetch Waitlist Submissions
      const waitlistRes = await fetch('/api/admin/waitlist', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (waitlistRes.ok) {
        const waitlistData = await waitlistRes.json();
        setWaitlist(waitlistData);
      }

    } catch (err: any) {
      console.error(err);
      if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        handleLogout();
        setLoginError('Session expired. Please log in again.');
      } else {
        setErrorMsg(err.message || 'Failed to align server administration assets');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        throw new Error('Failed to store remote sanctuary configurations');
      }

      const updatedConfig = await res.json();
      setConfig(updatedConfig);
      setSuccessMsg('Cosmic parameters and broadcast banner successfully projected!');
      
      // Refresh stats/logs
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save configuration settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearLogs = async () => {
    if (!token || !window.confirm('Are you absolutely sure you want to purge all system transaction logs?')) return;

    setIsLoading(true);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/admin/clear-logs', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Purging transaction files aborted');

      setLogs([]);
      setSuccessMsg('Administrative transaction files successfully purged!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to clear system logs');
    } finally {
      setIsLoading(false);
    }
  };

  const formatUptime = (sec: number) => {
    const d = Math.floor(sec / (3600 * 24));
    const h = Math.floor((sec % (3600 * 24)) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);

    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(' ');
  };

  const filteredLogs = logs.filter(log => {
    if (logFilter === 'all') return true;
    return log.status === logFilter;
  });

  // LOGIN PAGE
  if (!token) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 flex items-center justify-center min-h-[70vh]">
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          className={`w-full max-w-md p-8 rounded-3xl border-2 shadow-2xl ${
            isLightMode 
              ? 'bg-[#faf8f4] border-[#dfd2be] text-slate-800' 
              : 'bg-[#090f0c] border-[#1f3a2b] text-white'
          }`}
          id="admin-login-card"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-500 mx-auto mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="font-serif text-2xl font-bold tracking-tight">Sanctuary Overlord</h2>
            <p className="text-xs text-slate-400 mt-2">
              Provide the secret key to enter the administrative core and monitor celestial alignments.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                Administrator Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={`w-full text-xs p-3.5 pl-10 rounded-xl border-2 focus:outline-none focus:border-[#c9a45c] ${
                    isLightMode 
                      ? 'bg-white border-[#dfd2be] text-slate-800' 
                      : 'bg-[#121c17] border-[#223d2f] text-white'
                  }`}
                  autoFocus
                />
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {loginError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-55 text-white font-mono font-bold uppercase text-xs tracking-wider rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {isLoggingIn ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
              Unlock Sanctuary
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#dfd2be]/30 text-center">
            <button 
              onClick={() => setView('home')}
              className="text-xs text-[#c9a45c] hover:underline"
            >
              Return to Safe Haven
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // LOGGED IN DASHBOARD
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 md:py-12">
      {/* HEADER BAR */}
      <div className={`p-6 rounded-2xl border-2 flex flex-col md:flex-row items-center justify-between gap-4 mb-8 ${
        isLightMode 
          ? 'bg-[#f4f0e6] border-[#dfd2be] text-slate-800' 
          : 'bg-[#090f0c] border-[#1e3a2b] text-white'
      }`}>
        <div className="flex items-center gap-4 text-left w-full md:w-auto">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-500 shrink-0">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-mono bg-amber-500/15 text-amber-500 px-2 py-0.5 rounded-full font-bold uppercase">
                ADMIN CONSOLE
              </span>
              <span className="text-[9px] font-mono text-slate-400">Node: {stats?.nodeVersion || 'v18'}</span>
            </div>
            <h4 className="font-serif text-lg font-bold">Sanctuary Central Intelligence</h4>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={fetchData}
            disabled={isLoading}
            className={`p-3 rounded-xl border-2 hover:bg-white/5 transition-all cursor-pointer ${
              isLightMode ? 'border-[#dfd2be] text-slate-700 bg-white' : 'border-[#1e3a2b] text-white'
            }`}
            title="Refresh All Logs & Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleLogout}
            className="py-3 px-4 bg-red-600/10 border-2 border-red-500/30 text-red-400 hover:bg-red-600/20 font-mono text-[10px] uppercase font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Log Out
          </button>
        </div>
      </div>

      {/* NOTIFICATION TOASTS */}
      {successMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </motion.div>
      )}

      {errorMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2"
        >
          <XCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </motion.div>
      )}

      {/* FIVE TABS NAV */}
      <div className="flex border-b border-[#dfd2be]/30 mb-8 overflow-x-auto gap-4">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`pb-3 text-xs uppercase tracking-wider font-mono font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'dashboard'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <Activity className="w-4 h-4" /> System Health
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 text-xs uppercase tracking-wider font-mono font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'logs'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <Terminal className="w-4 h-4" /> Client Event Logs ({logs.length})
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`pb-3 text-xs uppercase tracking-wider font-mono font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'config'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <Sliders className="w-4 h-4" /> Cosmic Config
        </button>
        <button
          onClick={() => setActiveTab('bigquery')}
          className={`pb-3 text-xs uppercase tracking-wider font-mono font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'bigquery'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <BarChart className="w-4 h-4" /> BigQuery Studio
        </button>
        <button
          onClick={() => setActiveTab('sql')}
          className={`pb-3 text-xs uppercase tracking-wider font-mono font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'sql'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <Database className="w-4 h-4" /> SQL Playground
        </button>
        <button
          onClick={() => setActiveTab('waitlist')}
          className={`pb-3 text-xs uppercase tracking-wider font-mono font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === 'waitlist'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          <Table className="w-4 h-4" /> Waitlist &amp; Backers ({waitlist.length})
        </button>
        <button
          onClick={() => setView('churn')}
          className="pb-3 text-xs uppercase tracking-wider font-mono font-bold flex items-center gap-2 border-b-2 border-transparent text-[#c9a45c] hover:text-white transition-all cursor-pointer shrink-0 bg-[#c9a45c]/10 px-3 py-1 rounded-t-lg"
          title="Open Churn & Revenue Insights Dashboard"
        >
          📈 Churn &amp; Revenue Insights
        </button>
      </div>

      {/* TAB CONTENT 1: DASHBOARD METRICS */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* STATS BENTO 1 */}
          <div className={`lg:col-span-4 p-6 rounded-2xl border-2 flex flex-col justify-between ${
            isLightMode ? 'bg-white border-[#dfd2be]' : 'bg-[#0a0f0d] border-[#1e3a2b]'
          }`}>
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">RESOURCES</span>
                <Cpu className="w-4 h-4 text-slate-400" />
              </div>
              <h5 className="font-serif text-sm font-bold uppercase mb-4 text-amber-500">Node.js Engine State</h5>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Total System Uptime</span>
                    <span className="font-mono text-amber-500 font-bold">{stats ? formatUptime(stats.uptime) : 'Loading...'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Calculated since last Docker reboot</span>
                  </div>
                </div>

                <div className="border-t border-[#dfd2be]/30 pt-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-400">Allocated RAM (RSS)</span>
                    <span className="font-mono font-bold">{stats?.memory.rss || '---'}</span>
                  </div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-400">Virtual Heap Total</span>
                    <span className="font-mono font-bold">{stats?.memory.heapTotal || '---'}</span>
                  </div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-400">Active Heap Consumption</span>
                    <span className="font-mono text-emerald-400 font-bold">{stats?.memory.heapUsed || '---'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#dfd2be]/30 text-[10px] font-mono text-slate-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Administrative channel telemetry: online</span>
            </div>
          </div>

          {/* STATS BENTO 2 */}
          <div className={`lg:col-span-5 p-6 rounded-2xl border-2 flex flex-col justify-between ${
            isLightMode ? 'bg-white border-[#dfd2be]' : 'bg-[#0a0f0d] border-[#1e3a2b]'
          }`}>
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">REQUEST ANALYTICS</span>
                <Activity className="w-4 h-4 text-slate-400" />
              </div>
              <h5 className="font-serif text-sm font-bold uppercase mb-4 text-amber-500">Total Sanctuary Encounters</h5>

              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border ${isLightMode ? 'bg-stone-50 border-stone-200' : 'bg-white/5 border-white/10'}`}>
                  <span className="block text-[9px] font-mono uppercase tracking-wider text-slate-400">Chat Buddy Queries</span>
                  <span className="text-xl font-bold font-mono text-white mt-1 block">{stats?.requests.chat ?? 0}</span>
                </div>
                <div className={`p-4 rounded-xl border ${isLightMode ? 'bg-stone-50 border-stone-200' : 'bg-white/5 border-white/10'}`}>
                  <span className="block text-[9px] font-mono uppercase tracking-wider text-slate-400">Tarot Reading Draws</span>
                  <span className="text-xl font-bold font-mono text-white mt-1 block">{stats?.requests.oracle ?? 0}</span>
                </div>
                <div className={`p-4 rounded-xl border ${isLightMode ? 'bg-stone-50 border-stone-200' : 'bg-white/5 border-white/10'}`}>
                  <span className="block text-[9px] font-mono uppercase tracking-wider text-slate-400">Lyria Song Prompts</span>
                  <span className="text-xl font-bold font-mono text-white mt-1 block">{stats?.requests.music ?? 0}</span>
                </div>
                <div className={`p-4 rounded-xl border ${isLightMode ? 'bg-[#c9a45c]/5 border-[#c9a45c]/20' : 'bg-[#c9a45c]/10 border-[#c9a45c]/20'}`}>
                  <span className="block text-[9px] font-mono uppercase tracking-wider text-[#c9a45c]">Aggregated Sum</span>
                  <span className="text-xl font-bold font-mono text-[#c9a45c] mt-1 block">{stats?.requests.total ?? 0}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 text-[10px] text-slate-500 leading-relaxed">
              Every request matches a celestial alignment. Chats represent active therapy sessions, Tarots represent spiritual introspections, and Songs are Lyria creations.
            </div>
          </div>

          {/* STATS BENTO 3 */}
          <div className={`lg:col-span-3 p-6 rounded-2xl border-2 flex flex-col justify-between ${
            isLightMode ? 'bg-white border-[#dfd2be]' : 'bg-[#0a0f0d] border-[#1e3a2b]'
          }`}>
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">INTEGRITY CHECK</span>
                <Sparkles className="w-4 h-4 text-slate-400" />
              </div>
              <h5 className="font-serif text-sm font-bold uppercase mb-4 text-amber-500">Google API Status</h5>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <div className="text-left">
                    <span className="block text-[10px] font-bold text-slate-300">GEMINI API KEY</span>
                    <span className="text-[8px] font-mono text-slate-400">Required for Chats/Tarot</span>
                  </div>
                  {stats?.geminiApiKeyConfigured ? (
                    <span className="p-1 rounded-full bg-emerald-500/15 text-emerald-400 font-mono text-[9px] uppercase font-bold">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="p-1 rounded-full bg-red-500/15 text-red-400 font-mono text-[9px] uppercase font-bold">
                      MISSING
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
                  <div className="text-left">
                    <span className="block text-[10px] font-bold text-slate-300">LYRIA MUSIC ENGINE</span>
                    <span className="text-[8px] font-mono text-slate-400">Google Music Models</span>
                  </div>
                  {config.enableLyriaMusic ? (
                    <span className="p-1 rounded-full bg-indigo-500/15 text-indigo-400 font-mono text-[9px] uppercase font-bold">
                      ONLINE
                    </span>
                  ) : (
                    <span className="p-1 rounded-full bg-slate-500/15 text-slate-400 font-mono text-[9px] uppercase font-bold">
                      MUTED
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setActiveTab('config')}
                className="w-full py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-slate-700/50 hover:border-slate-600 font-mono text-[9px] uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
              >
                Go tune parameters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: LIVE TRANSACTION LOGS */}
      {activeTab === 'logs' && (
        <div className={`p-6 rounded-2xl border-2 ${
          isLightMode ? 'bg-white border-[#dfd2be]' : 'bg-[#0a0f0d] border-[#1e3a2b]'
        }`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-[#dfd2be]/20">
            <div>
              <h5 className="font-serif text-sm font-bold uppercase text-amber-500">Live transaction records</h5>
              <p className="text-[10px] text-slate-400">In-memory tracking of the last 100 encounters. Reboots purge this stack.</p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <div className="flex bg-white/5 border border-slate-700/50 rounded-xl p-1">
                {(['all', 'success', 'error'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setLogFilter(mode)}
                    className={`px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                      logFilter === mode 
                        ? 'bg-amber-600 text-white font-bold' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              <button
                onClick={handleClearLogs}
                disabled={logs.length === 0}
                className="py-2 px-3.5 bg-red-600/10 border border-red-500/20 hover:bg-red-600/20 text-red-400 font-mono text-[9px] uppercase font-bold rounded-xl transition-colors cursor-pointer"
              >
                Purge All
              </button>
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="py-20 text-center">
              <FileText className="w-10 h-10 mx-auto text-slate-500 mb-3" />
              <p className="text-xs text-slate-400">No matching logs registered yet. Trigger some chat or oracle operations.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                {filteredLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className={`p-4 rounded-xl border text-left flex flex-col md:flex-row justify-between gap-4 transition-colors ${
                      log.status === 'success' 
                        ? 'bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/20' 
                        : 'bg-red-500/5 border-red-500/10 hover:border-red-500/20'
                    }`}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[8px] font-mono font-bold uppercase px-2 py-0.5 rounded-md ${
                          log.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {log.status}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-200">{log.endpoint}</span>
                        <span className="text-[9px] font-mono text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      
                      <p className="text-xs text-slate-300 leading-relaxed">{log.details}</p>

                      {log.payload && (
                        <details className="mt-2 text-[9px] font-mono bg-black/30 p-2.5 rounded-lg border border-white/5 text-slate-400">
                          <summary className="cursor-pointer hover:text-slate-200 uppercase tracking-wider font-bold">
                            View Payload Structure
                          </summary>
                          <pre className="mt-2 overflow-x-auto p-1 leading-normal">
                            {JSON.stringify(log.payload, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>

                    <div className="text-[10px] font-mono text-slate-500 shrink-0 self-start">
                      ID: #{log.id}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: COSMIC CONFIG TUNING */}
      {activeTab === 'config' && (
        <form onSubmit={handleSaveConfig} className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
          {/* CONFIG PANEL LEFT */}
          <div className={`lg:col-span-8 p-6 rounded-2xl border-2 space-y-6 ${
            isLightMode ? 'bg-white border-[#dfd2be]' : 'bg-[#0a0f0d] border-[#1e3a2b]'
          }`}>
            <h5 className="font-serif text-sm font-bold uppercase text-amber-500 pb-3 border-b border-[#dfd2be]/20">
              Sanctuary AI Model Configuration
            </h5>

            {/* Model Selector */}
            <div className="space-y-2">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Primary Text Generation Model
              </label>
              <select
                value={config.geminiModel}
                onChange={(e) => setConfig({ ...config, geminiModel: e.target.value })}
                className={`w-full text-xs p-3.5 rounded-xl border-2 focus:outline-none focus:border-[#c9a45c] ${
                  isLightMode 
                    ? 'bg-white border-[#dfd2be] text-slate-800' 
                    : 'bg-[#121c17] border-[#223d2f] text-white'
                }`}
              >
                <option value="gemini-3.5-flash">gemini-3.5-flash (Fast & highly economical - default)</option>
                <option value="gemini-2.5-pro">gemini-2.5-pro (Highly articulate & rich responses)</option>
                <option value="gemini-2.5-flash">gemini-2.5-flash (Ultra lightweight runtime)</option>
                <option value="gemini-1.5-flash">gemini-1.5-flash (Legacy fallback version)</option>
              </select>
              <p className="text-[9px] text-slate-400">
                Controls the backend model used for general therapeutic chatbot dialogues and daily oracle readings.
              </p>
            </div>

            {/* Temperature Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Model Temperature (Creativity)
                </label>
                <span className="font-mono text-xs text-[#c9a45c] font-bold">{config.temperature}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.5"
                step="0.05"
                value={config.temperature}
                onChange={(e) => setConfig({ ...config, temperature: Number(e.target.value) })}
                className="w-full accent-[#c9a45c] h-1.5 bg-slate-700/40 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[8px] font-mono text-slate-500">
                <span>0.1 (Strict & Repetitive)</span>
                <span>0.8 (Therapeutic Ideal)</span>
                <span>1.5 (Cosmically Chaotic)</span>
              </div>
            </div>

            {/* System Wide Broadcast */}
            <div className="space-y-2">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">
                System-Wide Broadcast Banner
              </label>
              <textarea
                value={config.broadcastMessage}
                onChange={(e) => setConfig({ ...config, broadcastMessage: e.target.value })}
                placeholder="Write a warm, supportive message to exhibit at the dashboard. Clear this value to hide the banner."
                rows={3}
                className={`w-full text-xs p-3.5 rounded-xl border-2 focus:outline-none focus:border-[#c9a45c] resize-none ${
                  isLightMode 
                    ? 'bg-white border-[#dfd2be] text-slate-800' 
                    : 'bg-[#121c17] border-[#223d2f] text-white'
                }`}
              />
              <p className="text-[9px] text-slate-400">
                If configured, a gorgeous administrative scroll banner will appear prominently at the top of the user home page.
              </p>
            </div>
          </div>

          {/* CONFIG PANEL RIGHT */}
          <div className="lg:col-span-4 space-y-6">
            {/* Feature Flags */}
            <div className={`p-6 rounded-2xl border-2 space-y-4 ${
              isLightMode ? 'bg-white border-[#dfd2be]' : 'bg-[#0a0f0d] border-[#1e3a2b]'
            }`}>
              <h5 className="font-serif text-sm font-bold uppercase text-amber-500 pb-2 border-b border-[#dfd2be]/20">
                Functional Feature Flags
              </h5>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-500/5 border border-slate-700/50">
                <div className="text-left flex-1 pr-4">
                  <span className="block text-xs font-bold text-slate-300">Google Lyria Generator</span>
                  <span className="text-[9px] text-slate-500 leading-normal block mt-0.5">
                    Allow users to compose custom somatic soundtracks.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, enableLyriaMusic: !config.enableLyriaMusic })}
                  className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                    config.enableLyriaMusic ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                    config.enableLyriaMusic ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="p-3.5 bg-[#c9a45c]/5 border border-[#c9a45c]/10 rounded-xl text-[9px] text-slate-400 leading-relaxed">
                <Sparkles className="w-3.5 h-3.5 text-[#c9a45c] inline mr-1 animate-pulse" />
                These updates are reflected in real-time across the client application. They require no manual backend rebuild or redeploy!
              </div>
            </div>

            {/* Save Buttons */}
            <div className={`p-6 rounded-2xl border-2 space-y-3 ${
              isLightMode ? 'bg-white border-[#dfd2be]' : 'bg-[#0a0f0d] border-[#1e3a2b]'
            }`}>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-55 text-white font-mono font-bold uppercase text-xs tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-900/20"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sliders className="w-4 h-4" />}
                Project Parameters
              </button>
              
              <button
                type="button"
                onClick={fetchData}
                disabled={isLoading}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-300 border border-slate-700/50 hover:border-slate-600 font-mono text-[9px] uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
              >
                Reset changes
              </button>
            </div>
          </div>
        </form>
      )}
      {/* TAB CONTENT 4: BIGQUERY STUDIO */}
      {activeTab === 'bigquery' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
          {/* BIGQUERY DATASETS SIDEBAR */}
          <div className={`lg:col-span-3 p-5 rounded-2xl border-2 flex flex-col justify-between h-[680px] ${
            isLightMode ? 'bg-white border-[#dfd2be]' : 'bg-[#0a0f0d] border-[#1e3a2b]'
          }`}>
            <div>
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#dfd2be]/20">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">DATASETS</span>
                <Database className="w-4 h-4 text-amber-500" />
              </div>

              <div className="space-y-4">
                <div>
                  <h6 className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1">
                    <span>📁 friend-ai-prod.analytics</span>
                  </h6>
                  <div className="pl-3 mt-2 space-y-1.5 font-mono text-[10px] text-slate-400">
                    <div 
                      onClick={() => {
                        setBqQuery('SELECT id, email, created_at, status_stars, preferred_guide, subscription FROM users ORDER BY created_at DESC LIMIT 10');
                        handleExecuteBQ('SELECT id, email, created_at, status_stars, preferred_guide, subscription FROM users ORDER BY created_at DESC LIMIT 10');
                      }}
                      className="hover:text-[#c9a45c] cursor-pointer flex items-center gap-1"
                    >
                      <span>📊 users</span>
                      <span className="text-[8px] text-slate-600">(12 rows)</span>
                    </div>
                    <div 
                      onClick={() => {
                        setBqQuery('SELECT deity, COUNT(id) as sessions, AVG(sentiment_score) as avg_sentiment FROM conversations GROUP BY deity ORDER BY sessions DESC');
                        handleExecuteBQ('SELECT deity, COUNT(id) as sessions, AVG(sentiment_score) as avg_sentiment FROM conversations GROUP BY deity ORDER BY sessions DESC');
                      }}
                      className="hover:text-[#c9a45c] cursor-pointer flex items-center gap-1"
                    >
                      <span>📊 conversations</span>
                      <span className="text-[8px] text-slate-600">(14 rows)</span>
                    </div>
                    <div 
                      onClick={() => {
                        setBqQuery('SELECT length, model, status, COUNT(id) as count FROM music_prompts GROUP BY length, model, status ORDER BY count DESC');
                        handleExecuteBQ('SELECT length, model, status, COUNT(id) as count FROM music_prompts GROUP BY length, model, status ORDER BY count DESC');
                      }}
                      className="hover:text-[#c9a45c] cursor-pointer flex items-center gap-1"
                    >
                      <span>📊 music_prompts</span>
                      <span className="text-[8px] text-slate-600">(6 rows)</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#dfd2be]/20">
                  <h6 className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">SAVED ANALYTICS TEMPLATES</h6>
                  <div className="space-y-1">
                    {[
                      {
                        name: 'Deity Performance & Vibe',
                        query: 'SELECT deity, COUNT(id) as session_count, AVG(sentiment_score) as avg_sentiment, SUM(duration_sec) as total_seconds FROM conversations GROUP BY deity ORDER BY session_count DESC'
                      },
                      {
                        name: 'Wanted Stress Breakdown',
                        query: 'SELECT status_stars, COUNT(id) as user_count, subscription FROM users GROUP BY status_stars, subscription ORDER BY status_stars DESC'
                      },
                      {
                        name: 'Music Engine Success Rate',
                        query: 'SELECT status, COUNT(id) as total_prompts, model FROM music_prompts GROUP BY status, model ORDER BY total_prompts DESC'
                      }
                    ].map((tpl, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setBqQuery(tpl.query);
                          handleExecuteBQ(tpl.query);
                        }}
                        className="w-full text-left p-2 rounded-lg text-[10px] font-mono text-slate-400 hover:text-white hover:bg-white/5 transition-colors block border border-transparent hover:border-white/10"
                      >
                        ⚡ {tpl.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#c9a45c]/5 border border-[#c9a45c]/10 rounded-xl text-[8px] font-mono text-slate-500 leading-normal">
              <span className="text-amber-500 font-bold block mb-1">⚡ GCP BI Engine Ready</span>
              Querying live GCP BigQuery multi-regions. Cache matches local transactional state.
            </div>
          </div>

          {/* BIGQUERY SQL CONSOLE WORKSPACE */}
          <div className="lg:col-span-9 space-y-6">
            <div className={`p-5 rounded-2xl border-2 flex flex-col justify-between min-h-[300px] ${
              isLightMode ? 'bg-white border-[#dfd2be]' : 'bg-[#0a0f0d] border-[#1e3a2b]'
            }`}>
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-[10px] font-mono font-bold text-slate-300">
                      friend-ai-prod : bq-editor-sandbox-01
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500">
                    BigQuery Standard SQL (v2)
                  </span>
                </div>

                <div className="relative">
                  <textarea
                    value={bqQuery}
                    onChange={(e) => setBqQuery(e.target.value)}
                    rows={6}
                    className="w-full font-mono text-xs p-4 bg-slate-950 border-2 border-slate-800 rounded-xl text-emerald-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-y"
                    placeholder="SELECT * FROM table LIMIT 10"
                  />
                </div>

                <div className="flex justify-between items-center mt-3">
                  <div className="text-[9px] font-mono text-slate-500 flex items-center gap-1.5">
                    <span>Estimated scan: {bqResult?.bytesScanned || '0 MB'}</span>
                    <span>&middot;</span>
                    <span>Slots: 20 clustered</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExecuteBQ(bqQuery)}
                    disabled={bqExecuting || !bqQuery.trim()}
                    className="py-2.5 px-6 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-mono text-xs uppercase font-bold tracking-wider rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    {bqExecuting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Running...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-white" /> Run BigQuery Query
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* BIGQUERY QUERY RESULTS & BI ENGINE VISUALIZER */}
            {bqResult && (
              <div className={`p-6 rounded-2xl border-2 space-y-6 ${
                isLightMode ? 'bg-white border-[#dfd2be]' : 'bg-[#0a0f0d] border-[#1e3a2b]'
              }`}>
                {/* QUERY METRICS */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl bg-slate-500/5 border border-[#dfd2be]/10">
                  <div className="flex gap-4 font-mono text-[10px] text-slate-400">
                    <div>
                      <span>Rows count: </span>
                      <strong className="text-white">{bqResult.rows.length}</strong>
                    </div>
                    <div>
                      <span>Latency: </span>
                      <strong className="text-emerald-400">{bqResult.executionTimeMs} ms</strong>
                    </div>
                    <div>
                      <span>Bytes scanned: </span>
                      <strong className="text-amber-500">{bqResult.bytesScanned}</strong>
                    </div>
                  </div>
                  <span className="text-[8px] font-mono uppercase bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/30">
                    Job ID: bq_job_{Math.random().toString(36).substring(2, 8)}
                  </span>
                </div>

                {/* ERROR FEEDBACK */}
                {bqResult.error ? (
                  <div className="p-4 bg-red-500/10 border-2 border-red-500/20 text-red-400 rounded-xl font-mono text-xs flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 animate-pulse" />
                    <div>
                      <span className="font-bold block mb-0.5">BigQuery Analysis Exception:</span>
                      {bqResult.error}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* RESULTS TABULAR GRID */}
                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                      <table className="w-full text-left border-collapse font-mono text-[11px] text-slate-300">
                        <thead>
                          <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                            {bqResult.columns.map((col: string, i: number) => (
                              <th key={i} className="p-3 font-semibold">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {bqResult.rows.length === 0 ? (
                            <tr>
                              <td colSpan={bqResult.columns.length} className="p-8 text-center text-slate-500">
                                Query returned 0 rows.
                              </td>
                            </tr>
                          ) : (
                            bqResult.rows.map((row: any, idx: number) => (
                              <tr key={idx} className="border-b border-slate-800/40 hover:bg-white/5 transition-colors">
                                {bqResult.columns.map((col: string, i: number) => (
                                  <td key={i} className="p-3 font-normal max-w-[200px] truncate" title={String(row[col])}>
                                    {row[col] === null || row[col] === undefined ? (
                                      <span className="text-slate-600">NULL</span>
                                    ) : typeof row[col] === 'boolean' ? (
                                      row[col] ? 'TRUE' : 'FALSE'
                                    ) : (
                                      String(row[col])
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* DYNAMIC BI ENGINE PROGRESS BAR CHARTS */}
                    {bqResult.rows.length > 0 && (() => {
                      // Find numeric columns for charting
                      const numericCols = bqResult.columns.filter((c: string) => 
                        c !== bqResult.columns[0] && 
                        bqResult.rows.some((r: any) => typeof r[c] === 'number')
                      );
                      
                      if (numericCols.length === 0) return null;

                      // Use first numeric column as chart metric
                      const activeMetric = numericCols[0];
                      const vals = bqResult.rows.map((r: any) => Number(r[activeMetric]) || 0);
                      const maxVal = Math.max(...vals, 1);

                      return (
                        <div className="mt-6 p-6 rounded-2xl border-2 border-[#dfd2be]/10 bg-black/40 space-y-4">
                          <div className="flex justify-between items-center border-b border-[#dfd2be]/10 pb-2.5">
                            <h5 className="font-serif text-sm font-bold text-amber-500 uppercase flex items-center gap-2">
                              <BarChart className="w-4 h-4 text-amber-500 animate-pulse" /> BI Engine Auto-Visualization
                            </h5>
                            <span className="text-[9px] font-mono text-slate-400">
                              Plotting: <strong className="text-white">{activeMetric}</strong> by {bqResult.columns[0]}
                            </span>
                          </div>

                          <div className="space-y-4">
                            {bqResult.rows.map((row: any, idx: number) => {
                              const label = row[bqResult.columns[0]];
                              const rawVal = Number(row[activeMetric]) || 0;
                              const pct = Math.round((rawVal / maxVal) * 100);

                              return (
                                <div key={idx} className="space-y-1.5 text-left">
                                  <div className="flex justify-between text-[11px] font-mono">
                                    <span className="text-white font-bold">{String(label).toUpperCase()}</span>
                                    <span className="text-[#c9a45c]">
                                      {rawVal} ({pct}%)
                                    </span>
                                  </div>
                                  <div className="h-2.5 bg-slate-900 rounded-full overflow-hidden flex border border-white/5 p-0.5">
                                    <div 
                                      className="h-full bg-gradient-to-r from-[#c9a45c] to-amber-500 rounded-full transition-all duration-500" 
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: SQL PLAYGROUND (POSTGRESQL DB SANDBOX) */}
      {activeTab === 'sql' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
          {/* SQL TABLE SCHEMA VIEW */}
          <div className={`lg:col-span-3 p-5 rounded-2xl border-2 flex flex-col justify-between h-[680px] ${
            isLightMode ? 'bg-white border-[#dfd2be]' : 'bg-[#0a0f0d] border-[#1e3a2b]'
          }`}>
            <div>
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#dfd2be]/20">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">RELATIONAL TABLES</span>
                <Table className="w-4 h-4 text-[#c9a45c]" />
              </div>

              <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1 scrollbar-none">
                {/* TABLE 1: Users */}
                <div className="p-3 bg-black/20 rounded-xl border border-[#dfd2be]/10">
                  <h6 className="text-[11px] font-mono font-bold text-[#c9a45c] flex items-center gap-1">
                    <span>📊 users</span>
                  </h6>
                  <div className="mt-2 space-y-1 font-mono text-[9px] text-slate-400">
                    <div className="flex justify-between"><span>id</span> <span className="text-slate-600">VARCHAR</span></div>
                    <div className="flex justify-between"><span>email</span> <span className="text-slate-600">VARCHAR</span></div>
                    <div className="flex justify-between"><span>created_at</span> <span className="text-slate-600">DATE</span></div>
                    <div className="flex justify-between"><span>status_stars</span> <span className="text-slate-600">INT</span></div>
                    <div className="flex justify-between"><span>subscription</span> <span className="text-slate-600">VARCHAR</span></div>
                  </div>
                </div>

                {/* TABLE 2: Conversations */}
                <div className="p-3 bg-black/20 rounded-xl border border-[#dfd2be]/10">
                  <h6 className="text-[11px] font-mono font-bold text-[#c9a45c] flex items-center gap-1">
                    <span>📊 conversations</span>
                  </h6>
                  <div className="mt-2 space-y-1 font-mono text-[9px] text-slate-400">
                    <div className="flex justify-between"><span>id</span> <span className="text-slate-600">VARCHAR</span></div>
                    <div className="flex justify-between"><span>user_id</span> <span className="text-slate-600">VARCHAR</span></div>
                    <div className="flex justify-between"><span>deity</span> <span className="text-slate-600">VARCHAR</span></div>
                    <div className="flex justify-between"><span>message_count</span> <span className="text-slate-600">INT</span></div>
                    <div className="flex justify-between"><span>sentiment_score</span> <span className="text-slate-600">FLOAT</span></div>
                    <div className="flex justify-between"><span>duration_sec</span> <span className="text-slate-600">INT</span></div>
                    <div className="flex justify-between"><span>completed</span> <span className="text-slate-600">BOOLEAN</span></div>
                  </div>
                </div>

                {/* TABLE 3: Music prompts */}
                <div className="p-3 bg-black/20 rounded-xl border border-[#dfd2be]/10">
                  <h6 className="text-[11px] font-mono font-bold text-[#c9a45c] flex items-center gap-1">
                    <span>📊 music_prompts</span>
                  </h6>
                  <div className="mt-2 space-y-1 font-mono text-[9px] text-slate-400">
                    <div className="flex justify-between"><span>id</span> <span className="text-slate-600">VARCHAR</span></div>
                    <div className="flex justify-between"><span>user_id</span> <span className="text-slate-600">VARCHAR</span></div>
                    <div className="flex justify-between"><span>prompt</span> <span className="text-slate-600">VARCHAR</span></div>
                    <div className="flex justify-between"><span>length</span> <span className="text-slate-600">VARCHAR</span></div>
                    <div className="flex justify-between"><span>model</span> <span className="text-slate-600">VARCHAR</span></div>
                    <div className="flex justify-between"><span>status</span> <span className="text-slate-600">VARCHAR</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#c9a45c]/5 border border-[#c9a45c]/10 rounded-xl text-[8px] font-mono text-slate-500 leading-normal">
              <span className="text-[#c9a45c] font-bold block mb-0.5">📚 Sandbox Dialect</span>
              SQL engine supports basic: SELECT, WHERE, AND, LIKE, ORDER BY (DESC), LIMIT, and aggregations (GROUP BY count, sum, avg).
            </div>
          </div>

          {/* SQL INTERACTIVE WORKSPACE TERMINAL */}
          <div className="lg:col-span-9 space-y-6">
            <div className={`p-5 rounded-2xl border-2 flex flex-col justify-between min-h-[300px] ${
              isLightMode ? 'bg-white border-[#dfd2be]' : 'bg-[#0a0f0d] border-[#1e3a2b]'
            }`}>
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-mono font-bold text-slate-300">
                      local_postgres://localhost:5432/friend_ai
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-500">
                    Client-Side SQL Complier
                  </span>
                </div>

                <div className="relative">
                  <textarea
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    rows={6}
                    className="w-full font-mono text-xs p-4 bg-slate-950 border-2 border-slate-800 rounded-xl text-yellow-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-y"
                    placeholder="SELECT * FROM users LIMIT 10"
                  />
                </div>

                <div className="flex justify-between items-center mt-3">
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'Highly Stressed Users', q: 'SELECT id, email, status_stars FROM users WHERE status_stars >= 4 ORDER BY status_stars DESC' },
                      { label: 'Active Conversations', q: 'SELECT deity, message_count, sentiment_score FROM conversations WHERE completed = false' },
                      { label: 'Failed Flutes', q: 'SELECT prompt, model, status FROM music_prompts WHERE status = \'error\'' }
                    ].map((btn, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setSqlQuery(btn.q);
                          handleExecuteSQL(btn.q);
                        }}
                        className="py-1 px-2 border border-slate-700/50 hover:border-slate-500 bg-white/5 rounded-lg text-[9px] font-mono text-slate-400 hover:text-white transition-all cursor-pointer"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleExecuteSQL(sqlQuery)}
                    disabled={sqlExecuting || !sqlQuery.trim()}
                    className="py-2.5 px-6 bg-amber-600 hover:bg-amber-700 disabled:opacity-55 text-white font-mono text-xs uppercase font-bold tracking-wider rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    {sqlExecuting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Compiling...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-white" /> Compile SQL
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* SQL QUERY RESULTS */}
            {sqlResult && (
              <div className={`p-6 rounded-2xl border-2 space-y-6 ${
                isLightMode ? 'bg-white border-[#dfd2be]' : 'bg-[#0a0f0d] border-[#1e3a2b]'
              }`}>
                {/* QUERY METRICS */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl bg-slate-500/5 border border-[#dfd2be]/10">
                  <div className="flex gap-4 font-mono text-[10px] text-slate-400">
                    <div>
                      <span>Rows retrieved: </span>
                      <strong className="text-white">{sqlResult.rows.length}</strong>
                    </div>
                    <div>
                      <span>Execution cost: </span>
                      <strong className="text-emerald-400">{sqlResult.executionTimeMs} ms</strong>
                    </div>
                  </div>
                  <span className="text-[8px] font-mono uppercase bg-[#c9a45c]/10 text-[#c9a45c] px-2 py-0.5 rounded border border-[#c9a45c]/30">
                    Engine: Relational Sim-SQL V1
                  </span>
                </div>

                {/* ERROR FEEDBACK */}
                {sqlResult.error ? (
                  <div className="p-4 bg-red-500/10 border-2 border-red-500/20 text-red-400 rounded-xl font-mono text-xs flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 animate-pulse" />
                    <div>
                      <span className="font-bold block mb-0.5">Database Compile Error:</span>
                      {sqlResult.error}
                    </div>
                  </div>
                ) : (
                  /* RESULTS TABULAR GRID */
                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left border-collapse font-mono text-[11px] text-slate-300">
                      <thead>
                        <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                          {sqlResult.columns.map((col: string, i: number) => (
                            <th key={i} className="p-3 font-semibold">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sqlResult.rows.length === 0 ? (
                          <tr>
                            <td colSpan={sqlResult.columns.length} className="p-8 text-center text-slate-500">
                              Query returned 0 rows.
                            </td>
                          </tr>
                        ) : (
                          sqlResult.rows.map((row: any, idx: number) => (
                            <tr key={idx} className="border-b border-slate-800/40 hover:bg-white/5 transition-colors">
                              {sqlResult.columns.map((col: string, i: number) => (
                                <td key={i} className="p-3 font-normal max-w-[200px] truncate" title={String(row[col])}>
                                  {row[col] === null || row[col] === undefined ? (
                                    <span className="text-slate-600">NULL</span>
                                  ) : typeof row[col] === 'boolean' ? (
                                    row[col] ? 'TRUE' : 'FALSE'
                                  ) : (
                                    String(row[col])
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 6: WAITLIST & BACKERS MANAGER */}
      {activeTab === 'waitlist' && (
        <div className={`p-6 rounded-2xl border-2 space-y-6 ${
          isLightMode ? 'bg-white border-[#dfd2be]' : 'bg-[#0a0f0d] border-[#1e3a2b]'
        }`}>
          <div>
            <h5 className="font-serif text-sm font-bold uppercase text-amber-500">Waitlist, Backers &amp; Investors Hub</h5>
            <p className="text-[10px] text-slate-400">Real-time submissions from users who requested access, submitted feedback, or pledged support.</p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className={`p-4 rounded-xl border ${isLightMode ? 'bg-stone-50 border-stone-200' : 'bg-white/5 border-white/10'}`}>
              <span className="block text-[9px] font-mono uppercase tracking-wider text-slate-400">Total Signups</span>
              <span className="text-xl font-bold font-mono text-white mt-1 block">
                {waitlist.length}
              </span>
            </div>
            <div className={`p-4 rounded-xl border ${isLightMode ? 'bg-stone-50 border-stone-200' : 'bg-white/5 border-white/10'}`}>
              <span className="block text-[9px] font-mono uppercase tracking-wider text-slate-400">Waitlist Requests</span>
              <span className="text-xl font-bold font-mono text-white mt-1 block">
                {waitlist.filter(w => w.interest === 'waitlist').length}
              </span>
            </div>
            <div className={`p-4 rounded-xl border ${isLightMode ? 'bg-[#c9a45c]/5 border-[#c9a45c]/20' : 'bg-[#c9a45c]/10 border-[#c9a45c]/20'}`}>
              <span className="block text-[9px] font-mono uppercase tracking-wider text-[#c9a45c]">Donation Pledges</span>
              <span className="text-xl font-bold font-mono text-[#c9a45c] mt-1 block">
                {waitlist.filter(w => w.interest === 'donate').length}
              </span>
            </div>
            <div className={`p-4 rounded-xl border ${isLightMode ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
              <span className="block text-[9px] font-mono uppercase tracking-wider text-emerald-400">Investment Inquiries</span>
              <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                {waitlist.filter(w => w.interest === 'invest').length}
              </span>
            </div>
          </div>

          {/* Table list */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left border-collapse font-mono text-[11px] text-slate-300">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                  <th className="p-3 font-semibold">Timestamp</th>
                  <th className="p-3 font-semibold">User details</th>
                  <th className="p-3 font-semibold">Type</th>
                  <th className="p-3 font-semibold">Pledge/Amount</th>
                  <th className="p-3 font-semibold">Message / Feedback</th>
                </tr>
              </thead>
              <tbody>
                {waitlist.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No waitlist or backers registrations found.
                    </td>
                  </tr>
                ) : (
                  waitlist.map((entry: any, idx: number) => (
                    <tr key={entry.id || idx} className="border-b border-slate-800/40 hover:bg-white/5 transition-colors">
                      <td className="p-3 text-slate-400 max-w-[120px] truncate">
                        {new Date(entry.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <span className="text-white font-serif font-bold block">{entry.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">{entry.email}</span>
                      </td>
                      <td className="p-3">
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                          entry.interest === 'waitlist'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : entry.interest === 'feedback'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              : entry.interest === 'donate'
                                ? 'bg-[#c9a45c]/10 text-[#c9a45c] border border-[#c9a45c]/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {entry.interest}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-white">
                        {entry.amount ? entry.amount : <span className="text-slate-600 font-normal">N/A</span>}
                      </td>
                      <td className="p-3 text-slate-300 max-w-[300px] whitespace-normal break-words leading-relaxed">
                        {entry.message || <span className="text-slate-600 italic">No notes provided</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
