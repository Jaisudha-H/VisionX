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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(__dirname));

// Debug endpoint
app.get("/api/debug", (req, res) => {
  res.json({
    status: "Server running",
    hasApiKey: !!process.env.OPENAI_API_KEY,
    apiKeyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
    apiKeyPrefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + "..." : "not found",
    timestamp: new Date().toISOString()
  });
});

// Test OpenAI connection
app.get("/api/test-openai", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.json({ success: false, error: "No API key found" });
    }

    // Test with a simple request
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });

    if (response.ok) {
      res.json({ success: true, message: "API key is working!" });
    } else {
      const errorText = await response.text();
      res.json({ 
        success: false, 
        status: response.status,
        error: errorText,
        message: response.status === 429 ? "Rate limit exceeded or billing issue" : "API key problem"
      });
    }
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Chat endpoint with better 429 handling
app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    
    console.log("=== CHAT REQUEST ===");
    console.log("Message:", userMessage);
    console.log("API Key exists:", !!process.env.OPENAI_API_KEY);
    
    if (!process.env.OPENAI_API_KEY) {
      return res.json({ reply: "❌ Server configuration error: No OpenAI API key found" });
    }

    if (!userMessage || userMessage.trim() === '') {
      return res.json({ reply: "Please ask me a question about careers!" });
    }

    // Make request to OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { 
            role: "system", 
            content: "You are CareerPath AI, a helpful career guidance assistant for students. Provide brief, practical advice about careers, education paths, and skills development. Keep responses under 150 words." 
          },
          { role: "user", content: userMessage.trim() }
        ],
        max_tokens: 200,
        temperature: 0.7
      }),
    });

    console.log("OpenAI Status:", response.status);
    console.log("OpenAI Headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.log("OpenAI Error Details:", errorText);
      
      let userMessage = "";
      let debugInfo = "";
      
      try {
        const errorData = JSON.parse(errorText);
        debugInfo = errorData.error?.message || errorText;
      } catch {
        debugInfo = errorText;
      }
      
      if (response.status === 429) {
        userMessage = "🚫 Rate Limit Error (429):\n\n" +
                     "**Possible causes:**\n" +
                     "• No billing setup in OpenAI account\n" +
                     "• Free trial credits expired\n" +
                     "• Rate limits exceeded\n" +
                     "• Account needs payment method\n\n" +
                     "**Debug info:** " + debugInfo + "\n\n" +
                     "Please check your OpenAI account billing settings.";
      } else if (response.status === 401) {
        userMessage = "🔑 Authentication error (401): " + debugInfo;
      } else if (response.status === 403) {
        userMessage = "⛔ Access denied (403): " + debugInfo;
      } else if (response.status >= 500) {
        userMessage = "🔧 OpenAI service error (" + response.status + "): " + debugInfo;
      } else {
        userMessage = `❌ API Error (${response.status}): ${debugInfo}`;
      }
      
      return res.json({ reply: userMessage });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "I apologize, but I couldn't generate a proper response. Please try rephrasing your question.";
    
    console.log("✅ Successful response, length:", reply.length);
    res.json({ reply });

  } catch (error) {
    console.error("Server Error:", error);
    res.json({ 
      reply: "🔧 Technical error occurred. Please try again in a moment." 
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔑 API Key configured: ${!!process.env.OPENAI_API_KEY}`);
});