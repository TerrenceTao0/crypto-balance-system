import { mnemonicToAccount, privateKeyToAccount } from "viem/accounts"
import { prisma } from "./db"
import { DEPOSIT_WINDOW_MINUTES, MAX_BLOCK_RANGE, DEPOSIT_GRACE_MINUTES, MIN_AMOUNT_UNITS, SWEEP_CLAIM_MINUTES } from "./constants"
import { erc20Abi, parseAbiItem } from "viem"
import { publicClient, walletClient, USDC_ADDRESS } from "./chain"

const TRANSFER_EVENT = parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 value)")
const MAIN_WALLET_ADDRESS = process.env.MAIN_WALLET_ADDRESS as `0x${string}`

//

function depositAccount(index: number) {
    return mnemonicToAccount(process.env.DEPOSIT_MNEMONIC!, { addressIndex: index })
}


function mainAccount() {
    return privateKeyToAccount(`0x${process.env.WALLET_PRIVATE_KEY}`)
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


function creditDeposit(
    deposit: { 
        id: string, 
        userId: string 
    }, 
    value: bigint, 
    txHash: string, 
    blockNumber: bigint
) {
    return prisma.$transaction(async (tx) => {
        const { count } = await tx.crypto_deposit.updateMany({
            where: { id: deposit.id, status: { in: ["pending", "detected", "expired"] } },
            data: { status: "confirmed", amountUnits: value, txHash, blockNumber, confirmedAt: new Date() },
        })

        if (count === 0) {
            return false
        }

        await tx.user.update({ where: { id: deposit.userId }, data: { balanceUnits: { increment: value } } })

        return true
    })
}


export async function processDeposits() {
    const latest = await publicClient.getBlockNumber()
    const { number: finalized } = await publicClient.getBlock({ blockTag: "finalized" })

    const counter = await prisma.deposit_counter.upsert({
        where: { id: "global" },
        update: {},
        create: { id: "global", value: 0, lastBlock: finalized },
    })


    // Expired ones stay watched for 24 hours so a late transfer still gets credited.
    const watched = await prisma.crypto_deposit.findMany({
        where: {
            status: { in: ["pending", "detected", "expired"] },
            expiresAt: { gt: new Date(Date.now() - DEPOSIT_GRACE_MINUTES * 60 * 1000) },
        },
    })


    // Continue from the block after the last one scanned.
    let fromBlock = counter.lastBlock + 1n


    // First run: nothing scanned yet, so start MAX_BLOCK_RANGE blocks back.
    if (counter.lastBlock === 0n) {
        fromBlock = finalized - MAX_BLOCK_RANGE + 1n
    }


    // Scan past the finalized block so a transfer shows as detected before it can be credited.
    let toBlock = latest
    let credited = 0


    // An empty address filter would match every USDC transfer, so skip the scan instead.
    if (watched.length > 0 && fromBlock <= latest) {
        if (latest - fromBlock >= MAX_BLOCK_RANGE) {
            toBlock = fromBlock + MAX_BLOCK_RANGE - 1n
        }


        const logs = await publicClient.getLogs({
            address: USDC_ADDRESS,
            event: TRANSFER_EVENT,
            args: { to: watched.map(deposit => deposit.address as `0x${string}`) },
            fromBlock,
            toBlock,
            strict: true,
        })

        
        for (const log of logs) {
            const deposit = watched.find(deposit => deposit.address.toLowerCase() === log.args.to.toLowerCase())

            // Zero-value transfers are free to spam, so anything under the minimum is ignored.
            if (!deposit || log.args.value < MIN_AMOUNT_UNITS) {
                continue
            }


            // Not final yet: only mark it as detected, a later run credits it.
            if (log.blockNumber > finalized) {
                await prisma.crypto_deposit.updateMany({
                    where: { id: deposit.id, status: { in: ["pending", "detected"] } },
                    data: { status: "detected", txHash: log.transactionHash, blockNumber: log.blockNumber },
                })

                continue
            }


            if (await creditDeposit(deposit, log.args.value, log.transactionHash, log.blockNumber)) {
                credited++
            }
        }
    }


    // The cursor never passes the finalized block, so unfinalized blocks are scanned again next run.
    const lastBlock = toBlock < finalized ? toBlock : finalized


    // A detected transfer that is missing from its now-final block was reorged out.
    await prisma.crypto_deposit.updateMany({
        where: { status: "detected", blockNumber: { lte: lastBlock } },
        data: { status: "pending", txHash: null, blockNumber: null },
    })


    await prisma.crypto_deposit.updateMany({
        where: { status: "pending", expiresAt: { lt: new Date() } },
        data: { status: "expired" },
    })


    // Saved last: if a run dies before this, the same blocks are scanned again and creditDeposit skips what it already did.
    await prisma.deposit_counter.update({ 
        where: { id: "global" }, 
        data: { lastBlock } 
    })


    return credited
}


export async function sweepDeposits() {
    const deposits = await prisma.crypto_deposit.findMany({ 
        where: { status: "confirmed" } 
    })

    
    let swept = 0

    for (const deposit of deposits) {
        // Check if deposit is free and write it as claimed happen in a single step to avoid collisions. 
        // Crashes may occur so if sweep started more than SWEEP_CLAIM_MINUTES ago, but its status is not updated, assume it crashed and allow takeover.
        const { count } = await prisma.crypto_deposit.updateMany({
            where: {
                id: deposit.id,
                status: "confirmed",
                OR: [
                    { sweepStartedAt: null },
                    { sweepStartedAt: { lt: new Date(Date.now() - SWEEP_CLAIM_MINUTES * 60 * 1000) } },
                ],
            },
            data: { sweepStartedAt: new Date() },
        })


        if (count === 0) {
            continue
        }


        try {
            const account = depositAccount(deposit.index)

            const balance = await publicClient.readContract({
                address: USDC_ADDRESS,
                abi: erc20Abi,
                functionName: "balanceOf",
                args: [account.address],
            })


            // Nothing left means an earlier run already moved it but died before saving that.
            if (balance > 0n) {
                const transfer = {
                    address: USDC_ADDRESS,
                    abi: erc20Abi,
                    functionName: "transfer",
                    args: [MAIN_WALLET_ADDRESS, balance],
                } as const


                // Price the transfer at current gas fees, since a fixed top-up breaks when fees spike.
                const gas = await publicClient.estimateContractGas({ ...transfer, account: account.address })
                const { maxFeePerGas, maxPriorityFeePerGas } = await publicClient.estimateFeesPerGas()
                const gasCost = gas * maxFeePerGas
                const gasBalance = await publicClient.getBalance({ address: account.address })


                // The deposit address pays the gas for its own transfer, so it needs that much POL first.
                if (gasBalance < gasCost) {
                    const pol = gasCost - gasBalance
                    const hash = await walletClient(mainAccount()).sendTransaction({ to: account.address, value: pol })

                    await publicClient.waitForTransactionReceipt({ hash })
                }


                const hash = await walletClient(account).writeContract({ ...transfer, gas, maxFeePerGas, maxPriorityFeePerGas })
                const receipt = await publicClient.waitForTransactionReceipt({ hash })


                // A reverted transaction still has a receipt.
                if (receipt.status !== "success") {
                    throw new Error(`sweep transfer reverted: ${hash}`)
                }
            }


            await prisma.crypto_deposit.updateMany({
                where: { id: deposit.id, status: "confirmed" },
                data: { status: "swept", sweptAt: new Date() },
            })


            swept++
        }
        catch (error) {
            // It stays confirmed and is retried once the claim lapses.
            console.error(`[sweep] deposit ${deposit.id} failed:`, error)
        }
    }


    return swept
}

