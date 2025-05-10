import { z } from "zod";

export const projectSource = z.object({
  projectId: z.string({ message: "projectId should be String." }),
  source: z.object({
    name: z.string({ message: "name should be String." }),
    type: z.enum(["file", "folder"], {
      message: "type should be file or folder.",
    }),
    content: z.string({ message: "content should be String." }).optional(),
    isBinary: z.boolean().optional(),
    children: z.array(z.any()).optional(),
  }),
});

export const validateGenerateApi = z.object({
 prompt:z.string({message:"prompt requed !"})
});

export const validateGetProjectApi = z.object({
  projectId: z.string({ message: "projectId should be String." }),
});

export const validateOrderProjectApi = z.object({
  subscriptionId: z.string({ message: "subscriptionId should be String." }),
});
