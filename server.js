// server.js
const express = require("express");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.static("src")); // serves index.html, chatbot.html, etc.

// Chatbot API route
app.post("/api/chat", async (req, res) => {
  const userMessage = req.body.message;

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.HF_API_KEY}`, // Hugging Face token
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: `You are a career guidance assistant. Answer only about careers, courses, and scholarships.\nUser: ${userMessage}\nAssistant:`,
          parameters: { max_new_tokens: 200 },
        }),
      }
    );

    const data = await response.json();
    console.log("HF API response:", data);

    // Hugging Face returns generated text in [0].generated_text
    let reply = "Sorry, I could not generate a response.";
    if (Array.isArray(data) && data.length > 0 && data[0].generated_text) {
      reply = data[0].generated_text.replace(/^.*Assistant:/, "").trim();
    }

    res.json({ reply });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ reply: "Something went wrong. Please try again later." });
  }
});

// Port for Render (or local dev)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 VisionX server running on port ${PORT}`);
});
