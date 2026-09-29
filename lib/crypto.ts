import { mnemonicToAccount } from "viem/accounts"
import { prisma } from "./db"
import { DEPOSIT_WINDOW_MINUTES } from "./constants"

//

function depositAccount(index: number) {
    return mnemonicToAccount(process.env.DEPOSIT_MNEMONIC!, { addressIndex: index })
}

//

export async function createDeposit(userId: string, amount: number) {
    const counter = await prisma.deposit_counter.upsert({
        where: { id: "global" },
        update: { value: { increment: 1 } },
        create: { id: "global", value: 1, lastBlock: BigInt(0) },
    })


    const index = counter.value
    const address = depositAccount(index).address
    const expiresAt = new Date(Date.now() + DEPOSIT_WINDOW_MINUTES * 60 * 1000)

    await prisma.crypto_deposit.create({
        data: { userId, address, index, amountUsdc: amount, expiresAt },
    })


    return address
}
