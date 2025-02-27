const { generateRecipeContent } = require("../services/geminiService");
const { cleanAIResponse } = require("../utils/parseResponse");

exports.generateRecipe = async (req, res) => {
  try {
    const { selectedIngredients, cuisine, userInputIngredients } = req.body;

    // Ensure required fields exist
    if (!selectedIngredients || !cuisine || !userInputIngredients) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const prompt = `You are an expert vegan chef and recipe generator. Your task is to create a vegan recipe based on the given ingredients, cuisine, and user-provided additional ingredients.

    ### Important Rules:
    1. The recipe must be **completely vegan** (no meat, dairy, eggs, or honey).
    2. Use the given **selected ingredients** and create a **cohesive and flavorful dish**.
    3. Check if the **userInputIngredients** contain plant-based foods. Ignore non-vegan items.
    4. Remove duplicates from **userInputIngredients** that are already in **selectedIngredients**.
    5. If a userInputIngredient is a **valid new plant-based food**, add it to the main ingredients list.
    6. If the cuisine is not a valid cuisine, use Mediterranean.
    7. Assign **realistic portion sizes** for each ingredient.
    8. Generate **additional complementary ingredients** (e.g., seasonings, spices, oils).
    9. Generate **realistic cooking instructions** in a structured format.
    10. Provide a **dish name**, **estimated cooking time**, and **number of servings**.
    11. The **output format must follow the exact structure given below in JavaScript**.
    12. Provide a **brief yet engaging description** of the dish, highlighting its key flavors, texture, and appeal.
    
    ---
    
    ### **Input Format:**
    {
      "selectedIngredients": ${selectedIngredients},
      "cuisine": ${cuisine},
      "userInputIngredients": ${userInputIngredients}
    }
    
    ---
    
    ### **Processing Instructions:**
    - **Verify userInputIngredients:** Remove non-plant-based ingredients.
    - **Check for duplicates:** If an item is already in selectedIngredients, do not add it again.
    - **Add valid new ingredients** to the main ingredients list.
    - **Assign portions** to each ingredient based on the type of dish and standard cooking practices.
    
    ---
    
    ### **Expected Output Format (MUST be exactly like this, including syntax and structure):**
    
    const recipe = {
      title: "{{dish name}}",
      description: "{{A short, engaging description of the dish, highlighting its key flavors, texture, and appeal}}",
      time: "{{estimated cooking time}}",
      servings: "{{number of servings}}",
      ingredients: [
        { "name": "{{ingredient 1}}", "portion": "{{portion size}}" },
        { "name": "{{ingredient 2}}", "portion": "{{portion size}}" },
        { "name": "{{ingredient 3}}", "portion": "{{portion size}}" }
      ],
      additionalIngredients: [
        "{{Generated additional ingredient 1}}",
        "{{Generated additional ingredient 2}}",
        "{{Generated additional ingredient 3}}",
        "{{Generated additional ingredient 4}}"
      ],
      instructions: [
        "{{Step 1: Generated cooking step}}",
        "{{Step 2: Generated cooking step}}",
        "{{Step 3: Generated cooking step}}",
        "{{Step 4: Generated cooking step}}",
        "{{Step 5: Generated cooking step}}"
      ]
    };
    
    ---
    
    ### **Response Requirements:**
    - **Title:** A creative and authentic name for the dish based on the cuisine and ingredients.
    - **Description:** A brief summary of the dish, including its taste, texture, and uniqueness.
    - **Time:** A realistic cooking time based on the complexity of the dish.
    - **Servings:** A reasonable portion size for the dish.
    - **Ingredients:** A list of **selectedIngredients** (including valid user-input ingredients) with assigned portions.
    - **Additional Ingredients:** Dynamically generated based on the cuisine (e.g., if it’s an Indian dish, suggest relevant spices).
    - **Instructions:** Clear, logical, and structured, guiding step-by-step from preparation to serving.
    - **Return a valid JSON response** that follows the structure below without trailing commas and comments.
    
    ---
    
    ### **Example AI Response (Based on Input Above):**
    
    const recipe = {
      title: "Middle Eastern Chickpea Stew",
      description: "A hearty and aromatic Middle Eastern-inspired chickpea stew, packed with rich flavors of cumin and smoked paprika, simmered in a tomato-based sauce with fresh spinach.",
      time: "35 minutes",
      servings: "4",
      cuisine: "Mediterranean",
      ingredients: [
        { "name": "chickpeas", "portion": "1 cup, cooked" },
        { "name": "tomatoes", "portion": "2 medium, diced" },
        { "name": "spinach", "portion": "2 cups, fresh" },
        { "name": "onion", "portion": "1 small, chopped" },
        { "name": "cumin", "portion": "1 teaspoon" }
      ],
      additionalIngredients: [
        "2 cloves garlic, minced",
        "1 teaspoon smoked paprika",
        "1 tablespoon olive oil",
        "Salt and pepper to taste"
      ],
      instructions: [
        "Wash and chop all vegetables as needed.",
        "Heat olive oil in a large pot over medium heat.",
        "Sauté onion and garlic until fragrant and translucent.",
        "Add chickpeas, tomatoes, spinach, cumin, and smoked paprika.",
        "Simmer for 20 minutes, season with salt and pepper, then serve hot."
      ]
    };
    
    ---
    
    ### **Final Instructions:**
    - **DO NOT** change the structure of the output.
    - **DO NOT** add extra fields.
    - **DO NOT** omit any required fields.
    - **Ensure** all additional ingredients and instructions are meaningful and relevant to the cuisine.
    
    Now generate the **mockRecipe** object using the given ingredients and cuisine.
    `
    const result = await generateRecipeContent(prompt);
    const cleanedJson = cleanAIResponse(result);

    const recipe = JSON.parse(cleanedJson);
    res.json({ recipe });
  } catch (error) {
    console.error("Error generating recipe:", error);
    res.status(500).json({ error: "Failed to generate recipe" });
  }
};
