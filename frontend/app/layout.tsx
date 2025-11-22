import type { Metadata } from "next";
import { Montserrat, Poppins } from "next/font/google";
import "./globals.css";
import { StripedPattern } from "@/magicui/striped-pattern";
import CDPProvider from "./components/Providers/CDPProvider";
import Header from "./components/Navigation/Header";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MirrorME - Turn Your Influence into Interaction",
  description:
    "MirrorMe turns your influence into interaction with an AI version of you, powered by X402 micropayments, a dynamic reputation score, and seamless discoverability through ERC-8004",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${montserrat.variable} ${poppins.variable} antialiased`}
      >
        <div className="md:p-6 p-4 minh-dvh flex flex-col items-center justify-center bg-gradient relative">
          <CDPProvider>
            <div className="w-full mx-auto flex flex-col items-center justify-center">
              <Header />
              {children}
            </div>
          </CDPProvider>
          <StripedPattern className="stroke-[0.3] [stroke-dasharray:1,4] absolute top-0 left-0 right-0 bottom-0 w-full h-full z-0" />
        </div>
      </body>
    </html>
  );
}
