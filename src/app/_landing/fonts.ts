import { Fraunces, Karla } from "next/font/google";

// Landing page only. Applied to the landing page's own root element so
// the CSS variables never leak into the rest of the app, which keeps
// its existing Georgia/system font stack.
export const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const karla = Karla({
  subsets: ["latin"],
  variable: "--font-karla",
  display: "swap",
});
