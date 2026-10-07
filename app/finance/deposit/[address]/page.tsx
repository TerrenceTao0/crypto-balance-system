import { notFound, redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { getDepositStatus } from "@/lib/crypto"
import Payment from "./Payment"

//

function secondsUntil(date: Date) {
    return Math.max(0, Math.round((date.getTime() - Date.now()) / 1000))
}

//

export default async function DepositPayment({ params }: { params: Promise<{ address: string }> }) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        redirect("/login")
    }


    const { address } = await params

    // Null when the deposit does not exist or belongs to someone else.
    const status = await getDepositStatus(address, session.user.id)

    if (status === null) {
        notFound()
    }


    const deposit = await prisma.crypto_deposit.findUniqueOrThrow({ where: { address } })

    return (
        <Payment
            address={deposit.address}
            amountUnits={deposit.amountUnits.toString()}
            expiresAt={deposit.expiresAt.getTime()}
            initialSecondsLeft={secondsUntil(deposit.expiresAt)}
            initialStatus={status}
        />
    )
}
