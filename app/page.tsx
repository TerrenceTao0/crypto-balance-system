import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import AuthForm from "./AuthForm"

//

export default async function Home() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return <AuthForm mode="sign-up" />
    }


    return (
        <div className="w-full max-w-sm">
            <h1 className="text-2xl font-semibold tracking-tight">
                Welcome, {session.user.name}
            </h1>

            <p className="mt-1 text-muted">
                You are logged in.
            </p>
        </div>
    )
}
