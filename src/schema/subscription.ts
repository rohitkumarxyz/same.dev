import { Schema, model } from "mongoose";

const SubscriptionSchema = new Schema(
  {
    planTitle: {
      type: String,
      required: true,
    },
    plan: {
      type: String,
      enum: ["monthly"],
      default: "monthly",
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    benefits: {
      type: [String], 
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Subscription = model("Subscription", SubscriptionSchema);