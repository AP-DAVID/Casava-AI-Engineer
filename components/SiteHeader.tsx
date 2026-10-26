import CasavaLogo from "@/components/CasavaLogo";

export default function SiteHeader() {
  return (
    <header className="relative z-20 border-b border-black/10 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a href="/" className="flex items-center no-underline" aria-label="Casava home">
          <CasavaLogo height={28} />
        </a>

        <nav
          className="hidden items-center gap-6 text-sm font-medium text-[var(--ink-soft)] sm:flex"
          aria-label="Primary"
        >
          <a
            href="https://casava.com/landing"
            className="transition hover:text-[var(--pink-text)]"
            target="_blank"
            rel="noreferrer"
          >
            Products
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <a
            href="https://casava.com/business-gro"
            className="transition hover:text-[var(--pink-text)]"
            target="_blank"
            rel="noreferrer"
          >
            Business Gro
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          <a
            href="https://casava.com/about"
            className="transition hover:text-[var(--pink-text)]"
            target="_blank"
            rel="noreferrer"
          >
            About
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </nav>

        <a
          href="https://casava.com/landing"
          className="rounded-full bg-[var(--pink-button)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--pink-button-hover)]"
          target="_blank"
          rel="noreferrer"
        >
          Get cover
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    </header>
  );
}
