import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

//

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
})

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
})

//

export default function RootLayout({ children }: LayoutProps<"/">) {
    return (
        <html
            lang="en"
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
            <body className="min-h-full flex flex-col">
                <main className="flex flex-1 flex-col items-center px-4 py-12 sm:py-20">
                    {children}
                </main>
            </body>
        </html>
    )
}
