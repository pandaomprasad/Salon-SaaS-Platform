import type { Metadata } from "next";
import "@/app/global.css";
import Providers from "./providers";
import LayoutWrapper from "@/app/LayoutWrapper";

export const metadata: Metadata = {
  title: "ST CUT — SuperAdmin Control Panel",
  description: "Super admin control panel for ST CUT platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <LayoutWrapper>{children}</LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}