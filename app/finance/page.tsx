import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import FinanceClient from "./FinanceClient"

//

export default async function Finance() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        redirect("/login")
    }


    return <FinanceClient />
}
