import { connectDB } from "@/lib/db/connect"
import User from "@/lib/models/User"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    await connectDB()

    const user = await User.findOne({ email })
    if (!user) {
      return Response.json({ error: "Invalid credentials" }, { status: 400 })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return Response.json({ error: "Invalid credentials" }, { status: 400 })
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    )

    return Response.json({ token, user })
  } catch (error) {
    return Response.json({ error: "Server error" }, { status: 500 })
  }
}