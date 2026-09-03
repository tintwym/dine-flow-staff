import type { Metadata, Viewport } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import RegisterSW from "@/components/RegisterSW";
import { StaffAuthProvider } from "@/lib/staff-auth";
import "./globals.css";
import "./staff.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display-next",
  weight: ["600", "700"],
});

const body = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-body-next",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "DineFlow Office",
  description: "Kitchen, floor, and manager POS for DineFlow",
  applicationName: "DineFlow Office",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "DineFlow Office",
    statusBarStyle: "default",
  },
  icons: {
    icon: [{ url: "/icons/icon-192.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/icon-192.svg" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#B35200",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body
        suppressHydrationWarning
        className="staff-body"
        style={
          {
            ["--font-display" as string]:
              "var(--font-display-next), Georgia, serif",
            ["--font-body" as string]:
              "var(--font-body-next), system-ui, sans-serif",
          } as React.CSSProperties
        }
      >
        <RegisterSW />
        <StaffAuthProvider>{children}</StaffAuthProvider>
      </body>
    </html>
  );
}
