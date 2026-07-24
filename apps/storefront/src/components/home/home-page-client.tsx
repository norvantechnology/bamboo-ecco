"use client";

import dynamic from "next/dynamic";
import type { HomepageData, WelcomePopupConfig } from "@/lib/api";
import { withHomepageSections } from "@/lib/homepage-sections";
import { HomePageAnimated } from "@/components/home/home-page-animated";

const WelcomePopup = dynamic(
  () => import("@/components/promo/welcome-popup").then((m) => m.WelcomePopup),
  { ssr: false },
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
