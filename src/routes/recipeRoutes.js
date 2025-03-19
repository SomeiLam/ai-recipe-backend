const express = require("express");
const { generateVeganRecipe, generateRecipe, getIngredientsFromImage } = require("../controllers/recipeController");

const router = express.Router();

// Define API Routes
router.post("/generate-vegan-recipe", generateVeganRecipe);

router.post("/generate-recipe", generateRecipe)

router.post('/get-ingredients', getIngredientsFromImage)

module.exports = router;
