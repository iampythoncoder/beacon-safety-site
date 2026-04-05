import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-black/10 py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 text-sm text-black/62 sm:flex-row sm:items-center sm:justify-between lg:px-12">
        <div>
          <p className="text-base font-semibold tracking-[-0.05em] text-black">BEACON</p>
          <p className="mt-1">Personal safety, designed for high-pressure moments.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/#overview" className="hover:text-black">
            Overview
          </Link>
          <Link href="/#technology" className="hover:text-black">
            Technology
          </Link>
          <Link href="/#mission" className="hover:text-black">
            Mission
          </Link>
          <Link href="/#trust" className="hover:text-black">
            Trust
          </Link>
          <Link href="/buy-now" className="hover:text-black">
            Buy Now
          </Link>
        </div>
      </div>
    </footer>
  );
}
