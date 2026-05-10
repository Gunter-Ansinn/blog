'use client'

import Link from 'next/link'

export type SeriesPost = {
  slug: string
  title: string
  order: number
  isCurrent: boolean
}

interface Props {
  name: string
  posts: SeriesPost[]
}

export default function SeriesNav({ name, posts }: Props) {
  if (posts.length < 2) return null

  return (
    <nav className="series-nav" aria-label={`Series: ${name}`}>
      <p className="series-nav-label">Series</p>
      <ol className="series-nav-list">
        {posts.map(post => (
          <li key={post.slug} className={`series-nav-item${post.isCurrent ? ' series-nav-item--current' : ''}`}>
            {post.isCurrent
              ? <span>{post.title}</span>
              : <Link href={`/${post.slug}`}>{post.title}</Link>
            }
          </li>
        ))}
      </ol>
    </nav>
  )
}
