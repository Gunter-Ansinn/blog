import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const POSTS_DIR = path.join(process.cwd(), 'posts')

export async function GET() {
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.mdx') || f.endsWith('.md'))
  const posts = files.map(f => {
    const raw = fs.readFileSync(path.join(POSTS_DIR, f), 'utf8')
    const { data } = matter(raw)
    return {
      slug: f.replace(/\.(mdx|md)$/, ''),
      title: data.title ?? f,
    }
  })
  return NextResponse.json(posts)
}

export async function POST(req: Request) {
  const { slug, content } = await req.json()
  const filePath = path.join(POSTS_DIR, `${slug}.mdx`)
  fs.writeFileSync(filePath, content, 'utf8')
  return NextResponse.json({ ok: true })
}
