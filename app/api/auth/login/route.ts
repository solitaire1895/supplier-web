import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import User from "@/lib/models/User"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { message: "Missing fields" },
        { status: 400 }
      )
    }

    await connectDB()

    const user = await User.findOne({ email })

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      )
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      )
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    )

    return NextResponse.json({ token })

  } catch (error) {
    console.error("LOGIN ERROR:", error)
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    )
  }
}