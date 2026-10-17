import fs from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

const fontNameHeading = "Barlow Condensed";
const fontNameMono = "IBM Plex Mono";
const defaultSpec = "SYS-00";
const defaultTitle = "DevHaven Games";
const defaultDesc =
  "Play free online browser games, and multiplayer arcade games instantly. No downloads or installation required.";
const defaultCategory = "Arcade Library";
const defaultPlayers = "1-2 Players";
const fullDimension = "100%";
const spaceBetweenLayout = "space-between";
const columnLayout = "column";

const engineLabel = "[ ZERO-INSTALL BROWSER GAME ]";
const multiplayerLabel = "● REAL-TIME WEBSOCKET MULTIPLAYER";
const localSessionLabel = "⚡ INSTANT LOCAL SESSION";
const noAdsLabel = "0 ADS // NO TRACKING";
const footerSpecLabel = "OPEN SOURCE";

const toArrayBuffer = (buffer: Buffer): ArrayBuffer => {
  const arrayBuffer = new ArrayBuffer(buffer.byteLength);
  const view = new Uint8Array(arrayBuffer);
  view.set(buffer);
  return arrayBuffer;
};

const loadFontBuffer = async (
  fontFilename: string
): Promise<ArrayBuffer | null> => {
  const primaryPath = path.join(
    process.cwd(),
    "apps/frontend/src/assets/fonts",
    fontFilename
  );
  const fallbackPath = path.join(
    process.cwd(),
    "src/assets/fonts",
    fontFilename
  );

  try {
    const fileBuffer = await fs.readFile(primaryPath);
    return toArrayBuffer(fileBuffer);
  } catch {
    try {
      const fileBuffer = await fs.readFile(fallbackPath);
      return toArrayBuffer(fileBuffer);
    } catch {
      return null;
    }
  }
};

const barlowPromise = loadFontBuffer("BarlowCondensed-SemiBold.ttf");
const ibmPromise = loadFontBuffer("IBMPlexMono-Regular.ttf");

type ImageResponseOptions = NonNullable<
  ConstructorParameters<typeof ImageResponse>[1]
>;

interface CustomFontItem {
  data: ArrayBuffer;
  name: string;
  style: "normal";
  weight: 400 | 600;
}

const pillBadgeStyle = {
  alignItems: "center" as const,
  backgroundColor: "#201B15",
  border: "1px solid #332B1C",
  color: "#9C927F",
  display: "flex" as const,
  fontSize: "12px",
  letterSpacing: "0.08em",
  padding: "6px 14px",
  textTransform: "uppercase" as const,
};

const getHandler = async (request: NextRequest): Promise<Response> => {
  const { searchParams } = request.nextUrl;
  const rawTitle = searchParams.get("title");
  const rawDescription = searchParams.get("description");
  const rawCategory = searchParams.get("category");
  const rawPlayers = searchParams.get("players");
  const rawSpec = searchParams.get("spec");
  const isMultiplayer = searchParams.get("multiplayer") === "true";

  const cleanTitle = rawTitle === null ? "" : rawTitle.trim();
  const cleanDescription =
    rawDescription === null ? "" : rawDescription.trim();
  const cleanCategory = rawCategory === null ? "" : rawCategory.trim();
  const cleanPlayers = rawPlayers === null ? "" : rawPlayers.trim();
  const cleanSpec = rawSpec === null ? "" : rawSpec.trim();

  const displayTitle = cleanTitle.length > 0 ? cleanTitle : defaultTitle;
  const displayDescription =
    cleanDescription.length > 0 ? cleanDescription : defaultDesc;
  const displayCategory =
    cleanCategory.length > 0 ? cleanCategory : defaultCategory;
  const displayPlayers =
    cleanPlayers.length > 0 ? cleanPlayers : defaultPlayers;
  const displaySpec = cleanSpec.length > 0 ? cleanSpec : defaultSpec;

  const [barlowData, ibmData] = await Promise.all([
    barlowPromise,
    ibmPromise,
  ]);

  const loadedFonts: CustomFontItem[] = [];

  if (barlowData !== null) {
    loadedFonts.push({
      data: barlowData,
      name: fontNameHeading,
      style: "normal",
      weight: 600,
    });
  }

  if (ibmData !== null) {
    loadedFonts.push({
      data: ibmData,
      name: fontNameMono,
      style: "normal",
      weight: 400,
    });
  }

  const fontFamilyHeading =
    loadedFonts.length > 0 ? fontNameHeading : "sans-serif";
  const fontFamilyMono = loadedFonts.length > 0 ? fontNameMono : "monospace";

  const imageOptions: ImageResponseOptions = {
    height: 630,
    width: 1200,
  };

  if (loadedFonts.length > 0) {
    imageOptions.fonts = loadedFonts;
  }

  return new ImageResponse(
    <div
      style={{
        backgroundColor: "#121212",
        display: "flex",
        flexDirection: columnLayout,
        height: fullDimension,
        justifyContent: spaceBetweenLayout,
        padding: "44px",
        width: fullDimension,
      }}
    >
      <div
        style={{
          backgroundColor: "#171410",
          border: "2px solid #2B241C",
          display: "flex",
          flexDirection: columnLayout,
          height: fullDimension,
          justifyContent: spaceBetweenLayout,
          padding: "40px",
          position: "relative",
          width: fullDimension,
        }}
      >
        {/* Top Header Bar */}
        <div
          style={{
            alignItems: "center",
            display: "flex",
            justifyContent: spaceBetweenLayout,
            width: fullDimension,
          }}
        >
            <div
              style={{
                alignItems: "center",
                backgroundColor: "#E2F4C8",
                color: "#121212",
                display: "flex",
                fontFamily: fontFamilyMono,
                fontSize: "14px",
                fontWeight: 700,
                height: "26px",
                justifyContent: "center",
                letterSpacing: "0.1em",
                padding: "0 10px",
              }}
            >
              DEVHAVEN
            </div>

          {/* Category & Spec Badges */}
          <div
            style={{
              alignItems: "center",
              display: "flex",
              gap: "10px",
            }}
          >
            <div
              style={{
                backgroundColor: "#201B15",
                border: "1px solid #332B1C",
                color: "#9C927F",
                display: "flex",
                fontFamily: fontFamilyMono,
                fontSize: "12px",
                letterSpacing: "0.1em",
                padding: "4px 10px",
              }}
            >
              {displaySpec}
            </div>
            <div
              style={{
                backgroundColor: "#1F2917",
                border: "1px solid #3B4D28",
                color: "#E2F4C8",
                display: "flex",
                fontFamily: fontFamilyMono,
                fontSize: "12px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                padding: "4px 12px",
                textTransform: "uppercase",
              }}
            >
              {displayCategory}
            </div>
          </div>
        </div>

        {/* Center Game Title and Description */}
        <div
          style={{
            display: "flex",
            flexDirection: columnLayout,
            gap: "14px",
            marginBottom: "auto",
            marginTop: "auto",
            paddingBottom: "16px",
            paddingTop: "16px",
          }}
        >
          <div
            style={{
              color: "#8E8472",
              fontFamily: fontFamilyMono,
              fontSize: "13px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            {engineLabel}
          </div>
          <div
            style={{
              color: "#F0E6C8",
              fontFamily: fontFamilyHeading,
              fontSize: displayTitle.length > 14 ? "80px" : "96px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 0.95,
              textTransform: "uppercase",
            }}
          >
            {displayTitle}
          </div>
          <div
            style={{
              color: "#AFA593",
              fontFamily: fontFamilyMono,
              fontSize: "20px",
              lineHeight: 1.45,
              maxWidth: "960px",
            }}
          >
            {displayDescription}
          </div>
        </div>

        {/* Feature & Badges Strip */}
        <div
          style={{
            alignItems: "center",
            display: "flex",
            gap: "12px",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              ...pillBadgeStyle,
              color: "#F0E6C8",
            }}
          >
            {`👥 ${displayPlayers}`}
          </div>

          {isMultiplayer ? (
            <div
              style={{
                ...pillBadgeStyle,
                backgroundColor: "#162719",
                border: "1px solid #2B5731",
                color: "#68D391",
                fontWeight: 600,
              }}
            >
              {multiplayerLabel}
            </div>
          ) : (
            <div style={pillBadgeStyle}>{localSessionLabel}</div>
          )}

          <div style={pillBadgeStyle}>{noAdsLabel}</div>
        </div>

        {/* Bottom Technical Watermark Bar */}
        <div
          style={{
            alignItems: "center",
            borderTop: "1px solid #2B241C",
            display: "flex",
            justifyContent: spaceBetweenLayout,
            paddingTop: "16px",
            width: fullDimension,
          }}
        >
          <div
            style={{
              color: "#F0E6C8",
              fontFamily: fontFamilyMono,
              fontSize: "16px",
              fontWeight: 600,
              letterSpacing: "0.1em",
            }}
          >
            games.ram.codes
          </div>
          <div
            style={{
              color: "#6D6453",
              fontFamily: fontFamilyMono,
              fontSize: "12px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            {footerSpecLabel}
          </div>
        </div>
      </div>
    </div>,
    imageOptions
  );
};

export { getHandler as GET };
