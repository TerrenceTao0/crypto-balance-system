import { NextResponse } from  "next/server"
import { processDeposits } from "@/lib/crypto"

//

export async function GET(request: Request) {
    if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json(
            { error: "Unauthorized" }, 
            { status: 401 }
        )
    }


    return NextResponse.json({ credited: await processDeposits() })
}

