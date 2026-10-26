import CasavaLogo from "@/components/CasavaLogo";
import Chat from "@/components/Chat";
import SiteHeader from "@/components/SiteHeader";

export default function Home() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <SiteHeader />
      <main
        id="main-content"
        className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8 lg:py-12"
      >
        <div className="grid flex-1 items-stretch gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12">
          <section className="flex flex-col justify-center pt-2 lg:pt-0" aria-labelledby="page-title">
            <p className="mb-4 text-xs font-semibold tracking-[0.16em] text-[var(--pink-text)] uppercase">
              Still here at 11pm
            </p>
            <h1 id="page-title" className="sr-only">
              Casava Help for Business Gro Insurance
            </h1>
            <CasavaLogo height={48} />
            <p className="font-display mt-6 max-w-md text-[1.65rem] leading-snug font-semibold tracking-[-0.02em] text-black sm:text-[2rem]">
              Insurance you enjoy, even after closing time.
            </p>
            <p className="mt-4 max-w-md text-base leading-relaxed text-[var(--ink-soft)]">
              Bakery closed for the night? Ask about Business Gro Insurance:
              what it covers, what it costs, whether you qualify, how to apply,
              and how to claim, without waiting for morning.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-[var(--ink-soft)]">
              <li className="flex gap-2.5">
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--pink)]"
                  aria-hidden
                />
                Up to ₦1,000,000 Business Gro cover for eligible SMEs
              </li>
              <li className="flex gap-2.5">
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--pink)]"
                  aria-hidden
                />
                Fire & flood focus, plus training and loan pathways
              </li>
              <li className="flex gap-2.5">
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--pink)]"
                  aria-hidden
                />
                General Casava questions welcome: health, contact, claims
              </li>
            </ul>
          </section>

          <section
            className="w-full lg:sticky lg:top-24 lg:self-start"
            aria-label="Chat with Casava Help"
          >
            <Chat />
          </section>
        </div>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-black/15 pt-5 text-xs text-[var(--ink-soft)]">
          <span>Casava Microinsurance · Lagos</span>
          <div className="flex flex-wrap gap-4">
            <a
              href="mailto:hello@casava.com"
              className="font-medium text-[var(--pink-text)] underline decoration-[rgba(196,15,98,0.4)] underline-offset-2 hover:text-[var(--pink-button-hover)]"
            >
              hello@casava.com
            </a>
            <a
              href="https://casava.com/landing"
              className="font-medium text-[var(--pink-text)] underline decoration-[rgba(196,15,98,0.4)] underline-offset-2 hover:text-[var(--pink-button-hover)]"
              target="_blank"
              rel="noreferrer"
            >
              casava.com
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </footer>
      </main>
    </>
  );
}
