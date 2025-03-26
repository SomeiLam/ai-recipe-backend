const { generateRecipeContent, generateIngredientContent } = require("../services/geminiService");
const { cleanAIResponseNested } = require("../utils/parseResponse");

exports.getIngredientsFromImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  console.log('file', req.file)
  if (req.file.size > 10 * 1024 * 1024) { // 10MB check
    throw new Error("File size exceeds limit");
  }

  const allowedLanguages = ['English', '中文', '日本語'];
  const language =
    req.body.language && allowedLanguages.includes(req.body.language)
      ? req.body.language
      : 'English';

  const base64Data = req.file.buffer.toString("base64");

  const prompt = `You are an AI assistant specialized in food ingredients recognition.
    Analyze the attached image and identify all visible food ingredients.
    For each ingredient, return an object with the following properties:
    - "id": a unique string identifier for the ingredient.
    - "name": the name of the ingredient in ${language}.
    - "nutrients": an optional object containing numeric values for "calories", "protein", "carbs", and "fat". All nutrient values should be provided per 100g serving.
    - "selected": always return true.
    - "fromImage": always return true.

    Return all output in ${language}.
    Ensure that the JSON output is a flat array of these objects. Remove any duplicate ingredients. If no food ingredients are found, return an empty JSON array. Do not return any text if no food is identified`;

  try {
    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: req.file.mimetype,
      },
    };

    const rawResponseText = await generateIngredientContent(prompt, imagePart);
    console.log('rawResponseText', rawResponseText);

    let cleanedResponse = rawResponseText.trim();

    // Remove code block formatting if present.
    if (cleanedResponse.startsWith("```")) {
      cleanedResponse = cleanedResponse
        .replace(/^```[a-z]*\n/, "")
        .replace(/```$/, "")
        .trim();
    }

    const codeBlockMatch = cleanedResponse.match(/```json([\s\S]*?)```/);
    if (codeBlockMatch) {
      cleanedResponse = codeBlockMatch[1].trim();
    } else {
      const jsonStartIndex = cleanedResponse.search(/[\[{]/);
      if (jsonStartIndex !== -1) {
        cleanedResponse = cleanedResponse.slice(jsonStartIndex);
      }
    }
    console.log('cleanedResponse', cleanedResponse)
    let ingredients;
    try {
      ingredients = JSON.parse(cleanedResponse);
    } catch (jsonError) {
      console.error("JSON parsing error:", jsonError, "Response:", cleanedResponse);
      return res.status(400).json({
        error: "Received an unexpected response format. Please try again with a different image.",
      });
    }

    return res.status(200).json(ingredients);
  } catch (error) {
    console.error("Error generating ingredients from image:", error);
    return res.status(500).json({ error: "Failed to generate ingredients" });
  }
};

exports.generateRecipe = async (req, res) => {
  try {
    const { ingredients, preferences, language } = req.body;

    if (!ingredients || !preferences) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const prompt = `You are an expert chef and recipe generator. Your task is to generate three distinct recipes based on the provided leftover ingredients, user preferences, and desired output language. All textual output—including dish names, descriptions, ingredient names, instructions, and all property values—must be fully in the provided language.

Each recipe must strictly reflect the provided cuisine if one is given and it is not "any". If the provided cuisine is "any" or is missing/invalid, then do not apply any specific culinary tradition and set the cuisine to "none".

### Important Rules:
1. Use the given **ingredients** and create three distinct, cohesive, and flavorful dishes. The given **ingredients** **must** be the main ingredients of the dish.
2. Check if each item in **ingredients** is a valid food; ignore any invalid items.
3. Remove duplicates from the **ingredients**.
4. If an ingredient is valid and new, add it to the main ingredients list.
5. Use the provided cuisine exactly as given:
   - If the cuisine is a specific valid value (e.g., "chinese"), every recipe must strictly reflect that style using appropriate ingredients, seasonings, techniques, and flavor profiles (for example, include soy sauce, ginger, garlic, scallions, rice vinegar, sesame oil, etc.) and set the output "cuisine" field to that value.
   - If the cuisine is "any" or is missing/invalid, do not enforce any specific culinary tradition and set the output "cuisine" field to "none".
6. Always return servings as "1".
7. Assign realistic portion sizes for each ingredient.
8. Generate additional complementary ingredients (such as seasonings, spices, and oils) that are specific to the provided cuisine and preferences; if no specific cuisine is applied, generate generic and versatile ingredients.
9. Generate clear and realistic step-by-step cooking instructions.
10. Provide a creative dish name and estimated cooking time.
11. Even if the spice level is above 0, the dish does not have to be overly spicy; use it only as a guideline to adjust spice intensity.
12. If the spiceLevel is higher than 0, ensure that at least one of the generated recipes is not spicy – its preference array should not include "Spicy", and its ingredients and instructions should reflect a non-spicy variant. If spiceLevel is 0, none of the generated recipes should be spicy.
13. All textual output—including dish names, descriptions, ingredient names, instructions, and all property values—must be entirely in the provided target language. Disregard the native language of the cuisine completely. For example, if the target language is Japanese, every word in the recipe must be in Japanese, even if the cuisine is Chinese.
14. Each recipe must include the following fields:
    - **id:** a unique id for the recipe.
    - **cuisine:** the provided cuisine name if specified and not "any"; otherwise "none". Translate the cuisine name into the target language. For example, if the cuisine is 'chinese' and the target language is Japanese, set the cuisine field to '中華料理' if that is the appropriate Japanese term.
    - **preference:** an array of strings containing only the applicable preferences for the recipe. Possible values are: "Traditional", "Quick cook", "Beginner friendly", "Microwave only", and "Spicy". Include a value only if the corresponding preference is true (for spice, include "Spicy" only if the recipe is intended to be spicy).
    - **title:** a creative and authentic dish name inspired by the provided cuisine (if applicable) and ingredients.
    - **description:** a brief yet engaging description of the dish, highlighting its key flavors, textures, and appeal.
    - **time:** a realistic cooking time based on the dish's complexity.
    - **servings:** always "1".
    - **calories:** estimated calories of the dish per 1 person.
    - **ingredients:** a list of valid ingredients. **For each ingredient, separate the numeric portion and the unit into two fields.** For example:
      - { "name": "{{ingredient 1}}", "portion": "{{portion size}}", "unit": "{{unit}}" }
      - { "name": "rice", "portion": "100", "unit": "g" }
    - **additionalIngredients:** complementary ingredients generated based on the provided cuisine and preferences. For each additional ingredient, separate the numeric portion and the unit into two fields.
      Important for Japanese output:
      - When generating the Japanese additionalIngredients, if the measurement includes Japanese units like "大さじ" or "小さじ" (or any similar measurement terms), make sure to split the numeric value from the unit.
      - Do not output combined strings like "大さじ1" or "小さじ1/2". Instead, separate them into "portion": "1" and "unit": "大さじ", or "portion": "1/2" and "unit": "小さじ", respectively.
    - **instructions:** clear, logical, and structured step-by-step cooking directions.
15. Return three different recipes in a JSON object with keys "0", "1", and "2". Each recipe must include a unique id.
16. Add emojis to title and inside ingredients name and instructions if possible

---

### Input Format:
{
  "ingredients": ${ingredients},
  "preferences": {
    traditional: ${preferences.traditional},
    quickCook: ${preferences.quickCook},
    beginner: ${preferences.beginner},
    microwaveOnly: ${preferences.microwaveOnly},
    spiceLevel: ${preferences.spiceLevel},
    cuisine: ${preferences.cuisine},
    customCuisine: ${preferences.customCuisine}
  },
  "language": ${language}
}

---

### Processing Instructions:
- Verify ingredients by removing any items that are not valid foods.
- Adapt each recipe to reflect any specific requirements (traditional, quick-cook, beginner-friendly, or microwave-only) as specified in the preferences.
- Use the spiceLevel preference (0 to 100) as a guideline to adjust spice intensity.
- Use cuisine:
  - If the provided cuisine is a specific valid value (e.g., "chinese"), strictly base all recipes on that cuisine—using typical ingredients, seasonings, cooking methods, and flavor profiles—and set the output "cuisine" field to that value.
  - If the provided cuisine is "any" or is missing/invalid, do not apply a specific culinary tradition and set the output "cuisine" field to "none".
- Remove duplicate ingredients.
- Generate the recipe JSON as specified.

---

### Expected Output Format (MUST be exactly like this, including syntax and structure):

{
  0: {
    id: "{{unique id}}",
    cuisine: "{{cuisine name in provided language, if no specified put 'none'}}",
    preference: [
      "{{applicable preference 1}}",
      "{{applicable preference 2}}",
      "... (only include preferences that are true for this recipe)"
    ],
    title: "{{dish name in provided language}}",
    description: "{{a short, engaging description of the dish, highlighting its key flavors, texture, and appeal in provided language}}",
    time: "{{estimated cooking time}}",
    servings: "1",
    calories: "{{calories of the dish per 1 person}}",
    ingredients: [
      { "name": "{{ingredient 1 in provided language}}", "portion": "{{portion size}}", "unit": "{{unit in provided language}}" },
      { "name": "{{ingredient 2 in provided language}}", "portion": "{{portion size}}", "unit": "{{unit in provided language}}" },
      { "name": "{{ingredient 3 in provided language}}", "portion": "{{portion size}}", "unit": "{{unit in provided language}}" }
    ],
    additionalIngredients: [
      { "name": "{{additional ingredient 1 in provided language}}", "portion": "{{portion size in provided language}}", "unit": "{{unit in provided language}}" },
      { "name": "{{additional ingredient 2 in provided language}}", "portion": "{{portion size in provided language}}", "unit": "{{unit in provided language}}" },
      { "name": "{{additional ingredient 3 in provided language}}", "portion": "{{portion size in provided language}}", "unit": "{{unit in provided language}}" }
    ],
    instructions: [
      "{{step 1: generated cooking step in provided language}}",
      "{{step 2: generated cooking step in provided language}}",
      "{{step 3: generated cooking step in provided language}}",
      "{{step 4: generated cooking step in provided language}}",
      "{{step 5: generated cooking step in provided language}}"
    ]
  },
  1: {
    id: "{{unique id}}",
    cuisine: "{{cuisine name in provided language, if no specified put 'none'}}",
    preference: [
      "{{applicable preference 1}}",
      "{{applicable preference 2}}",
      "... (only include preferences that are true for this recipe)"
    ],
    title: "{{dish name in provided language}}",
    description: "{{a short, engaging description of the dish, highlighting its key flavors, texture, and appeal in provided language}}",
    time: "{{estimated cooking time}}",
    servings: "1",
    calories: "{{calories of the dish per 1 person}}",
    ingredients: [
      { "name": "{{ingredient 1 in provided language}}", "portion": "{{portion size}}", "unit": "{{unit in provided language}}" },
      { "name": "{{ingredient 2 in provided language}}", "portion": "{{portion size}}", "unit": "{{unit in provided language}}" },
      { "name": "{{ingredient 3 in provided language}}", "portion": "{{portion size}}", "unit": "{{unit in provided language}}" }
    ],
    additionalIngredients: [
      { "name": "{{additional ingredient 1 in provided language}}", "portion": "{{portion size in provided language}}", "unit": "{{unit in provided language}}" },
      { "name": "{{additional ingredient 2 in provided language}}", "portion": "{{portion size in provided language}}", "unit": "{{unit in provided language}}" },
      { "name": "{{additional ingredient 3 in provided language}}", "portion": "{{portion size in provided language}}", "unit": "{{unit in provided language}}" }
    ],
    instructions: [
      "{{step 1: generated cooking step in provided language}}",
      "{{step 2: generated cooking step in provided language}}",
      "{{step 3: generated cooking step in provided language}}",
      "{{step 4: generated cooking step in provided language}}",
      "{{step 5: generated cooking step in provided language}}"
    ]
  },
  2: {
    id: "{{unique id}}",
    cuisine: "{{cuisine name in provided language, if no specified put 'none'}}",
    preference: [
      "{{applicable preference 1}}",
      "{{applicable preference 2}}",
      "... (only include preferences that are true for this recipe)"
    ],
    title: "{{dish name in provided language}}",
    description: "{{a short, engaging description of the dish, highlighting its key flavors, texture, and appeal in provided language}}",
    time: "{{estimated cooking time}}",
    servings: "1",
    calories: "{{calories of the dish per 1 person}}",
    ingredients: [
      { "name": "{{ingredient 1 in provided language}}", "portion": "{{portion size}}", "unit": "{{unit in provided language}}" },
      { "name": "{{ingredient 2 in provided language}}", "portion": "{{portion size}}", "unit": "{{unit in provided language}}" },
      { "name": "{{ingredient 3 in provided language}}", "portion": "{{portion size}}", "unit": "{{unit in provided language}}" }
    ],
    additionalIngredients: [
      { "name": "{{additional ingredient 1 in provided language}}", "portion": "{{portion size in provided language}}", "unit": "{{unit in provided language}}" },
      { "name": "{{additional ingredient 2 in provided language}}", "portion": "{{portion size in provided language}}", "unit": "{{unit in provided language}}" },
      { "name": "{{additional ingredient 3 in provided language}}", "portion": "{{portion size in provided language}}", "unit": "{{unit in provided language}}" }
    ],
    instructions: [
      "{{step 1: generated cooking step in provided language}}",
      "{{step 2: generated cooking step in provided language}}",
      "{{step 3: generated cooking step in provided language}}",
      "{{step 4: generated cooking step in provided language}}",
      "{{step 5: generated cooking step in provided language}}"
    ]
  }
}

---

### Response Requirements:
- The recipe JSON must include a unique id, the provided cuisine (or "none" if the cuisine is "any" or missing/invalid), and a preference field that is an array containing only the applicable preferences for that recipe. The possible preference strings are: "Traditional", "Quick cook", "Beginner friendly", "Microwave only", and "Spicy". Include a string only if its corresponding input value is true (for "Spicy", include it only if spiceLevel > 0 and the recipe is intended to be spicy). Only in English for preferences even in Chinese recipe or Japanese recipe.
- At least one recipe must be generated that does not include "Spicy" in its preference array, even if spiceLevel > 0.
- **Ignore the provided language parameter; instead, the output must include each recipe translated into English, Chinese, and Japanese.**
- Generate the recipe JSON with the ingredients list where each ingredient object includes the fields "name", "portion" (numeric value), and "unit" (the measurement unit).
- All text in the output must be fully in the respective language for each translation.
- Return three different recipes in an object with keys 0, 1, and 2 in provided language. Only return recipe with one language (English, Chinese or Japanese).
- All recipes must strictly reflect the provided cuisine if it is specified and not "any". For example, if the cuisine is "chinese", every recipe must reflect Chinese culinary traditions and use typical ingredients and techniques.

Now generate the **mockRecipe** object using the given ingredients, preferences, and language.


`
    const result = await generateRecipeContent(prompt);
    const cleanedJson = cleanAIResponseNested(result);
    console.log('cleanedJson', ingredients, cleanedJson)
    const recipe = JSON.parse(cleanedJson);
    res.json({ recipe });
  } catch (error) {
    console.error("Error generating recipe:", error);
    res.status(500).json({ error: "Failed to generate recipe" });
  }
};

exports.generateVeganRecipe = async (req, res) => {
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
    - **Cuisine:** The name of the cuisine in provided language. If no specific cuisine leave blank.
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
    const cleanedJson = cleanAIResponseNested(result);
    console.log('cleanedJson', cleanedJson)
    const recipe = JSON.parse(cleanedJson);
    res.json({ recipe });
  } catch (error) {
    console.error("Error generating recipe:", error);
    res.status(500).json({ error: "Failed to generate recipe" });
  }
};
