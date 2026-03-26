import mongoose, { Schema, models } from "mongoose"

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },

    // future-proof
    role: {
      type: String,
      default: "user",
    },

    plan: {
      type: String,
      default: "basic",
    },

    favorites: [
      {
        type: Schema.Types.ObjectId,
        ref: "Supplier",
      },
    ],
  },
  { timestamps: true }
)

export default models.User || mongoose.model("User", UserSchema)