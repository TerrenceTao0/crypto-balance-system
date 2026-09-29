export const MIN_AMOUNT = 1
export const DEPOSIT_WINDOW_MINUTES = 20

//

export function formatUsd(amount: number) {
    return amount.toLocaleString("en-US", { style: "currency", currency: "USD" })
}
