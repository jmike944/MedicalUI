import type { Metadata, Viewport } from "next"
import { Geist_Mono, Google_Sans } from "next/font/google"

import { MotionProvider } from "@/components/motion-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import "./globals.css"

const googleSans = Google_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: {
    default: "Schedule · CareOps",
    template: "%s · CareOps",
  },
  description:
    "CareOps schedule for Juniper Home Health: today's visits, open shifts, and overtime at a glance.",
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full font-sans antialiased",
        googleSans.variable,
        geistMono.variable
      )}
    >
      <body className="min-h-full">
        <MotionProvider>
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        </MotionProvider>
        <Toaster theme="light" position="bottom-right" />
      </body>
    </html>
  )
}
