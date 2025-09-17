import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';

/**
 * Simple API helper around fetch with auth token.
 */
const API_BASE = process.env.REACT_APP_API_BASE_URL || '';
const TOKEN_KEY = 'chat_token_v1';

/**
 * PUBLIC_INTERFACE
 * getAuthToken
 * Returns the saved JWT token from localStorage.
 */
export function getAuthToken() {
  /** Get JWT access token from localStorage. */
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * PUBLIC_INTERFACE
 * setAuthToken
 * Saves or clears the JWT token securely.
 */
export function setAuthToken(token) {
  /** Save or clear JWT access token in localStorage. */
  try {
    if (!token) {
      localStorage.removeItem(TOKEN_KEY);
    } else {
      localStorage.setItem(TOKEN_KEY, token);
    }
  } catch {
    // ignore storage errors
  }
}

/**
 * PUBLIC_INTERFACE
 * apiFetch
 * Wrapper for fetch adding Authorization header if token exists.
 */
export async function apiFetch(path, { method = 'GET', headers = {}, body, token } = {}) {
  /** Perform authenticated API call to backend */
  const auth = token || getAuthToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let err;
    try { err = JSON.parse(text); } catch { err = text || res.statusText; }
    throw new Error(typeof err === 'string' ? err : (err.detail || err.message || res.statusText));
  }
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return res.json();
  return res.text();
}

function useAuth() {
  const [token, setToken] = useState(() => getAuthToken());
  const [profile, setProfile] = useState(null);

  const refreshProfile = useCallback(async () => {
    if (!token) { setProfile(null); return; }
    try {
      const data = await apiFetch('/auth/me', { token });
      setProfile(data);
    } catch {
      // invalid token
      setAuthToken(null);
      setToken(null);
      setProfile(null);
    }
  }, [token]);

  useEffect(() => { refreshProfile(); }, [refreshProfile]);

  const login = async (email, password) => {
    const data = await apiFetch('/auth/login', { method: 'POST', body: { email, password } });
    if (data?.access_token) {
      setAuthToken(data.access_token);
      setToken(data.access_token);
      await refreshProfile();
    }
  };

  const signup = async (email, password, display_name) => {
    await apiFetch('/auth/signup', { method: 'POST', body: { email, password, display_name } });
    // auto-login after signup
    await login(email, password);
  };

  const logout = () => {
    setAuthToken(null);
    setToken(null);
    setProfile(null);
  };

  return { token, profile, login, signup, logout, refreshProfile, setProfile };
}

/* Auth Screens */
function LoginPage({ onLogin }) {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await onLogin(email, password);
      nav('/');
    } catch (ex) {
      setErr(ex.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-title">
          <div className="brand-badge" />
          <div>Welcome back</div>
        </div>
        <form onSubmit={submit}>
          <div className="form-row">
            <label>Email</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="form-row">
            <label>Password</label>
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {err ? <div className="error-text">{err}</div> : null}
          <div className="form-row">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        </form>
        <div className="form-row" style={{ marginTop: 10 }}>
          <span>New here? </span>
          <button className="link" onClick={() => nav('/signup')}>Create an account</button>
        </div>
      </div>
    </div>
  );
}

function SignupPage({ onSignup }) {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await onSignup(email, password, displayName || null);
      nav('/');
    } catch (ex) {
      setErr(ex.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-title">
          <div className="brand-badge" />
          <div>Create your account</div>
        </div>
        <form onSubmit={submit}>
          <div className="form-row">
            <label>Email</label>
            <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="form-row">
            <label>Display name (optional)</label>
            <input className="input" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Alex Morgan" />
          </div>
          <div className="form-row">
            <label>Password</label>
            <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" required minLength={6} />
          </div>
          {err ? <div className="error-text">{err}</div> : null}
          <div className="form-row">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Creating…' : 'Create account'}
            </button>
          </div>
        </form>
        <div className="form-row" style={{ marginTop: 10 }}>
          <span>Already have an account? </span>
          <button className="link" onClick={() => nav('/login')}>Sign in</button>
        </div>
      </div>
    </div>
  );
}

/* Chat Screen */
function ChatLayout({ auth }) {
  const nav = useNavigate();
  const { profile, logout, token } = auth;

  // Sidebar state
  const [search, setSearch] = useState('');
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loadingConvs, setLoadingConvs] = useState(false);

  // Chat panel state
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [sending, setSending] = useState(false);
  const [openAiKey, setOpenAiKey] = useState('');

  const filteredConvs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(c => (c.title || 'Untitled').toLowerCase().includes(q));
  }, [conversations, search]);

  const loadConversations = useCallback(async () => {
    setLoadingConvs(true);
    try {
      const data = await apiFetch('/conversations', { token });
      setConversations(data || []);
      if (!activeId && data?.length) {
        setActiveId(data[0].id);
      }
    } catch (e) {
      // ignore
    } finally {
      setLoadingConvs(false);
    }
  }, [token, activeId]);

  const loadMessages = useCallback(async (id) => {
    if (!id) return;
    try {
      const data = await apiFetch(`/conversations/${id}`, { token });
      setMessages(data?.messages || []);
    } catch (e) {
      setMessages([]);
    }
  }, [token]);

  useEffect(() => { loadConversations(); }, [loadConversations]);
  useEffect(() => { loadMessages(activeId); }, [activeId, loadMessages]);

  const createConversation = async () => {
    const title = prompt?.trim() ? prompt.trim().slice(0, 60) : 'New Conversation';
    try {
      const created = await apiFetch('/conversations', { method: 'POST', body: { title }, token });
      await loadConversations();
      setActiveId(created.id);
      setMessages([]);
    } catch (e) {
      // no-op
    }
  };

  const deleteConversation = async (id) => {
    if (!window.confirm('Delete this conversation?')) return;
    try {
      await apiFetch(`/conversations/${id}`, { method: 'DELETE', token });
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeId === id) {
        setActiveId(conversations.find(c => c.id !== id)?.id || null);
        setMessages([]);
      }
    } catch (e) {
      // no-op
    }
  };

  const sendPrompt = async () => {
    if (!prompt.trim() || sending) return;
    setSending(true);
    try {
      let cid = activeId;
      if (!cid) {
        const created = await apiFetch('/conversations', { method: 'POST', body: { title: prompt.trim().slice(0, 60) }, token });
        cid = created.id;
        setActiveId(cid);
        await loadConversations();
      }
      // Optimistic add user message
      const optimisticUser = {
        id: `tmp-user-${Date.now()}`,
        conversation_id: cid,
        role: 'user',
        content: prompt,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, optimisticUser]);

      const headers = {};
      if (openAiKey?.trim()) {
        headers['X-OpenAI-API-Key'] = openAiKey.trim();
      }

      const resp = await apiFetch('/llm/chat', {
        method: 'POST',
        body: { conversation_id: cid, prompt, system_prompt: systemPrompt || null, model: model || null },
        token,
        headers,
      });

      // Append assistant message from response
      const assistantMsg = {
        id: `tmp-assistant-${Date.now()}`,
        conversation_id: cid,
        role: 'assistant',
        content: resp?.assistant_message || '',
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      setPrompt('');
    } catch (e) {
      const errMsg = {
        id: `tmp-error-${Date.now()}`,
        conversation_id: activeId,
        role: 'assistant',
        content: `Error: ${e.message}`,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  };

  if (!profile) {
    // Not authenticated -> go to login
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell">
      <header className="header">
        <div className="brand" onClick={() => nav('/')} style={{ cursor: 'pointer' }}>
          <div className="brand-badge" />
          <div className="brand-title">ConversAI</div>
        </div>
        <div className="header-actions">
          <div className="user-pill">
            <span role="img" aria-label="user">👤</span>
            <span>{profile.display_name || profile.email}</span>
          </div>
          <button className="logout-btn" onClick={logout} title="Log out">Logout</button>
        </div>
      </header>

      <main className="main">
        <aside className="sidebar">
          <div className="sidebar-header">
            <input className="search" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
            <button className="new-chat-btn" onClick={createConversation} title="New chat">＋</button>
          </div>
          <div className="sidebar-title">Your conversations</div>
          <div className="conv-list">
            {loadingConvs ? <div className="conv-meta" style={{ padding: '8px' }}>Loading…</div> : null}
            {filteredConvs.map(c => (
              <div key={c.id} className={`conv-item ${activeId === c.id ? 'active' : ''}`} onClick={() => setActiveId(c.id)}>
                <div>
                  <div className="conv-title">{c.title || 'Untitled'}</div>
                  <div className="conv-meta">#{c.id}</div>
                </div>
                <div className="conv-actions">
                  <button className="icon-btn" onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }} title="Delete">🗑️</button>
                </div>
              </div>
            ))}
            {!filteredConvs.length && !loadingConvs ? <div className="conv-meta" style={{ padding: '8px' }}>No conversations yet</div> : null}
          </div>
        </aside>

        <section className="chat-panel">
          <div className="chat-header">
            <div className="model-row">
              <label>Model</label>
              <input className="model-input" value={model} onChange={e => setModel(e.target.value)} placeholder="gpt-4o-mini" />
            </div>
            <input className="system-input" value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} placeholder="Optional: System prompt" />
            <input className="model-input" value={openAiKey} onChange={e => setOpenAiKey(e.target.value)} placeholder="Optional OpenAI API Key" />
          </div>
          <div className="chat-body">
            {messages.map(m => (
              <div className={`message ${m.role}`} key={`${m.id}-${m.created_at}`}>
                <div className="role">{m.role}</div>
                <div>{m.content}</div>
              </div>
            ))}
            {!messages.length ? (
              <div className="conv-meta">Start the conversation by typing a message below.</div>
            ) : null}
          </div>
          <div className="chat-input">
            <textarea
              className="prompt-input"
              placeholder="Type your message…"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendPrompt();
                }
              }}
            />
            <button className="send-btn" onClick={sendPrompt} disabled={sending || !prompt.trim()}>
              {sending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

function AppRoutes() {
  const auth = useAuth();

  return (
    <Routes>
      <Route path="/" element={<ChatLayout auth={auth} />} />
      <Route path="/login" element={<LoginPage onLogin={auth.login} />} />
      <Route path="/signup" element={<SignupPage onSignup={auth.signup} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/**
 * PUBLIC_INTERFACE
 * App entry component that provides BrowserRouter and routes.
 */
function App() {
  /** Root application component providing routes and app context. */
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
