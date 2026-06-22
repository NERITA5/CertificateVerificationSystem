import './globals.css';
import "@uploadthing/react/styles.css";

export const metadata = {
  title: 'UniCert - Institution Portal',
};

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#F8FAFC] text-slate-900">
        {children}
      </body>
    </html>
  );
}