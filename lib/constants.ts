export const USDC_DECIMALS = 6
export const USDC_SCALE = 1_000_000n

export const MIN_AMOUNT_UNITS = 1_000_000n
export const DEPOSIT_WINDOW_MINUTES = 30

//

export function usdcToUnits(value: string): bigint {
    if (!/^\d+(\.\d{0,6})?$/.test(value)) {
        throw new Error("Invalid USDC amount")
    }

    const [whole, fraction = ""] = value.split(".")

    const fractionUnits = fraction.padEnd(6, "0")

    return (
        BigInt(whole) * USDC_SCALE +
        BigInt(fractionUnits || "0")
    )
}


export function unitsToUsdc(units: bigint | string): string {
    const value = typeof units === "string"
        ? BigInt(units)
        : units

    const whole = value / USDC_SCALE
    const fraction = value % USDC_SCALE

    const fractionText = fraction
        .toString()
        .padStart(6, "0")
        .replace(/0+$/, "")

    return fractionText
        ? `${whole}.${fractionText}`
        : whole.toString()
}

