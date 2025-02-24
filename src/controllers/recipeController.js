const { generateRecipeContent } = require("../services/geminiService");
const { cleanAIResponse } = require("../utils/parseResponse");

exports.generateRecipe = async (req, res) => {
  try {
    const { selectedIngredients, cuisine, userInputIngredients } = req.body;

    // Ensure required fields exist
    if (!selectedIngredients || !cuisine || !userInputIngredients) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const prompt = `You are an expert vegan chef and recipe generator...`; // Keep your existing prompt here
    const result = await generateRecipeContent(prompt);
    const cleanedJson = cleanAIResponse(result);

    const recipe = JSON.parse(cleanedJson);
    res.json({ recipe });
  } catch (error) {
    console.error("Error generating recipe:", error);
    res.status(500).json({ error: "Failed to generate recipe" });
  }
};
