'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

type Post = { slug: string; title: string }

const NEW_POST_TEMPLATE = `---
title: "Untitled"
date: "${new Date().toISOString().split('T')[0]}"
description: ""
---

`

export default function AdminPage() {
  const [posts, setPosts]         = useState<Post[]>([])
  const [slug, setSlug]           = useState('')
  const [content, setContent]     = useState('')
  const [saved, setSaved]         = useState(true)
  const [status, setStatus]       = useState('')
  const [newSlug, setNewSlug]     = useState('')
  const [creating, setCreating]   = useState(false)
  const [renaming, setRenaming]   = useState(false)
  const [renameVal, setRenameVal] = useState('')
  const iframeRef                 = useRef<HTMLIFrameElement>(null)

  const refreshPosts = useCallback(() => {
    fetch('/api/posts').then(r => r.json()).then(setPosts)
  }, [])

  useEffect(() => { refreshPosts() }, [refreshPosts])

  const loadPost = useCallback(async (s: string) => {
    if (!s) return
    const res  = await fetch(`/api/posts/${s}`)
    const data = await res.json()
    setContent(data.content)
    setSlug(s)
    setSaved(true)
    setStatus('')
    setRenaming(false)
    if (iframeRef.current) iframeRef.current.src = `/${s}`
  }, [])

  const save = useCallback(async () => {
    if (!slug) return
    setStatus('Saving…')
    await fetch(`/api/posts/${slug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    setSaved(true)
    setStatus('Saved')
    setTimeout(() => setStatus(''), 2000)
    if (iframeRef.current) iframeRef.current.src = `/${slug}?_t=${Date.now()}`
  }, [slug, content])

  const createPost = useCallback(async () => {
    const s = newSlug.trim().toLowerCase().replace(/\s+/g, '-')
    if (!s) return
    await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: s, content: NEW_POST_TEMPLATE }),
    })
    setCreating(false)
    setNewSlug('')
    refreshPosts()
    loadPost(s)
  }, [newSlug, refreshPosts, loadPost])

  const renamePost = useCallback(async () => {
    const s = renameVal.trim().toLowerCase().replace(/\s+/g, '-')
    if (!s || s === slug) { setRenaming(false); return }
    setStatus('Renaming…')
    await fetch(`/api/posts/${slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newSlug: s }),
    })
    setRenaming(false)
    setRenameVal('')
    await refreshPosts()
    await loadPost(s)
    setStatus('Renamed')
    setTimeout(() => setStatus(''), 2000)
  }, [slug, renameVal, refreshPosts, loadPost])

  const deletePost = useCallback(async () => {
    if (!slug) return
    const confirmed = window.confirm(`Delete "${slug}"? This cannot be undone.`)
    if (!confirmed) return
    await fetch(`/api/posts/${slug}`, { method: 'DELETE' })
    setSlug('')
    setContent('')
    setSaved(true)
    setStatus('')
    if (iframeRef.current) iframeRef.current.src = 'about:blank'
    refreshPosts()
  }, [slug, refreshPosts])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); save() }
      if (e.key === 'Escape') { setCreating(false); setRenaming(false) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [save])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--font-body)',
    }}>

      {/* ── Toolbar ──────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '0.5rem 1.25rem',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0, flexWrap: 'wrap',
      }}>
        <span style={{
          fontSize: '0.75rem', letterSpacing: '0.18em',
          textTransform: 'uppercase', color: 'var(--gold)', marginRight: '0.25rem',
        }}>
          Editor
        </span>

        {/* Post selector */}
        <select
          value={slug}
          onChange={e => loadPost(e.target.value)}
          style={selectStyle}
        >
          <option value="">Select a post…</option>
          {posts.map(p => (
            <option key={p.slug} value={p.slug}>{p.title || p.slug}</option>
          ))}
        </select>

        {/* New post */}
        {!creating ? (
          <button onClick={() => setCreating(true)} style={btnStyle(false)}>+ New</button>
        ) : (
          <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
            <input
              autoFocus placeholder="slug"
              value={newSlug} onChange={e => setNewSlug(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createPost() }}
              style={{ ...selectStyle, width: '130px' }}
            />
            <button onClick={createPost} style={btnStyle(false)}>Create</button>
            <button onClick={() => setCreating(false)} style={btnStyle(false)}>✕</button>
          </div>
        )}

        {/* Rename — only when a post is open */}
        {slug && !renaming && (
          <button
            onClick={() => { setRenaming(true); setRenameVal(slug) }}
            style={btnStyle(false)}
          >
            Rename
          </button>
        )}
        {renaming && (
          <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
            <input
              autoFocus
              value={renameVal} onChange={e => setRenameVal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') renamePost() }}
              style={{ ...selectStyle, width: '160px' }}
            />
            <button onClick={renamePost} style={btnStyle(false)}>OK</button>
            <button onClick={() => setRenaming(false)} style={btnStyle(false)}>✕</button>
          </div>
        )}

        {/* Delete */}
        {slug && !renaming && (
          <button
            onClick={deletePost}
            style={{ ...btnStyle(false), color: 'rgba(220,80,80,0.7)', borderColor: 'rgba(220,80,80,0.25)' }}
          >
            Delete
          </button>
        )}

        <div style={{ flex: 1 }} />

        {status && (
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{status}</span>
        )}
        {!saved && !status && (
          <span style={{ fontSize: '0.8rem', color: 'var(--gold)', fontStyle: 'italic' }}>Unsaved changes</span>
        )}

        <button onClick={save} disabled={!slug} style={btnStyle(!saved && !!slug)}>
          Save <kbd style={{ opacity: 0.6, fontSize: '0.75em' }}>⌘S</kbd>
        </button>

        <a href="/" style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
          ← Site
        </a>
      </div>

      {/* ── Split pane ───────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
          <MonacoEditor
            height="100%"
            language="markdown"
            value={content}
            onChange={v => { setContent(v ?? ''); setSaved(false) }}
            theme="vs-dark"
            options={{
              fontFamily: "'JetBrains Mono', 'Courier New', monospace",
              fontSize: 13, lineHeight: 22,
              wordWrap: 'on', minimap: { enabled: false },
              scrollBeyondLastLine: false,
              padding: { top: 24, bottom: 24 },
              renderLineHighlight: 'none',
              lineNumbers: 'off', folding: false,
              tabSize: 2, renderWhitespace: 'none',
            }}
          />
        </div>

        <div style={{ width: '1px', background: 'var(--border)', flexShrink: 0 }} />

        <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
          {slug ? (
            <iframe
              ref={iframeRef}
              src={`/${slug}`}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Post preview"
            />
          ) : (
            <div style={{
              height: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexDirection: 'column', gap: '0.5rem',
              color: 'var(--text-muted)',
            }}>
              <span style={{ fontSize: '2rem', opacity: 0.3 }}>◈</span>
              <span style={{ fontSize: '0.9375rem', fontStyle: 'italic' }}>
                Select or create a post to begin
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

const selectStyle: React.CSSProperties = {
  background: 'var(--bg-subtle)', color: 'var(--text)',
  border: '1px solid var(--border)', borderRadius: '3px',
  padding: '0.25rem 0.5rem', fontSize: '0.875rem',
  fontFamily: 'inherit', outline: 'none',
}

const btnStyle = (active: boolean): React.CSSProperties => ({
  background: active ? 'var(--gold)' : 'transparent',
  color: active ? '#111' : 'var(--text-muted)',
  border: '1px solid var(--border)', borderRadius: '3px',
  padding: '0.25rem 0.75rem', fontSize: '0.8125rem',
  fontFamily: 'inherit', cursor: 'pointer', letterSpacing: '0.03em',
})
