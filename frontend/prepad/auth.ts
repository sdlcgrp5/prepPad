import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Add user ID to token when user signs in
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      // Add user ID to session for compatibility with existing system
      if (session.user && token.id) {
        session.user.id = token.id as string
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Auto-create profile for Google users
      if (account?.provider === "google" && user.email) {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { profile: true }
          })
          
          // If user exists but has no profile, create one from Google data
          if (existingUser && !existingUser.profile && profile) {
            const googleProfile = profile as any
            await prisma.profile.create({
              data: {
                userId: existingUser.id,
                firstName: googleProfile.given_name || user.name?.split(' ')[0] || '',
                lastName: googleProfile.family_name || user.name?.split(' ').slice(1).join(' ') || '',
              }
            })
          }
        } catch (error) {
          console.error('Error creating profile for Google user:', error)
        }
      }
      return true
    },
    async redirect({ url, baseUrl }) {
      // Handle post-authentication routing with smart routing
      
      // If it's a relative URL or same origin, allow it
      if (url.startsWith('/') || url.startsWith(baseUrl)) {
        const finalUrl = url.startsWith(baseUrl) ? url : baseUrl + url;
        return finalUrl;
      }
      
      // For OAuth callbacks, default to resumeupload for profile setup
      return `${baseUrl}/resumeupload`;
    }
  },
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === "development",
})