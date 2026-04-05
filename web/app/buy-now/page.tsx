import type { Metadata } from "next";
import { BuyNowPage } from "../../components/beacon/pages/BuyNowPage";
import { SiteShell } from "../../components/beacon/site/SiteShell";

export const metadata: Metadata = {
  title: "Buy Now | BEACON",
  description: "Buy BEACON for $25 plus $3/month safety membership."
};

export default function BuyNowRoute() {
  return (
    <SiteShell>
      <BuyNowPage />
    </SiteShell>
  );
}
