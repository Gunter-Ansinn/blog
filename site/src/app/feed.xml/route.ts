export const dynamic = 'force-static'

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const POSTS_DIR = path.join(process.cwd(), 'posts')
const SITE_URL  = 'https://blog.ansinn.net'
const AUTHOR    = 'Gunter Ansinn'

function escape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function GET() {
  const files = fs
    .readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.mdx') || f.endsWith('.md'))

  const posts = files
    .flatMap(f => {
      const { data } = matter(fs.readFileSync(path.join(POSTS_DIR, f), 'utf8'))
      if (data.draft) return []
      return [{
        slug:        f.replace(/\.(mdx|md)$/, ''),
        title:       data.title as string,
        description: (data.description ?? '') as string,
        date:        new Date(data.date as string),
      }]
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime())

  const lastBuild = posts[0]?.date ?? new Date()

  const items = posts.map(p => `
  <item>
    <title>${escape(p.title)}</title>
    <link>${SITE_URL}/${p.slug}</link>
    <guid isPermaLink="true">${SITE_URL}/${p.slug}</guid>
    <description>${escape(p.description)}</description>
    <pubDate>${p.date.toUTCString()}</pubDate>
  </item>`).join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escape(AUTHOR)}</title>
    <link>${SITE_URL}</link>
    <description>Writing on inference, edge computing, and machine learning.</description>
    <language>en</language>
    <lastBuildDate>${lastBuild.toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
