exports.cleanAIResponse = (responseText) => {
  return responseText
    .replace(/```[\s\S]*?\n/, "") // Remove ```javascript or similar
    .replace(/```/g, "") // Remove remaining ```
    .replace(/const recipe = /, "") // Remove JS variable declaration
    .trim()
    .replace(/([{,])(\s*)(\w+):/g, '$1"$3":') // Ensure object keys are properly quoted
    .replace(/,\s*([\]}])/g, "$1"); // Remove trailing commas before closing brackets
};
