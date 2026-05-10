import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const POSTS_DIR = path.join(process.cwd(), 'posts')

function findFile(slug: string): string | null {
  for (const ext of ['.mdx', '.md']) {
    const p = path.join(POSTS_DIR, slug + ext)
    if (fs.existsSync(p)) return p
  }
  return null
}

type Params = { params: Promise<{ slug: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params
  const filePath = findFile(slug)
  if (!filePath) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const content = fs.readFileSync(filePath, 'utf8')
  return NextResponse.json({ content })
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { slug } = await params
  const { content } = await req.json()
  const filePath = findFile(slug) ?? path.join(POSTS_DIR, `${slug}.mdx`)
  fs.writeFileSync(filePath, content, 'utf8')
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { slug } = await params
  const { newSlug } = await req.json()
  const oldPath = findFile(slug)
  if (!oldPath) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const ext = path.extname(oldPath)
  const newPath = path.join(POSTS_DIR, `${newSlug}${ext}`)
  fs.renameSync(oldPath, newPath)
  return NextResponse.json({ ok: true, slug: newSlug })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { slug } = await params
  const filePath = findFile(slug)
  if (!filePath) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  fs.unlinkSync(filePath)
  return NextResponse.json({ ok: true })
}
