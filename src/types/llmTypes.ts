export interface LlmPrompt {
  role: "user" | "assistant";
  content: string;
}

export interface LlmResponse {
  role: "user" | "assistant";
  content: string;
}
