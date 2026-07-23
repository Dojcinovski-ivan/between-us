export function CrisisBanner() {
  return (
    <div className="border-t border-border bg-surface/80 px-4 py-2.5 text-center text-xs text-muted backdrop-blur">
      <span>In crisis right now? </span>
      <a href="tel:08001110111" className="text-sage underline underline-offset-2 hover:text-sage-hover">
        Telefonseelsorge 0800 111 0 111
      </a>
      <span> · </span>
      <a
        href="https://findahelpline.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sage underline underline-offset-2 hover:text-sage-hover"
      >
        findahelpline.com
      </a>
    </div>
  );
}
