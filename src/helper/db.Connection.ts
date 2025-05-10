import mongoose from "mongoose";
import { DATA_BASE_URI } from "../config/config";

export const connectToDataBase = () => {
  try {
    mongoose
      .connect(DATA_BASE_URI)
      .then(() => {
        console.log("Connected to MongoDB");
      })
      .catch((err) => {
        console.log(err);
      });
  } catch (error: any) {
    console.log(error?.messages);
  }
};
