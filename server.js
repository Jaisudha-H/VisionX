import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files (index.html, chatbot.html, etc.)
app.use(express.static(__dirname));

// Debug endpoint - to check API key
app.get("/api/debug", (req, res) => {
  res.json({
    status: "Server running",
    hasApiKey: !!process.env.OPENAI_API_KEY,
    apiKeyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
    apiKeyPrefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 7) + "..." : "not found",
    timestamp: new Date().toISOString(),
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('API') || key.includes('OPENAI'))
  });
});

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({ message: "API working!", time: new Date() });
});

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    
    console.log("=== CHAT REQUEST ===");
    console.log("Message:", userMessage);
    console.log("API Key exists:", !!process.env.OPENAI_API_KEY);
    console.log("API Key length:", process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);
    
    if (!process.env.OPENAI_API_KEY) {
      console.log("❌ NO API KEY FOUND");
      return res.json({ reply: "❌ Server Error: OpenAI API key not configured" });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful AI career advisor for students. Provide practical career guidance and education advice." },
          { role: "user", content: userMessage }
        ],
        max_tokens: 300
      }),
    });

    console.log("OpenAI Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log("OpenAI Error:", errorText);
      return res.json({ 
        reply: `❌ OpenAI API Error (${response.status}): ${response.status === 401 ? 'Invalid API key' : 'Service error'}` 
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a reply.";
    
    console.log("✅ Success! Reply length:", reply.length);
    res.json({ reply });

  } catch (error) {
    console.error("Server Error:", error.message);
    res.json({ reply: `❌ Server Error: ${error.message}` });
  }
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔑 OpenAI API Key configured: ${!!process.env.OPENAI_API_KEY}`);
  if (process.env.OPENAI_API_KEY) {
    console.log(`🔑 API Key length: ${process.env.OPENAI_API_KEY.length}`);
  }
});