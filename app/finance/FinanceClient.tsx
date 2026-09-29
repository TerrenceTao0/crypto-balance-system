"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { formatUsd } from "@/lib/constants"
import SignOutButton from "../components/SignOutButton"
import DepositView from "./DepositView"

//

export default function FinanceClient() {
    const { data: session } = useSession()
    const [view, setView] = useState<"menu" | "deposit">("menu")

    const balance = session?.user?.balance ?? 0

    if (view === "deposit") {
        return <DepositView onDone={() => setView("menu")} />
    }


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

                <button onClick={() => setView("deposit")} className="btn btn-primary mt-6 w-full">
                    Deposit
                </button>
            </div>

            <SignOutButton />
        </div>
    )
}
