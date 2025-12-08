"use client"

import * as React from "react"
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
        <SidebarGroup>
          <SidebarGroupLabel className="text-zinc-500 tracking-wider text-[10px] uppercase font-bold mt-2 mb-2">Platform</SidebarGroupLabel>
          <SidebarMenu>
            {navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                    asChild 
                    isActive={activeItem === item.title}
                    onClick={() => setActiveItem(item.title)}
                    className="bg-white text-black hover:bg-zinc-200 hover:text-black data-[active=true]:bg-zinc-100 data-[active=true]:text-black shadow-sm transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                    tooltip={item.title}
                >
                  <a href={item.url}>
                    <item.icon className="text-zinc-600 group-hover:text-black group-data-[active=true]:text-black transition-colors" />
                    <span className="font-medium">{item.title}</span>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-white/5 data-[state=open]:text-white hover:bg-white/5 hover:text-white transition-all"
                >
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-zinc-800 to-zinc-600 border border-white/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-white/80" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold text-zinc-200">Abhayanth</span>
                    <span className="truncate text-xs text-zinc-500">abhayanth@archon.ai</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-zinc-500 group-hover:text-zinc-300" />
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
                    <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                         <User className="w-4 h-4 text-zinc-400" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold text-white">Abhayanth</span>
                      <span className="truncate text-xs text-zinc-500">abhayanth@archon.ai</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
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
                <DropdownMenuItem className="focus:bg-destructive/10 focus:text-destructive text-zinc-400 cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail className="hover:bg-white/5" />
    </Sidebar>
  )
}
