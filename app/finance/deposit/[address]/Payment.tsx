"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import { unitsToUsdc } from "@/lib/constants"
import { Panel, SuccessView } from "../../ui"

//

type Status = "pending" | "detected" | "confirmed" | "swept" | "expired"

const STATUS_LABELS = {
    pending: "Waiting for transfer",
    detected: "Transfer detected, waiting for confirmation",
    expired: "Address expired",
}

//

export default function Payment(
{
    address,
    amountUnits,
    expiresAt,
    initialSecondsLeft,
    initialStatus,
}: {
    address: string,
    amountUnits: string,
    expiresAt: number,
    initialSecondsLeft: number,
    initialStatus: Status }
) {
    const router = useRouter()

    const [status, setStatus] = useState<Status>(initialStatus)
    const [secondsLeft, setSecondsLeft] = useState(initialSecondsLeft)

    // Sweeping is internal, so for the user a deposit is done once it is credited.
    const credited = status === "confirmed" || status === "swept"
    const finished = credited || status === "expired"


    // Poll until the deposit settles or expires; the server decides when it has expired.
    useEffect(() => {
        if (finished) {
            return
        }


        // Counted from the real expiry, so the timer stays right after a reload or a backgrounded tab.
        const countdown = setInterval(() => setSecondsLeft(Math.max(0, Math.round((expiresAt - Date.now()) / 1000))), 1000)

        const poll = setInterval(async () => {
            const response = await fetch(`/api/deposit-status/${address}`).catch(() => null)

            if (response?.ok) {
                setStatus((await response.json()).status)
            }
        }, 1000)


        return () => {
            clearInterval(countdown)
            clearInterval(poll)
        }
    }, [address, expiresAt, finished])


    if (credited) {
        return (
            <SuccessView title="Deposit received" onDone={() => router.push("/finance")}>
                Your balance has been credited.
            </SuccessView>
        )
    }


    const dot = status === "expired" ? "bg-danger" : status === "detected" ? "bg-accent" : "bg-warn animate-pulse"
    const timer = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`

    return (
        <Panel title="Send USDC" onBack={() => router.push("/finance")}>
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
                    <QRCodeSVG value={address} size={148} />
                </div>
            </div>

            <div className="mt-5 flex flex-col gap-3">
                <CopyRow label="Address" value={address} />
                <CopyRow label="Amount" value={unitsToUsdc(amountUnits)} suffix=" USDC" />
            </div>

            {status === "expired" ? (
                <button onClick={() => router.push("/finance/deposit")} className="btn btn-secondary mt-5 w-full">
                    Start a new deposit
                </button>
            ) : (
                <p className="mt-5 text-xs leading-relaxed text-muted">
                    Send the exact amount on Polygon. This page updates on its own once the transfer settles.
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
