import { Globe } from "lucide-react";

function SitePreview({ url, title }: { url: string | null; title: string }) {
  if (!url) {
    return (
      <div className="flex aspect-413/258 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong bg-muted text-sm text-subtle">
        <Globe className="size-5" />
        No production deployment yet
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group relative block aspect-413/258 overflow-hidden rounded-lg border border-border-strong bg-white"
      aria-label={`Open ${title}`}
    >
      <iframe
        src={url}
        title={`Preview of ${title}`}
        loading="lazy"
        sandbox="allow-scripts"
        tabIndex={-1}
        className="pointer-events-none absolute top-0 left-0 h-[400%] w-[400%] origin-top-left scale-25 border-0"
      />
      <span className="absolute inset-0 transition-colors group-hover:bg-black/5" />
    </a>
  );
}

export { SitePreview };
