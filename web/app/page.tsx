import type { Metadata } from "next";
import { HomeMarketingPage } from "../components/beacon/pages/HomeMarketingPage";
import { SiteShell } from "../components/beacon/site/SiteShell";

export const metadata: Metadata = {
  title: "BEACON | Personal Safety Device",
  description: "Personal safety device engineered for real-world emergencies."
};

export default function HomePage() {
  return (
    <SiteShell>
      <HomeMarketingPage />
    </SiteShell>
  );
}
