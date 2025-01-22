import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Link from "next/link";

type PostSummary = {
  slug: string;
  title: string;
  date: string;
};

export default function Home() {
  const postsDirectory = path.join(process.cwd(), "posts");
  const filenames = fs.readdirSync(postsDirectory);

  const posts: PostSummary[] = filenames.map((filename) => {
    const filePath = path.join(postsDirectory, filename);
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data } = matter(fileContents);

    return {
      slug: filename.replace(/\.md$/, ""),
      title: data.title,
      date: data.date,
    };
  });

  return (
    <main>
      <h1>Welcome to My Blog</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/${post.slug}`}>
              {post.title} - {post.date}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}