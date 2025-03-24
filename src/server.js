require("dotenv").config();
const express = require("express");
const cors = require("cors");
const recipeRoutes = require("./routes/recipeRoutes");
const { PORT } = require("./config/dotenvConfig");

const app = express();

// Standard Middleware
app.use(express.json()); // Parse JSON bodies

// Enable CORS for all origins. Adjust options as needed.
app.use(cors({
  origin: "*", // Or specify your frontend domain
  methods: "GET,POST,PUT,DELETE,OPTIONS",
  allowedHeaders: "Content-Type,Authorization"
}));

// Log incoming requests
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Root route for clarity
app.get("/", (req, res) => {
  res.json({
    message: "🟢 AI Recipe Backend is Running!",
    endpoints: {
      generateRecipe: "/generate-vegan-recipe (POST)"
    },
    status: "OK"
  });
});

// API Routes
app.use("/", recipeRoutes);

// Global error handling middleware
app.use((err, req, res, next) => {
  // Ensure CORS headers are set even in error responses
  res.header("Access-Control-Allow-Origin", "*");
  console.error("Error encountered:", err);
  res.status(err.status || 500).json({ error: err.message });
});

// Start Server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

module.exports = app;
