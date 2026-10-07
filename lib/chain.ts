import { createPublicClient, createWalletClient, http, type Account } from "viem"
import { polygon } from "viem/chains"

//

// Kept next to the chain so the network and its USDC contract can never be mismatched.
export const USDC_ADDRESS = "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359"

export const publicClient = createPublicClient({
    chain: polygon,
    transport: http(
        process.env.POLYGON_RPC_URL!
    ),
})


export function walletClient(account: Account) {
    return createWalletClient({ account, chain: polygon, transport: http(process.env.POLYGON_RPC_URL!) })
}
