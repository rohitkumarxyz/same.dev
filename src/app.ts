import express, { Request, Response } from "express";
const app = express();
import cors from "cors";
import dotenv from "dotenv";
import { getLlmResponse, streamLlmResponse } from "./helper/ai";
import { getSystemPrompt, systemPrompts } from "./prompts/allprompts";
import { basePrompt as reactBasePrompt } from "./default/react";
import { basePrompt as nodeBasePrompt } from "./default/node";
import { WORK_DIR } from "./prompts/constants";
import { connectToDataBase } from "./helper/db.Connection";
import { SourceCode } from "./schema/source";
import "./passport";
import jwt from "jsonwebtoken";
import {
  projectSource,
  validateGenerateApi,
  validateOrderProjectApi,
} from "./validation/api.validation";
import Razorpay from "razorpay";
import { RAZORPAY_ID, RAZORPAY_SECRET_KEY } from "./config/config";
import { Subscription } from "./schema/subscription";
import { User } from "./schema/user";
import passport from "passport";
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
dotenv.config();
connectToDataBase();


let razorpayInstance = new Razorpay({
  key_id: RAZORPAY_ID,
  key_secret: RAZORPAY_SECRET_KEY,
});

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  async (req: any, res: any) => {
    try {
      const user = req.user;

      // Generate JWT
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET || "your_jwt_secret",
        { expiresIn: "1h" }
      );

      res.status(200).json({
        status: true,
        message: "Login successful",
        token,
      });
    } catch (error) {
      console.error("Error during Google login callback:", error);
      res.status(500).json({
        status: false,
        message: "An error occurred during login",
      });
    }
  }
);

app.post("/template", async (req: Request, res: Response): Promise<any> => {
  const validation = validateGenerateApi.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      status: false,
      message: "Invalid request body",
    });
  }
  const systemPrompt = systemPrompts.checkProjectType;
  const { prompt } = validation.data;

  const response = await getLlmResponse(prompt, {}, systemPrompt);
  if (!response) {
    return res.status(500).json({
      status: false,
      message: "Error generating response",
    });
  }
  if (response === "react") {
    return res.status(200).json({
      success: true,
      baseStructure: reactBasePrompt,
      prompts: [
        `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
      ],
    });
  }

  if (response === "node") {
    return res.status(200).json({
      success: true,
      baseStructure: nodeBasePrompt,
      prompts: [nodeBasePrompt],
    });
  }

  return res.status(200).json({
    success: false,
    message: "We currently only support react and node projects",
  });
});

app.post("/generate", async (req: Request, res: Response): Promise<any> => {
  const validation = validateGenerateApi.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      status: false,
      message: "Invalid request body",
    });
  }

  const { prompt } = validation.data;
  const systemPrompt = getSystemPrompt(WORK_DIR);

  let response: any;

  try {
    response = await streamLlmResponse(8000, prompt, {}, systemPrompt);
    res.setHeader("Content-Type", "text/plain");
    for await (const text of response?.textStream) {
      res.write(text);
    }
  } catch (err: any) {
    console.error("Stream error:", err);
    res.write("Error: " + err.message);
  } finally {
    res.end();
  }
});

app.post("/source", async (req: Request, res: Response): Promise<any> => {
  // const validation = projectSource.safeParse(req.body);

  // if (!validation.success) {
  //   return res.status(400).json({
  //     status: false,
  //     message: "Invalid request body",
  //   });
  // }

  const { source, projectId } = req.body;

  await SourceCode.create({
    projectName: projectId,
    files: source,
  });

  return res.status(200).json({
    status: true,
    message: "Successfully saved",
  });
});

app.get(
  "/source/:projectId",
  async (req: Request, res: Response): Promise<any> => {
    const validation = projectSource.safeParse(req.params);
    if (!validation.success) {
      return res.status(400).json({
        status: false,
        message: "Invalid request body",
      });
    }
    const { projectId } = validation.data;
    const project = await SourceCode.findOne({ projectName: projectId });
    if (!project) {
      return res.status(404).json({
        status: false,
        message: "Project not found",
      });
    }
    return res.status(200).json({
      status: true,
      data: project.files,
    });
  }
);

app.get("/subscription", async (req: Request, res: Response): Promise<any> => {
  try {
    const subscriptions = await Subscription.find();
    if (!subscriptions) {
      return res.status(404).json({
        status: false,
        message: "No subscriptions found"
      })
    }
    return res.status(200).json({
      status: true,
      data: subscriptions
    })

  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "An error occurred while fetching subscriptions"
    })
  }
})

app.post("/subscription", async (req: Request, res: Response): Promise<any> => {
  try {
    const { planTitle, plan, price, benefits } = req.body;
    const subscription = new Subscription({
      planTitle,
      plan,
      price,
      benefits,
    });
    await subscription.save();
    return res.status(201).json({
      status: true,
      message: "Subscription created successfully",
      data: subscription,
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred while creating the subscription.",
    });
  }
});

app.post("/order", async (req: Request, res: Response): Promise<any> => {
  try {
    const validation = validateOrderProjectApi.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        status: false,
        message: "Invalid request body",
      });
    }

    const { subscriptionId } = validation.data;

    const subscription = await Subscription.findOne({ _id: subscriptionId });

    if (!subscription) {
      return res.status(404).json({
        status: false,
        message: "Subscription not found",
      });
    }

    const { price } = subscription;
    const currency = "INR";
    const options = {
      amount: price * 100,
      currency: currency,
      payment_capture: 1,
      notes: {
        planTitle: subscription.planTitle,
        plan: subscription.plan,
        email: "rohitsharma001914@gmail.com"
      },

    };

    const order = await razorpayInstance.orders.create(options);
    return res.status(200).json({
      status: true,
      data: order.id,
    });
  } catch (error: any) {
    console.error("Error while creating order:", error.message);
    return res.status(500).json({
      status: false,
      message: "An error occurred while processing the subscription.",
    });
  }
});

app.post("/create-user", async (req: Request, res: Response): Promise<any> => {
  const { name, email, googleId } = req.body;
  if (!name || !email || !googleId) {
    return res.status(400).json({
      status: false,
      message: "Name, email, and googleId are required",
    });
  }
  const user = await User.findOne({ email });
  if (user) {
    return res.status(200).json({
      status: true,
      message: "User already exists",
      data: user,
    });
  }
  const newUser = await User.create({
    name,
    email,
    googleId,
  });
  return res.status(201).json({
    status: true,
    message: "User created successfully",
    data: newUser,
  });

})

app.get("/user/:email", async (req: Request, res: Response): Promise<any> => {
  const { email } = req.params;
  if (!email) {
    return res.status(400).json({
      status: false,
      message: "Email is required",
    });
  }
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      status: false,
      message: "User not found",
    });
  }
  return res.status(200).json({
    status: true,
    data: user,
  });
});




export default app;
