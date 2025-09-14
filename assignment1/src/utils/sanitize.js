// src/utils/sanitize.js
import DOMPurify from 'dompurify'

const defaultCfg = {
  ALLOWED_TAGS: false,
  ALLOWED_ATTR: false,
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
  FORBID_ATTR: [
    'onerror','onload','onclick','onmouseover','onfocus','onabort',
    'style','srcdoc'
  ],
  ALLOWED_URI_REGEXP:
    /^(?:(?:https?|mailto|tel|ftp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
}

export function sanitizeHTML(html = '', cfg = defaultCfg) {
  return DOMPurify.sanitize(String(html), cfg)
}

export function sanitizeObject(obj = {}) {
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    out[k] = typeof v === 'string' ? sanitizeHTML(v) : v
  }
  return out
}

export function sanitizeURL(url = '') {
  const s = String(url || '').trim()
  if (/^\s*javascript:/i.test(s)) return '#'
  return s
}