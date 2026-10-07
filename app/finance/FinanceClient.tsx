"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { unitsToUsdc } from "@/lib/constants"
import SignOutButton from "../components/SignOutButton"
import DepositView from "./DepositView"

//

export default function FinanceClient() {
    const { data: session } = useSession()
    const [view, setView] = useState<"menu" | "deposit">("menu")
    const [balanceUnits, setBalanceUnits] = useState("0")

    useEffect(() => {
        async function getBalance() {
            try {
                const response = await fetch(
                    "/api/balance",
                    {
                        cache: "no-store",
                    }
                )


                if (!response.ok) {
                    return 
                }


                const data = await response.json()
                setBalanceUnits(data.balanceUnits)
            }
            catch {

            }
        }


        getBalance()
    }, [])


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
                        {unitsToUsdc(balanceUnits)}
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
