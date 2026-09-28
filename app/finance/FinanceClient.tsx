"use client"

import { useSession } from "next-auth/react"
import { formatUsd } from "@/lib/constants"
import SignOutButton from "../components/SignOutButton"

//

export default function FinanceClient() {
    const { data: session } = useSession()

    const balance = session?.user?.balance ?? 0

    return (
        <div className="w-full max-w-md">
            <div className="card p-6">
                <p className="label">
                    Available balance
                </p>

                <p className="mt-2 flex items-baseline gap-2">
                    <span className="text-4xl font-semibold tracking-tight tabular-nums">
                        {formatUsd(balance)}
                    </span>

                    <span className="text-muted">
                        USDC
                    </span>
                </p>
            </div>

            <SignOutButton />
        </div>
    )
}
