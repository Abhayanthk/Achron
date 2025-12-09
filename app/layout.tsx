import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
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
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
            colorPrimary: '#ffffff',
            colorBackground: '#09090b', // zinc-950
            colorText: '#ffffff',
            colorTextSecondary: '#a1a1aa', // zinc-400
            colorInputBackground: '#18181b', // zinc-900
            colorInputText: '#ffffff',
            borderRadius: '0.5rem',
        },
        elements: {
            card: "bg-zinc-950 border border-white/10 shadow-xl",
            headerTitle: "text-white",
            headerSubtitle: "text-zinc-400",
            socialButtonsBlockButton: "bg-white/5 border-white/10 text-white hover:bg-white/10",
            socialButtonsBlockButtonText: "text-white",
            formFieldLabel: "text-zinc-300",
            formFieldInput: "bg-zinc-900 border-white/10 text-white focus:border-white/20",
            footerActionLink: "text-white hover:text-zinc-300",
            identityPreviewText: "text-white",
            identityPreviewEditButtonIcon: "text-white opacity-60 hover:opacity-100",
            formButtonPrimary: "bg-white text-black hover:bg-zinc-200",
            userButtonPopoverCard: "bg-zinc-950 border border-white/10",
            userButtonPopoverActionButton: "hover:bg-white/5",
            userButtonPopoverActionButtonIcon: "text-white",
            userButtonPopoverActionButtonText: "text-white",
            userButtonPopoverFooter: "hidden",
            modalContent: "bg-zinc-950 border border-white/10",
            modalHeader: "bg-zinc-950",
            profileSectionTitle: "text-white border-b border-white/10 pb-2",
            profileSectionPrimaryButton: "text-white hover:bg-white/5",
            profilePage: "bg-zinc-950",
            scrollBox: "bg-zinc-950",
            navbar: "bg-zinc-950 border-r border-white/10",
            navbarButton: "text-zinc-400 hover:text-white hover:bg-white/5",
            navbarButtonIcon: "text-zinc-400 group-hover:text-white",
            pageScrollBox: "bg-zinc-950",
            page: "bg-zinc-950",
        }
      }}
    >
      <html lang="en">
        <body className={`${outfit.className} antialiased`}>
          <SidebarProvider defaultOpen={false}>
            <AppSidebar />
            <main className="w-full">
              <SidebarTrigger className="relative z-10" />
              {children}
            </main>
          </SidebarProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
