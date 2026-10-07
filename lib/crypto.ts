import { mnemonicToAccount } from "viem/accounts"
import { prisma } from "./db"
import { DEPOSIT_WINDOW_MINUTES } from "./constants"

//

function depositAccount(index: number) {
    return mnemonicToAccount(process.env.DEPOSIT_MNEMONIC!, { addressIndex: index })
}

//

export async function createDeposit(userId: string, amountUnits: bigint) {
    const counter = await prisma.deposit_counter.upsert({
        where: { id: "global" },
        update: { value: { increment: 1 } },
        create: { id: "global", value: 1, lastBlock: BigInt(0) },
    })


    const index = counter.value
    const address = depositAccount(index).address
    const expiresAt = new Date(Date.now() + DEPOSIT_WINDOW_MINUTES * 60 * 1000)

    await prisma.crypto_deposit.create({
        data: { 
            userId, 
            address, 
            index, 
            amountUnits, 
            expiresAt 
        },
    })


    return {
        address,
        amountUnits: amountUnits.toString(),
    }
}


export async function getDepositStatus(address: string, userId: string) {
    const deposit = await prisma.crypto_deposit.findUnique({ where: { address } })

    if (!deposit || deposit.userId !== userId) {
        return null
    }
    else if (deposit.status === "pending" && deposit.expiresAt < new Date()) {
        await prisma.crypto_deposit.update({ where: { address }, data: { status: "expired" } })

        return "expired"
    }


    return deposit.status
}
