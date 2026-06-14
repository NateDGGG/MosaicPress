import "./globals.css";
import RootChrome from "@mosaic/core/components/RootChrome";

export { generateMetadata } from "@mosaic/core/app/metadata";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <RootChrome>{children}</RootChrome>;
}
