"use client"

import { useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { AmountField, Panel } from "./ui"

//

type Deposit = { address: string, amount: number }

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

        const response = await fetch("/api/create-deposit", {
            method: "POST",
            body: JSON.stringify({ amount: parseFloat(amountInput) }),
        })

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
        return <Payment deposit={deposit} onDone={onDone} />
    }


    return (
        <Panel title="Deposit" onBack={onDone}>
            <form onSubmit={submit} className="flex flex-col gap-4">
                <AmountField value={amountInput} onChange={setAmountInput} />

                <p className="text-xs leading-relaxed text-muted">
                    You&apos;ll get a one-time address on Polygon Amoy. Send only USDC on that network, anything else can&apos;t be recovered.
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


function Payment({ deposit, onDone }: { deposit: Deposit, onDone: () => void }) {
    return (
        <Panel title="Send USDC" onBack={onDone}>
            <div className="flex justify-center">
                <div className="rounded-lg bg-white p-3">
                    <QRCodeSVG value={deposit.address} size={148} />
                </div>
            </div>

            <div className="mt-5 flex flex-col gap-3">
                <CopyRow label="Address" value={deposit.address} />
                <CopyRow label="Amount" value={String(deposit.amount)} suffix=" USDC" />
            </div>

            <p className="mt-5 text-xs leading-relaxed text-muted">
                Send the exact amount on Polygon Amoy.
                Funds sent after the address expires have to be recovered manually.
            </p>
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
