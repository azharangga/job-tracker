import type { Metadata } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@/styles.css";
import { RootProviders } from "@/providers/RootProviders";

export const metadata: Metadata = {
  title: {
    default: "Job Tracker - Personal Job Application Tracker",
    template: "%s | Job Tracker",
  },
  description:
    "A professional, premium dashboard to track every job application from wishlist to offer. Kanban, calendar, analytics, and more.",
  openGraph: {
    title: "Job Tracker",
    description: "Personal Job Application Tracker built like a modern SaaS dashboard.",
    type: "website",
  },
  twitter: {
    card: "summary",
  },
  icons: {
    icon: "/favicon.svg?v=2",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}
