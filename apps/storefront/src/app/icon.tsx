import { ImageResponse } from "next/og";
import { resolveSiteSeo } from "@/lib/site";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  const seo = await resolveSiteSeo();
  const initial = seo.name.charAt(0).toUpperCase() || "T";
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: seo.themeColor,
          color: seo.backgroundColor,
          fontSize: 18,
          fontWeight: 700,
          borderRadius: 6,
        }}
      >
        {initial}
      </div>
    ),
    size,
  );
}
