import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Link from "next/link";
import { formatDate } from "@/lib/formatDate";

type PostSummary = {
  slug: string;
  title: string;
  date: string;
  description?: string;
  tags?: string[];
};

export default function Home() {
  const postsDirectory = path.join(process.cwd(), "posts");
  const filenames = fs.readdirSync(postsDirectory).filter(f => f.endsWith('.mdx') || f.endsWith('.md'));

  const posts: PostSummary[] = filenames
    .map((filename) => {
      const filePath = path.join(postsDirectory, filename);
      const { data } = matter(fs.readFileSync(filePath, "utf8"));
      if (data.draft) return null;
      return {
        slug: filename.replace(/\.(mdx|md)$/, ""),
        title: data.title,
        date: data.date,
        description: data.description,
        tags: data.tags,
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b!.date).getTime() - new Date(a!.date).getTime()) as PostSummary[];

  return (
    <div>
      <ul className="post-list">
        {posts.map((post) => (
          <li key={post.slug} className="post-list-item">
            <Link href={`/${post.slug}`} className="post-list-link">
              <span className="post-list-title">{post.title}</span>
              <span className="post-list-date">{formatDate(post.date)}</span>
            </Link>
            {post.description && (
              <p className="post-list-desc">{post.description}</p>
            )}
            {post.tags && post.tags.length > 0 && (
              <div className="post-tags">
                {post.tags.map(tag => (
                  <span key={tag} className="post-tag">{tag}</span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
