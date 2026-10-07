"use client"

import { useEffect, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { DEPOSIT_WINDOW_MINUTES, unitsToUsdc } from "@/lib/constants"
import { AmountField, Panel, SuccessView } from "./ui"

//

type Deposit = { address: string, amountUnits: number }
type Status = "pending" | "confirmed" | "swept" | "expired"

const STATUS_LABELS: Record<Status, string> = {
    pending: "Waiting for transfer",
    confirmed: "Transfer detected, settling",
    swept: "Complete",
    expired: "Address expired",
}

//

export default function DepositView({ onDone }: { onDone: () => void }) {
    const [amountInput, setAmountInput] = useState("")
    const [deposit, setDeposit] = useState<Deposit | null>(null)
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    async function submit(event: React.SubmitEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)
        setError("")

        const response = await fetch(
            "/api/create-deposit", 
            {
                method: "POST",
                body: JSON.stringify({ amount: amountInput }),
            }
        )

        
        const data = await response.json().catch(() => ({}))

        if (response.ok) {
            setDeposit(data)
        }
        else {
            setError(data.error ?? "Failed to create deposit")
        }


        setLoading(false)
    }


    if (deposit) {
        return (
            <Payment
                deposit={deposit}
                onRetry={() => {
                    setDeposit(null)
                    setAmountInput("")
                }}
                onDone={onDone}
            />
        )
    }


    return (
        <Panel title="Deposit" onBack={onDone}>
            <form onSubmit={submit} className="flex flex-col gap-4">
                <AmountField value={amountInput} onChange={setAmountInput} />

                <p className="text-xs leading-relaxed text-muted">
                    You&apos;ll get a one-time address on Polygon Amoy. Send only USDC on that network.
                </p>

                {error && (
                    <p className="text-danger">
                        {error}
                    </p>
                )}

                <button type="submit" disabled={loading} className="btn btn-primary">
                    {loading ? "Creating address…" : "Get deposit address"}
                </button>
            </form>
        </Panel>
    )
}


function Payment(
{ 
    deposit, 
    onRetry, 
    onDone
}: { 
    deposit: Deposit, 
    onRetry: () => void, 
    onDone: () => void }
) {
    const [status, setStatus] = useState<Status>("pending")
    const [secondsLeft, setSecondsLeft] = useState(DEPOSIT_WINDOW_MINUTES * 60)

    const finished = status === "swept" || status === "expired"

    
    // Poll until the deposit settles or expires; the server decides when it has expired.
    useEffect(() => {
        if (finished) {
            return
        }


        const countdown = setInterval(() => setSecondsLeft(seconds => Math.max(0, seconds - 1)), 1000)

        const poll = setInterval(async () => {
            const response = await fetch(`/api/deposit-status/${deposit.address}`).catch(() => null)

            if (response?.ok) {
                setStatus((await response.json()).status)
            }
        }, 10000)


        return () => {
            clearInterval(countdown)
            clearInterval(poll)
        }
    }, [deposit.address, finished])


    if (status === "swept") {
        return (
            <SuccessView title="Deposit received" onDone={onDone}>
                Your balance has been credited.
            </SuccessView>
        )
    }


    const dot = status === "expired" ? "bg-danger" : status === "confirmed" ? "bg-accent" : "bg-warn animate-pulse"
    const timer = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`

    return (
        <Panel title="Send USDC" onBack={onDone}>
            <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                    <span className={`size-2 rounded-full ${dot}`} />
                    {STATUS_LABELS[status]}
                </span>

                {status === "pending" && (
                    <span className={`font-mono tabular-nums ${secondsLeft < 60 ? "text-danger" : "text-muted"}`}>
                        {timer}
                    </span>
                )}
            </div>

            <div className="mt-5 flex justify-center">
                <div className="rounded-lg bg-white p-3">
                    <QRCodeSVG value={deposit.address} size={148} />
                </div>
            </div>

            <div className="mt-5 flex flex-col gap-3">
                <CopyRow label="Address" value={deposit.address} />
                <CopyRow label="Amount" value={unitsToUsdc(String(deposit.amountUnits))} suffix=" USDC" />
            </div>

            {status === "expired" ? (
                <button onClick={onRetry} className="btn btn-secondary mt-5 w-full">
                    Start a new deposit
                </button>
            ) : (
                <p className="mt-5 text-xs leading-relaxed text-muted">
                    Send the exact amount on Polygon Amoy. This page updates on its own once the transfer settles.
                </p>
            )}
        </Panel>
    )
}


function CopyRow({ label, value, suffix = "" }: { label: string, value: string, suffix?: string }) {
    const [copied, setCopied] = useState(false)

    function copy() {
        navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }


    return (
        <div>
            <p className="label">
                {label}
            </p>

            <div className="mt-1.5 flex items-center gap-3 rounded-lg border border-line bg-bg px-3 py-2.5">
                <span className="min-w-0 flex-1 break-all font-mono text-[13px]">
                    {value}{suffix}
                </span>

                <button
                    onClick={copy}
                    className="shrink-0 cursor-pointer text-xs text-muted transition-colors hover:text-fg"
                >
                    {copied ? "Copied" : "Copy"}
                </button>
            </div>
        </div>
    )
}
