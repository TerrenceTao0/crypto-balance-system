import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import WithdrawForm from "./WithdrawForm"

//

export default async function Withdraw() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        redirect("/login")
    }


    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { balanceUnits: true },
    })

    return <WithdrawForm balanceUnits={(user?.balanceUnits ?? 0n).toString()} />
}
