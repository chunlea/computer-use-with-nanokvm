"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useChat } from "@/app/chat-provider"

export default function TopNavBar() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { takeScreenshot } = useChat()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="flex items-center justify-between p-4">
      <div className="font-bold text-xl flex gap-2 items-center">
        <Image
          src="/wordmark.svg"
          alt="Company Wordmark"
          width={112}
          height={20}
          className="dark:hidden"
        />
        <Image
          src="/wordmark-dark.svg"
          alt="Company Wordmark"
          width={112}
          height={20}
          className="dark:block hidden"
        />
        <h1>Computer use with NanoKVM</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => {
            const screenshot = takeScreenshot()
            if (screenshot) {
              console.log(screenshot)
            }
          }}
        >
          Take Screenshot
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem
              onCheckedChange={() => setTheme("light")}
              checked={theme === "light"}
            >
              Light
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              onCheckedChange={() => setTheme("dark")}
              checked={theme === "dark"}
            >
              Dark
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              onCheckedChange={() => setTheme("system")}
              checked={theme === "system"}
            >
              System
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
