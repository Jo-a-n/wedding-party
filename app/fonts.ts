import { Arima } from "next/font/google";
import localFont from "next/font/local";

export const arima = Arima({
  subsets: ["latin", "greek"],
  variable: "--font-arima",
  display: "swap",
});

export const gbMamaBeba = localFont({
  src: "./fonts/GBMamaBeba.ttf",
  variable: "--font-gb-mama-beba",
  display: "swap",
});

export const gnyrwn = localFont({
  src: "./fonts/gnyrwn979.otf",
  variable: "--font-gnyrwn",
  display: "swap",
});

export const playpenSans = localFont({
  src: "./fonts/PlaypenSans-VariableFont_wght.ttf",
  variable: "--font-playpen",
  display: "swap",
});

export const mynerve = localFont({
  src: "./fonts/Mynerve-Regular.ttf",
  variable: "--font-mynerve",
  display: "swap",
});

export const mansalva = localFont({
  src: "./fonts/Mansalva-Regular.ttf",
  variable: "--font-mansalva",
  display: "swap",
});

export const allFonts = [arima, gbMamaBeba, gnyrwn, playpenSans, mynerve, mansalva];

export const WISH_FONT_COUNT = 3;
