import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypePrettyCode from 'rehype-pretty-code'
import type { Metadata } from 'next'
import { formatDate } from '@/lib/formatDate'
import * as sims from '@/components/sims'
import SeriesNav, { type SeriesPost } from '@/components/SeriesNav'
import Tweet from '@/components/Tweet'
import XHandle from '@/components/XHandle'

const POSTS_DIR = path.join(process.cwd(), 'posts')

function findPost(slug: string): string | null {
  for (const ext of ['.mdx', '.md']) {
    const p = path.join(POSTS_DIR, slug + ext)
    if (fs.existsSync(p)) return p
  }
  return null
}

function getSeriesPosts(seriesName: string, currentSlug: string): SeriesPost[] {
  return fs
    .readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.mdx') || f.endsWith('.md'))
    .flatMap(f => {
      const { data } = matter(fs.readFileSync(path.join(POSTS_DIR, f), 'utf8'))
      if (data.draft || data.series !== seriesName) return []
      const slug = f.replace(/\.(mdx|md)$/, '')
      return [{ slug, title: data.title, order: data.seriesOrder ?? 0, isCurrent: slug === currentSlug }]
    })
    .sort((a, b) => a.order - b.order)
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const filePath = findPost(slug)
  if (!filePath) return {}
  const { data } = matter(fs.readFileSync(filePath, 'utf8'))
  return { title: data.title, description: data.description }
}

export async function generateStaticParams() {
  return fs
    .readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.mdx') || f.endsWith('.md'))
    .filter(f => {
      const { data } = matter(fs.readFileSync(path.join(POSTS_DIR, f), 'utf8'))
      return !data.draft
    })
    .map(f => ({ slug: f.replace(/\.(mdx|md)$/, '') }))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mdxOptions: any = {
  remarkPlugins: [remarkMath],
  rehypePlugins: [
    rehypeKatex,
    [rehypePrettyCode, { theme: 'vesper', keepBackground: false }],
  ],
}

export default async function Post({ params }: Props) {
  const { slug } = await params
  const filePath = findPost(slug)
  if (!filePath) notFound()

  const raw = fs.readFileSync(filePath!, 'utf8')
  const { data, content } = matter(raw)
  const tags: string[] = data.tags ?? []
  const seriesPosts = data.series ? getSeriesPosts(data.series, slug) : []

  return (
    <article>
      <Link href="/" className="post-back">← All posts</Link>

      <header className="post-header">
        <h1 className="post-title">{data.title}</h1>
        <p className="post-meta">{formatDate(data.date)}</p>
        {tags.length > 0 && (
          <div className="post-tags">
            {tags.map(tag => (
              <span key={tag} className="post-tag">{tag}</span>
            ))}
          </div>
        )}
      </header>

      <div className="prose">
        <MDXRemote
          source={content}
          components={{ ...sims, Tweet, XHandle }}
          options={{ mdxOptions }}
        />
      </div>

      {seriesPosts.length >= 2 && (
        <SeriesNav name={data.series} posts={seriesPosts} />
      )}
    </article>
  )
}
