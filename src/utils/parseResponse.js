exports.cleanAIResponse = (responseText) => {
  return responseText
    .replace(/```[\s\S]*?\n/, "") // Remove code block marker (e.g., ```javascript)
    .replace(/```/g, "") // Remove remaining triple backticks
    .replace(/const recipe = /, "") // Remove JS variable declaration
    .trim()
    .replace(/;$/, "") // Remove a trailing semicolon, if any
    .replace(/([{,])(\s*)(\w+):/g, '$1"$3":') // Ensure object keys are properly quoted
    .replace(/,\s*([\]}])/g, "$1"); // Remove trailing commas before closing brackets
};

exports.cleanAIResponseNested = (responseText) => {
  return responseText
    .replace(/```[\s\S]*?\n/, "") // Remove code block marker (e.g., ```javascript)
    .replace(/```/g, "") // Remove remaining triple backticks
    .replace(/const\s+\w+\s*=\s*/, "") // Remove variable declaration (e.g., "const recipe =" or "const mockRecipe =")
    .trim()
    .replace(/;$/, "") // Remove a trailing semicolon, if any
    .replace(/([{,])(\s*)(\w+):/g, '$1"$3":') // Ensure object keys are properly quoted
    .replace(/,\s*([\]}])/g, "$1"); // Remove trailing commas before closing brackets
};