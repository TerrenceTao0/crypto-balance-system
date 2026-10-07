import { MIN_AMOUNT_UNITS, unitsToUsdc } from "@/lib/constants"

//

export function Panel({
    title,
    onBack,
    children,
}: {
    title: string
    onBack: () => void
    children: React.ReactNode
}) {
    return (
        <div className="w-full max-w-md">
            <button
                onClick={onBack}
                className="
                    mb-4 inline-flex cursor-pointer items-center gap-1 text-muted
                    transition-colors hover:text-fg
                "
            >
                <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                    <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>

                Back
            </button>

            <h1 className="text-2xl font-semibold tracking-tight">
                {title}
            </h1>

            <div className="card mt-6 p-5">
                {children}
            </div>
        </div>
    )
}


export function SuccessView({
    title,
    children,
    onDone,
}: {
    title: string
    children: React.ReactNode
    onDone: () => void
}) {
    return (
        <div className="card my-auto w-full max-w-md p-6 text-center">
            <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-accent/15 text-accent">
                <svg viewBox="0 0 16 16" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                    <path d="m3.5 8.5 3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>

            <h1 className="mt-4 text-lg font-semibold">
                {title}
            </h1>

            <div className="mt-2 text-muted">
                {children}
            </div>

            <button onClick={onDone} className="btn btn-secondary mt-6 w-full">
                Back to balance
            </button>
        </div>
    )
}


export function AmountField({
    value,
    onChange,
    action,
}: {
    value: string
    onChange: (value: string) => void
    action?: React.ReactNode
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
                <label htmlFor="amount" className="label">
                    Amount
                </label>

                {action}
            </div>

            <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint">
                    $
                </span>

                <input
                    id="amount"
                    type="number"
                    inputMode="decimal"
                    min={unitsToUsdc(MIN_AMOUNT_UNITS)}
                    step="0.01"
                    placeholder="0.00"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="field pl-7 pr-14 tabular-nums"
                    required
                    autoFocus
                />

                <span className="
                    pointer-events-none absolute right-3 top-1/2 -translate-y-1/2
                    text-xs text-faint
                ">
                    USDC
                </span>
            </div>
        </div>
    )
}
