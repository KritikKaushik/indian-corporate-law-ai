const API = 'http://localhost:5000'
const tok = () => { try { return JSON.parse(localStorage.getItem('lb_user') || 'null')?.access_token } catch { return null } }
const authH = () => { const t = tok(); return t ? { Authorization: `Bearer ${t}` } : {} }

const req = async (path, opts = {}) => {
  const res = await fetch(`${API}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', ...authH(), ...opts.headers } })
  if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error(`${res.status}: ${t}`) }
  return res.json()
}

export const authAPI = {
  signup: (email, password) => fetch(`${API}/api/auth/signup`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email,password}) }).then(async r => { if(!r.ok) throw new Error(await r.text()); return r.json() }),
  login:  (email, password) => fetch(`${API}/api/auth/login`,  { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email,password}) }).then(async r => { if(!r.ok) throw new Error(await r.text()); return r.json() }),
}

export const documentAPI = {
  upload: async (file) => {
    const fd = new FormData(); fd.append('file', file)
    const res = await fetch(`${API}/api/documents/upload`, { method:'POST', headers: authH(), body: fd })
    if (!res.ok) throw new Error(await res.text()); return res.json()
  },
  list:   () => req('/api/documents'),
  get:    (id) => req(`/api/documents/${id}`),
  delete: (id) => req(`/api/documents/${id}`, { method:'DELETE' }),
  fileUrl: (id) => `${API}/api/documents/${id}/file`,  // used with auth header fetch → blob
}

export const summarizeAPI = {
  trigger: (id) => req(`/summarize/${id}`, { method:'POST' }),
  get:     (id) => req(`/result/${id}`),
}

export const fetchFileAsBlob = async (docId) => {
  const res = await fetch(`${API}/api/documents/${docId}/file`, { headers: authH() })
  if (!res.ok) throw new Error('Cannot fetch file')
  return res.blob()
}

export const healthCheck = async () => { try { return (await fetch(`${API}/health`)).ok } catch { return false } }
