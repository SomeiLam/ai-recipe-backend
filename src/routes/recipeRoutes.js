const express = require("express");
const { generateRecipe } = require("../controllers/recipeController");

const router = express.Router();

// Define API Routes
router.post("/generate-vegan-recipe", generateRecipe);

module.exports = router;
