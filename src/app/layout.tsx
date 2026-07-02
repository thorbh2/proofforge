import type { Metadata } from "next";
import "./globals.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { WalletProvider } from "@/components/WalletProvider";
import { DataProvider } from "@/components/DataProvider";
import { Shell } from "@/components/Shell";

config.autoAddCss = false;

export const metadata: Metadata = {
  title: "ProofForge - deliverable verification protocol",
  description: "Publish missions with acceptance criteria, submit proof of work, and let a GenLayer intelligent contract review, score, challenge, appeal, and finalize an auditable outcome.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <DataProvider>
            <Shell>{children}</Shell>
          </DataProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
