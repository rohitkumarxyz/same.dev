export const enhancePrompt = (prompt: string) => {
  return removeWhiteSpace(prompt);
};

const removeWhiteSpace = (prompt: string) => {
  return prompt.replace(/\s+/g, ' ').trim();
};

