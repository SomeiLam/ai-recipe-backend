require("dotenv").config();
const express = require("express");
const cors = require("cors");
const recipeRoutes = require("./routes/recipeRoutes");
const { PORT } = require("./config/dotenvConfig");

const app = express();

app.use(express.json());

app.use(cors({
  origin: "*",
  methods: "GET,POST,PUT,DELETE,OPTIONS",
  allowedHeaders: "Content-Type,Authorization"
}));

app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});


app.get("/", (req, res) => {
  res.json({
    message: "🟢 AI Recipe Backend is Running!",
    endpoints: {
      generateRecipe: "/generate-vegan-recipe (POST)"
    },
    status: "OK"
  });
});

app.use("/", recipeRoutes);

app.use((err, req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  console.error("Error encountered:", err);
  res.status(err.status || 500).json({ error: err.message });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

module.exports = app;
