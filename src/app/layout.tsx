import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoxiGuide Dashboard",
  description: "Manage / Create your walkthroughs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      </head>
      <body className="antialiased bg-default-background text-default-font">
        {children}
      </body>
    </html>
  );
}