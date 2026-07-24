import { useEffect } from 'react'

const SITE = 'https://rustservermanagerpro.com'

function setMeta(name, content, attr = 'name') {
  let el = document.querySelector(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(href) {
  let el = document.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/**
 * Sets document title, meta description and canonical link for the current page.
 * path should start with "/" (e.g. "/changelog"); omit for the homepage.
 */
export function useSEO(title, description, path = '') {
  useEffect(() => {
    document.title = title
    if (description) {
      setMeta('description', description)
      setMeta('og:description', description, 'property')
      setMeta('twitter:description', description)
    }
    setMeta('og:title', title, 'property')
    setMeta('twitter:title', title)
    const url = `${SITE}${path}`
    setMeta('og:url', url, 'property')
    setCanonical(url)
  }, [title, description, path])
}
