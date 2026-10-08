import { Montserrat } from "next/font/google";

/*
 * Roles tipográficos para toda la aplicación. system.css los expone como
 * las utilidades Tailwind font-headline, font-sans y font-label.
 */
const headline = Montserrat({
  subsets: ["latin"],
  variable: "--app-font-headline",
  display: "swap",
});

const body = Montserrat({
  subsets: ["latin"],
  variable: "--app-font-body",
  display: "swap",
});

const label = Montserrat({
  subsets: ["latin"],
  variable: "--app-font-body",
  display: "swap",
});
export const appFontVariables = `${headline.variable} ${body.variable} ${label.variable}`;

