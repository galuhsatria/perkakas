import "./globals.css";
import NextTopLoader from "nextjs-toploader";
import { Inter } from "next/font/google";
import AppShell from "./components/AppShell";
import PWARegister from "./components/PWARegister";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "Perkakas",
  description: "A unified toolkit of focused online tools.",
  themeColor: "#0a0a0a",
  colorScheme: "dark",
  icons: { icon: "/logo.png", apple: "/logo.png" },
  openGraph: { title: "Perkakas", description: "A unified toolkit of focused online tools.", images: ["/logo.png"] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-base font-sans text-fg antialiased">
        <PWARegister/>
        <NextTopLoader showSpinner={false}/>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
