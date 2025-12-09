"use client"

import * as React from "react"
import { useUser, useClerk, ClerkLoaded, ClerkLoading, SignOutButton, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs"

import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  User,
  Home,
  Search,
  Settings,
  ChevronsUpDown,
  LogOut,
  Sparkles
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"

// Define navigation items
const navMain = [
  {
    title: "Home",
    url: "#",
    icon: Home,
  },
  {
    title: "Explore",
    url: "#",
    icon: Search,
  },
  {
    title: "Capabilities",
    url: "#",
    icon: Sparkles,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [activeItem, setActiveItem] = React.useState("Home")
  const { user } = useUser()
  const { openUserProfile } = useClerk()

  return (
    <Sidebar 
        collapsible="icon" 
        {...props}
        className="bg-black border-r border-white/10 text-zinc-300"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-white/5 data-[state=open]:text-white hover:bg-white/5 hover:text-white transition-all duration-300"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-zinc-950 border border-zinc-800 text-white shadow-[0_0_15px_-3px_rgba(255,255,255,0.3)]">
                <Command className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-white tracking-wide">Archon</span>
                <span className="truncate text-xs text-zinc-500">System v2.4</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="group-data-[collapsible=icon]:p-0!">
          <SidebarGroupLabel className="text-zinc-500 tracking-wider text-[10px] uppercase font-bold mt-2 mb-2">Platform</SidebarGroupLabel>
          <SidebarMenu className="gap-3 px-2 group-data-[collapsible=icon]:px-0! group-data-[collapsible=icon]:items-center">
            {navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                    asChild 
                    isActive={activeItem === item.title}
                    onClick={() => setActiveItem(item.title)}
                    className="h-12 w-full justify-start gap-4 rounded-xl bg-white/5 text-zinc-400 hover:bg-white hover:text-black hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-[1.02] data-[active=true]:bg-white data-[active=true]:text-black data-[active=true]:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-300 ease-out border border-transparent hover:border-white/50 group-data-[collapsible=icon]:p-0! group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center"
                    tooltip={item.title}
                >
                  <a href={item.url} className="flex items-center gap-4 px-4 w-full group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
                    <item.icon className="size-5" />
                    <span className="font-semibold tracking-wide text-sm group-data-[collapsible=icon]:hidden">{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <ClerkLoading>
                <div className="flex items-center gap-3 p-2">
                    <div className="h-8 w-8 rounded-lg bg-zinc-800 animate-pulse" />
                    <div className="flex-1 space-y-2 group-data-[collapsible=icon]:hidden">
                        <div className="h-3 w-20 bg-zinc-800 rounded animate-pulse" />
                        <div className="h-2 w-16 bg-zinc-800 rounded animate-pulse" />
                    </div>
                </div>
            </ClerkLoading>
            <ClerkLoaded>
                <SignedOut>
                    <SignInButton mode="modal">
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-white/5 data-[state=open]:text-white hover:bg-white/5 hover:text-white transition-all"
                        >
                            <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                                <User className="w-4 h-4 text-zinc-400" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                                <span className="truncate font-semibold text-zinc-200">Sign In</span>
                            </div>
                        </SidebarMenuButton>
                    </SignInButton>
                </SignedOut>
                <SignedIn>
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                        size="lg"
                        className="data-[state=open]:bg-white/5 data-[state=open]:text-white hover:bg-white/5 hover:text-white transition-all"
                        >
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-zinc-800 to-zinc-600 border border-white/10 flex items-center justify-center overflow-hidden">
                            {user?.imageUrl ? (
                                <img src={user.imageUrl} alt={user.fullName || "User"} className="h-full w-full object-cover" />
                            ) : (
                                <User className="w-4 h-4 text-white/80" />
                            )}
                        </div>
                        <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                            <span className="truncate font-semibold text-zinc-200">{user?.fullName}</span>
                            <span className="truncate text-xs text-zinc-500">{user?.primaryEmailAddress?.emailAddress}</span>
                        </div>
                        <ChevronsUpDown className="ml-auto size-4 text-zinc-500 group-hover:text-zinc-300 group-data-[collapsible=icon]:hidden" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg bg-zinc-950 border-white/10 text-zinc-300 p-2"
                        side="bottom"
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                            <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden">
                                {user?.imageUrl ? (
                                    <img src={user.imageUrl} alt={user.fullName || "User"} className="h-full w-full object-cover" />
                                ) : (
                                    <User className="w-4 h-4 text-zinc-400" />
                                )}
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold text-white">{user?.fullName}</span>
                            <span className="truncate text-xs text-zinc-500">{user?.primaryEmailAddress?.emailAddress}</span>
                            </div>
                        </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuGroup>
                        <DropdownMenuItem 
                            className="focus:bg-white/10 focus:text-white cursor-pointer"
                            onClick={() => openUserProfile()}
                        >
                            <User className="mr-2 h-4 w-4" />
                            Account
                        </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuGroup>
                        <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer">
                            <Sparkles className="mr-2 h-4 w-4" />
                            Upgrade to Pro
                        </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuGroup>
                        <DropdownMenuItem className="focus:bg-white/10 focus:text-white cursor-pointer">
                            <Settings2 className="mr-2 h-4 w-4" />
                            Preferences
                        </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <SignOutButton>
                            <DropdownMenuItem className="focus:bg-destructive/10 focus:text-destructive text-zinc-400 cursor-pointer">
                                <LogOut className="mr-2 h-4 w-4" />
                                Log out
                            </DropdownMenuItem>
                        </SignOutButton>
                    </DropdownMenuContent>
                    </DropdownMenu>
                </SignedIn>
            </ClerkLoaded>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail className="hover:bg-white/5" />
    </Sidebar>
  )
}
