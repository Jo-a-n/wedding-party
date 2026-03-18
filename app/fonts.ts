import {
  Caveat,
  Patrick_Hand,
  Shadows_Into_Light,
  Kalam,
  Indie_Flower,
  Architects_Daughter,
  Handlee,
} from "next/font/google";

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-wish-0",
  display: "swap",
});

const patrickHand = Patrick_Hand({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-wish-1",
  display: "swap",
});

const shadowsIntoLight = Shadows_Into_Light({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-wish-2",
  display: "swap",
});

const kalam = Kalam({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-wish-3",
  display: "swap",
});

const indieFlower = Indie_Flower({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-wish-4",
  display: "swap",
});

const architectsDaughter = Architects_Daughter({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-wish-5",
  display: "swap",
});

const handlee = Handlee({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-wish-6",
  display: "swap",
});

export const wishFonts = [
  caveat,
  patrickHand,
  shadowsIntoLight,
  kalam,
  indieFlower,
  architectsDaughter,
  handlee,
];

export const WISH_FONT_COUNT = wishFonts.length;
