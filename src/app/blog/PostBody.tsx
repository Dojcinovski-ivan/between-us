import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";

const components: Components = {
  h1: ({ children }) => (
    <h1 className="font-display text-3xl font-medium leading-tight text-ink">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-display text-2xl font-medium leading-tight text-ink">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-display text-xl font-medium leading-snug text-ink">{children}</h3>
  ),
  p: ({ children }) => <p className="text-[1.05rem] leading-[1.8] text-ink">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ href, children }) => (
    <a href={href} className="text-sage underline underline-offset-2 hover:text-sage-hover">
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="flex list-disc flex-col gap-2 pl-6 text-[1.05rem] leading-[1.8] text-ink">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="flex list-decimal flex-col gap-2 pl-6 text-[1.05rem] leading-[1.8] text-ink">{children}</ol>
  ),
  li: ({ children }) => <li>{children}</li>,
};

export function PostBody({ content }: { content: string }) {
  return (
    <div className="mt-8 flex flex-col gap-5">
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}
