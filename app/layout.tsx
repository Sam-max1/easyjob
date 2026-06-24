import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EasyJob — AI Career Acceleration Engine",
  description:
    "Upload your resume and a target job description. EasyJob analyzes the JD, realigns your resume semantically, generates a live proof-of-work project, and assembles a complete, recruiter-ready application kit — in under 90 seconds.",
  keywords: [
    "AI resume optimizer",
    "job application automation",
    "ATS keyword optimization",
    "proof of work portfolio",
    "career acceleration",
    "resume rewriter",
  ],
  authors: [{ name: "EasyJob" }],
  openGraph: {
    title: "EasyJob — AI Career Acceleration Engine",
    description:
      "Replace traditional applications with a live proof-of-work package. Optimized resume, live project URL, and outreach script — in 90 seconds.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
