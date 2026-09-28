import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import AuthForm from "./AuthForm"

//

export default async function Home() {
    // A logged in user already has a balance to manage, so send them straight to it.
    const session = await getServerSession(authOptions)

    if (session?.user?.id) {
        redirect("/finance")
    }


    return <AuthForm mode="sign-up" />
}
