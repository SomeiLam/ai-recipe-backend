const express = require("express");
const { generateVeganRecipe, generateRecipe, getIngredientsFromImage } = require("../controllers/recipeController");
const multer = require("multer");

// Configure Multer storage (using memory storage here)
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

// Define API Routes
router.post("/generate-vegan-recipe", generateVeganRecipe);

router.post("/generate-recipe", generateRecipe)

router.post('/get-ingredients', upload.single("image"), getIngredientsFromImage)

module.exports = router;
