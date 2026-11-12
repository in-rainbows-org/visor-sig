import type { Metadata, Viewport } from "next";
import "leaflet/dist/leaflet.css";
import "@/styles/globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sileo";
import { appFontVariables } from "@/styles/fonts";

export const metadata: Metadata = {
  title: "VisorSIG",
  description: "Visor geográfico de instalaciones de agua de Santa Cruz de la Sierra.",
  applicationName: "VisorSIG",
  appleWebApp: {
    capable: true,
    title: "VisorSIG",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#087cf0",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={cn(
        "h-full",
        "h-[100dvh]",
        "antialiased",
        appFontVariables,
        "font-sans",
        "overflow-hidden",
      )}
    >
      <body className="h-full h-[100dvh] w-full overflow-hidden flex flex-col overscroll-none">
        {children}
        <Toaster
          position="top-center"
          options={{
            fill: "#ffffff",
            roundness: 18,
          }}
        />
      </body>
    </html>
  );
}
