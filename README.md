# 🍽️ AI Recipe Backend

## 📌 Overview
**AI Recipe Backend** is a Node.js API that uses the **Gemini AI** to generate customized recipes based on user-provided ingredients and preferences. It ensures **secure API key handling**, formats AI responses into clean JSON, and provides an easy-to-use API for frontend applications.

---

## 🚀 Features
- 🔒 **Secure API Handling** – Keeps API keys hidden from the frontend.
- 🤖 **AI-Powered Recipe Generation** – Uses **Gemini AI** to generate structured recipes.
- 📜 **JSON Formatted Response** – Returns only relevant recipe details.
- 🌍 **CORS Enabled** – Supports frontend requests from different domains.
- ⚡ **Fast & Lightweight** – Built with **Node.js & Express**.

---

## 🔧 Installation & Setup

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-username/ai-recipe-backend.git
cd ai-recipe-backend
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Create a .env File
```bash
touch .env
```
Add your Gemini API Key in the .env file:
```bash
GEMINI_API_KEY=your-google-api-key
PORT=5000
```

### 4️⃣ Run the Server
```bash
node server.js
```
or use nodemon (auto-restart on changes):
```bash
npx nodemon server.js
```

## 🔥 API Usage
Generate a Recipe
Endpoint: POST /generate-vegan-recipe

Request Body (JSON)
```json
{
    "selectedIngredients": ["tomato", "onion", "garlic"],
    "cuisine": "Italian",
    "userInputIngredients": "basil, olive oil"
}
```
Response (Example)
```json
{
    "recipe": {
        "title": "Delicious Vegan Pasta",
        "ingredients": ["tomato", "onion", "garlic", "basil", "olive oil"],
        "instructions": "Cook pasta, mix ingredients, serve warm."
    }
}
```