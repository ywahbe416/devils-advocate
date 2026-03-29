import "./globals.css";

export const metadata = {
  title: "Devil's Advocate",
  description: "A debate app that always argues the other side.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
