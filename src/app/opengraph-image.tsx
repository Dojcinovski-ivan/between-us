import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Between Us — Anonymous Peer Support for Relationship Trauma";

async function loadFrauncesFont() {
  const css = await fetch(
    "https://fonts.googleapis.com/css2?family=Fraunces:wght@500&text=BetweenUs",
  ).then((res) => res.text());

  const fontUrl = css.match(/src: url\(([^)]+)\)/)?.[1];
  if (!fontUrl) throw new Error("Could not resolve Fraunces font URL");

  return fetch(fontUrl).then((res) => res.arrayBuffer());
}

export default async function OpengraphImage() {
  const fraunces = await loadFrauncesFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f7f3ee",
        }}
      >
        <div
          style={{
            fontFamily: "Fraunces",
            fontSize: 96,
            fontWeight: 500,
            color: "#c4846a",
          }}
        >
          Between Us
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Fraunces", data: fraunces, weight: 500, style: "normal" }],
    },
  );
}
