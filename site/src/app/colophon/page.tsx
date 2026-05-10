import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Colophon",
  description: "About this site and its author.",
};

export default function Colophon() {
  return (
    <article>
      <Link href="/" className="post-back">← Index</Link>

      <header className="post-header">
        <h1 className="post-title">Colophon</h1>
      </header>

      <div className="prose">
        <p>
          This is where I write. The subjects are AI architecture, the
          mechanics of language models, and whatever else refuses to leave
          me alone long enough to become a note. Some of it is rigorous.
          Some of it is speculation dressed up in the clothes of rigor.
          I try to label which is which.
        </p>
        <p>
          I am Gunter Ansinn — I build and think about AI systems. This
          site is not a portfolio, not a newsletter, and not an attempt
          to establish a personal brand. It is a record of thinking in
          progress, kept in public because the act of writing for an
          audience, even an imagined one, forces a kind of precision that
          private notes do not.
        </p>
        <p>
          The typeface is EB Garamond. The site is built with Next.js
          and deployed via GitHub Pages at{" "}
          <a href="https://blog.ansinn.net">blog.ansinn.net</a>.
          No analytics, no tracking.
        </p>
      </div>
    </article>
  );
}
