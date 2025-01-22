import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

type PostProps = {
    params: {
        slug: string;
    };
};

// Generate static paths for dynamic routes
export async function generateStaticParams() {
    const postsDirectory = path.join(process.cwd(), "posts");
    const filenames = fs.readdirSync(postsDirectory);

    return filenames.map((filename) => ({
        slug: filename.replace(/\.md$/, ""),
    }));
}

// Render the individual blog post
export default async function Post({ params }: PostProps) {
    // Access the slug value properly
    const { slug } = params;

    const postsDirectory = path.join(process.cwd(), "posts");
    const filePath = path.join(postsDirectory, `${slug}.md`);
    const fileContents = fs.readFileSync(filePath, "utf8");

    const { data, content } = matter(fileContents);
    const processedContent = await remark().use(html).process(content);
    const contentHtml = processedContent.toString();

    return (
        <main>
        <h1>{data.title}</h1>
        <p>{data.date}</p>
        <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
        </main>
    );
}