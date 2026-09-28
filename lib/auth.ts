import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcrypt"
import { prisma } from "./db"

//

export const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,

    session: {
        strategy: "jwt",
    },

    pages: {
        signIn: "/login",
    },

    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials.password) {
                    return null
                }


                const user = await prisma.user.findUnique({ where: { name: credentials.username } })

                if (!user || !(await bcrypt.compare(credentials.password, user.password))) {
                    return null
                }


                return { id: user.id, name: user.name }
            },
        }),
    ],

    callbacks: {
        // Re-read the balance on every session fetch so deposits/withdrawals show up.
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
            }

            if (token.id) {
                const dbUser = await prisma.user.findUnique({ where: { id: token.id }, select: { balance: true } })
                token.balance = dbUser?.balance ?? 0
            }


            return token
        },

        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id
                session.user.balance = token.balance
            }


            return session
        },
    },
}
