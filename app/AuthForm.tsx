"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

//

const MODES = {
    "login": {
        title: "Log in",
        subtitle: "Welcome back.",
        passwordAutoComplete: "current-password",
        footer: { text: "No account?", href: "/", link: "Sign up" },
    },

    "sign-up": {
        title: "Create account",
        subtitle: "Usernames must be between 3-20 letters.",
        passwordAutoComplete: "new-password",
        footer: { text: "Already have an account?", href: "/login", link: "Log in" },
    },
}

//

export default function AuthForm(
    { mode }
    : 
    { mode: keyof typeof MODES }
) {
    const router = useRouter()

    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const { title, subtitle, passwordAutoComplete, footer } = MODES[mode]

    async function submit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault()

        const form = new FormData(event.currentTarget)
        const username = String(form.get("username"))
        const password = String(form.get("password"))

        setLoading(true)
        setError("")

        if (mode === "login") {
            try {
                const result = await signIn(
                    "credentials", 
                    { 
                        username, 
                        password, 
                        redirect: false 
                    }
                )


                if (result?.ok) {
                    router.push("/finance")
                    router.refresh()

                    return
                }


                setError("Invalid username or password")
            }
            catch {
                setError("Network error occured")
            }
        }
        else {
            try {
                const response = await fetch(
                    "/api/sign-up", 
                    { 
                        method: "POST", 
                        headers: { 
                            "Content-Type": "application/json" 
                        },
                        body: JSON.stringify(
                            { 
                                username, 
                                password 
                            }
                        ) 
                    }
                )


                if (response.ok) {
                    router.push("/login")

                    return
                }


                const data = await response.json().catch(() => ({}))
                setError(data.error ?? "Sign up failed")
            }
            catch {
                setError("Network error occured")
            }
        }


        setLoading(false)
    }


    return (
        <div className="w-full max-w-sm">
            <h1 className="text-2xl font-semibold tracking-tight">
                {title}
            </h1>

            <p className="mt-1 text-muted">
                {subtitle}
            </p>

            <form onSubmit={submit} className="card mt-6 flex flex-col gap-4 p-5">
                <label className="flex flex-col gap-1.5">
                    <span className="label">
                        Username
                    </span>

                    <input
                        name="username"
                        className="field"
                        autoComplete="username"
                        required
                        autoFocus
                    />
                </label>

                <label className="flex flex-col gap-1.5">
                    <span className="label">
                        Password
                    </span>

                    <input
                        name="password"
                        type="password"
                        className="field"
                        autoComplete={passwordAutoComplete}
                        required
                    />
                </label>

                {error && (
                    <p className="text-danger">
                        {error}
                    </p>
                )}

                <button type="submit" disabled={loading} className="btn btn-primary mt-1">
                    {loading ? "..." : title}
                </button>
            </form>

            <p className="mt-4 text-center text-muted">
                {footer.text}{" "}

                <Link href={footer.href} className="text-fg underline-offset-4 hover:underline">
                    {footer.link}
                </Link>
            </p>
        </div>
    )
}
