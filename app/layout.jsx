import { Toaster } from "sonner";
import "@/app/style/global.css";
import Script from "next/script";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import JsonLd from "@/app/components/JsonLd";
import GlobalLoader from "@/app/components/GlobalLoader";
import styles from "@/app/style/applayout.module.css";
import { Inter, Playfair_Display } from "next/font/google";
import { StoreInitializer } from "@/app/components/StoreInitializer";
import { SITE, absoluteUrl } from "@/app/constants/site";
import { buildMetadata } from "@/app/lib/seo";

const inter = Inter({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
});

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const GOOGLE_VERIFICATION = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

export const viewport = {
  themeColor: "#fffaf7",
};

const defaults = buildMetadata({ description: SITE.description });

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} - ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.name,
  keywords: [
    "online school",
    "online courses with certificate",
    "certification",
    "job placement",
    "learn and get hired",
    "communication skills course",
    "business communication course",
    "career training",
  ],
  openGraph: defaults.openGraph,
  twitter: defaults.twitter,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  ...(GOOGLE_VERIFICATION && { verification: { google: GOOGLE_VERIFICATION } }),
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/apple-touch-icon.png",
  },
};

const siteSchema = [
  {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": absoluteUrl("/#organization"),
    name: SITE.name,
    url: SITE.url,
    logo: absoluteUrl(SITE.logo),
    description: SITE.description,
    email: SITE.email,
    telephone: SITE.telephone,
    address: { "@type": "PostalAddress", addressCountry: SITE.country },
    sameAs: SITE.social,
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    name: SITE.name,
    url: SITE.url,
    publisher: { "@id": absoluteUrl("/#organization") },
  },
];

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${playfair.variable} ${inter.className}`}
      >
        <JsonLd data={siteSchema} />

        {GA_ID && (
          <>
            <Script
              id="ga-tag"
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
            </Script>
          </>
        )}

        <Toaster position="top-center" richColors={true} />
        <GlobalLoader />
        <div className={styles.appLayout}>
          <Navbar />
          <StoreInitializer>{children}</StoreInitializer>
          <Footer />
        </div>
      </body>
    </html>
  );
}
