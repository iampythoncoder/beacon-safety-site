import type { ReactNode } from "react";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

type SiteShellProps = {
  children: ReactNode;
};

export function SiteShell({ children }: SiteShellProps) {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#efefed] text-black">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-24 h-[420px] w-[420px] rounded-full bg-white blur-3xl" />
        <div className="absolute -right-28 top-[-30px] h-[560px] w-[560px] rounded-full bg-black/[0.05] blur-3xl" />
        <div className="absolute inset-0 opacity-[0.28] [background-image:linear-gradient(rgba(0,0,0,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.07)_1px,transparent_1px)] [background-size:64px_64px]" />
      </div>

      <div className="relative z-10">
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </div>
    </div>
  );
}
