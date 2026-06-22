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
        {/* We removed the Sidebar and Flex wrapper here. 
            Now, the layout is just a simple container for whatever 
            the current page/nested layout needs to display. */}
        {children}
      </body>
    </html>
  );
}