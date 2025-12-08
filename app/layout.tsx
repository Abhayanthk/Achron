import { Outfit } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata = {
  title: "Achron",
  description: "Achron",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      
      <body className={`${outfit.className} antialiased`}>
        <SidebarProvider>
          <AppSidebar />
          <main className="w-full">
            <SidebarTrigger className="relative z-10" />
            {children}
          </main>
        </SidebarProvider>
      </body>
    </html>
  );
}
