import type { MetadataRoute } from "next";

const appBlue = "#087cf0";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "VisorSIG — Visor de Datos SIG",
    short_name: "VisorSIG",
    description: "Visor geográfico de instalaciones de agua de Santa Cruz de la Sierra.",
    lang: "es",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: appBlue,
    theme_color: appBlue,
    icons: [
      {
        src: "/icons/icon-192.png?v=3",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png?v=3",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192.png?v=3",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png?v=3",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
