import { connectDB } from "@/lib/db/connect"
import User from "@/lib/models/User"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return Response.json({ error: "Missing fields" }, { status: 400 })
    }

    await connectDB()

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return Response.json({ error: "User already exists" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
      email,
      password: hashedPassword,
    })

    return Response.json({ message: "User created", user })
  } catch (error: any) {
  console.error("REGISTER ERROR:", error) // 👈 IMPORTANT
  return Response.json({ error: error.message }, { status: 500 })
}
}