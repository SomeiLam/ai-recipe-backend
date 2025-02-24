require("dotenv").config();
const express = require("express");
const cors = require("cors");
const recipeRoutes = require("./routes/recipeRoutes");
const { PORT } = require("./config/dotenvConfig");

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Log incoming requests
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Root route (for clarity)
app.get("/", (req, res) => {
  res.json({
    message: "🟢 AI Recipe Backend is Running!",
    endpoints: {
      generateRecipe: "/generate-vegan-recipe (POST)"
    },
    status: "OK"
  });
});

// Use Routes
app.use("/", recipeRoutes);

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

module.exports = app;
