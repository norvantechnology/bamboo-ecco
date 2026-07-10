"use client";

import dynamic from "next/dynamic";
import type { HomepageData, WelcomePopupConfig } from "@/lib/api";
import { withHomepageSections } from "@/lib/homepage-sections";

const WelcomePopup = dynamic(
  () => import("@/components/promo/welcome-popup").then((m) => m.WelcomePopup),
  { ssr: false },
);

const HomePageAnimated = dynamic(
  () => import("@/components/home/home-page-animated").then((m) => m.HomePageAnimated),
  {
    ssr: true,
    loading: () => <div className="min-h-[40vh]" aria-hidden />,
  },
);

type HomePageClientProps = {
  data: HomepageData;
  welcomePopup?: WelcomePopupConfig;
};

export function HomePageClient({ data, welcomePopup }: HomePageClientProps) {
  const resolved = withHomepageSections(data);

  return (
    <>
      {welcomePopup?.enabled && <WelcomePopup config={welcomePopup} />}
      <HomePageAnimated data={resolved} />
    </>
  );
}
