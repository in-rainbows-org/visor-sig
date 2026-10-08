import type { Metadata, Viewport } from "next";
import "leaflet/dist/leaflet.css";
import "@/styles/globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "sileo";
import { appFontVariables } from "@/styles/fonts";

export const metadata: Metadata = {
  title: "VisorSIG",
  description:
    "Scaffold de Next.js con Better Auth, shadcn/ui y Clean Architecture",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
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
