import "./globals.css";

export const metadata = {
  title: "LaunchLab",
  description: "Startup execution platform for high school founders"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="gradient-bg min-h-screen">{children}</body>
    </html>
  );
}
