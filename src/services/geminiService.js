const { GoogleGenerativeAI } = require("@google/generative-ai");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("❌ ERROR: Missing GEMINI_API_KEY");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

exports.generateRecipeContent = async (prompt) => {
  const result = await model.generateContent(prompt);
  return result.response.text();
};

exports.generateIngredientContent = async (prompt, imagePart) => {
  const result = await model.generateContent([prompt, imagePart]);
  return result.response.text();
}