// Post bodies are plain paragraphs with the occasional "## " subheading,
// which is all the content needs, so this renders that small subset
// directly rather than pulling in a full markdown parser.
export function PostBody({ content }: { content: string }) {
  const blocks = content.split(/\n\n+/);

  return (
    <div className="mt-8 flex flex-col gap-5 text-[1.05rem] leading-[1.8] text-ink">
      {blocks.map((block, i) => {
        if (block.startsWith("## ")) {
          return (
            <h2 key={i} className="mt-4 font-display text-2xl font-medium text-ink">
              {block.slice(3).trim()}
            </h2>
          );
        }
        return <p key={i}>{block.trim()}</p>;
      })}
    </div>
  );
}
