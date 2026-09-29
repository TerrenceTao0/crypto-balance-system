import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createDeposit } from "@/lib/crypto"
import { MIN_AMOUNT, formatUsd } from "@/lib/constants"

//

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }


    const { amount } = await request.json()

    if (typeof amount !== "number" || !(amount >= MIN_AMOUNT)) {
        return NextResponse.json({ error: `Minimum deposit is ${formatUsd(MIN_AMOUNT)}` }, { status: 400 })
    }


    return NextResponse.json({ address: await createDeposit(session.user.id, amount), amount })
}
