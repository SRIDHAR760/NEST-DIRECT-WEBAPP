import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API endpoint for Gemini Guru chatbot
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history, inventory } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key is not configured on the server. Please add it to your secrets settings." });
      }

      // Initialize modern GoogleGenAI client and set User-Agent telemetry
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Branded Guru instruction detailing Chennai rental guide responsibilities
      const inventoryContext = Array.isArray(inventory) && inventory.length > 0 
        ? `\n\nCURRENT VERIFIED INVENTORY (Direct from Owners):\n${JSON.stringify(inventory, null, 2)}`
        : "";

      const systemInstruction = `You are "NestDirect Guru", a high-end Chennai rental advisor and real estate AI. 
Help users navigate the Chennai rental scene (localities like Adyar, Mylapore, OMR, Velachery, Besant Nagar, Sholinganallur).
Explain how to bypass the standard 1-month brokerage fee, negotiate security deposits, verify landlord listings, prepare documentation, and plan commutes.

If users ask for recommendations or specific properties, refer to the following inventory. Always explain that these are direct-to-owner listings with zero brokerage fee.${inventoryContext}

Keep your answers beautifully structured, scannable, professional, and Chennai-savvy. Use elegant bullet points and formatting. Highlight the active, direct-to-owner benefits of NestDirect.`;

      // Map conversation history format correctly for standard Gemini payloads
      const formattedContents = [
        ...(Array.isArray(history) ? history.map((h: any) => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.text }]
        })) : []),
        {
          role: 'user',
          parts: [{ text: message }]
        }
      ];

      // Exponential backoff retry logic for handling transient 503 high-demand errors
      let attempts = 0;
      const maxAttempts = 3;
      let lastError: any = null;

      while (attempts < maxAttempts) {
        try {
          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash", // Upgraded to gemini-3.5-flash per skill guidelines
            contents: formattedContents,
            config: {
              systemInstruction,
              temperature: 0.7,
              tools: [{ googleMaps: {} }],
              toolConfig: {
                retrievalConfig: {
                  latLng: {
                    latitude: 13.0827,
                    longitude: 80.2707
                  }
                }
              }
            }
          });

          const replyText = response.text || "I was unable to generate a detailed response. Please try reframing your question.";
          const groundingMetadata = response.candidates?.[0]?.groundingMetadata || null;
          return res.json({ reply: replyText, groundingMetadata });
        } catch (error: any) {
          lastError = error;
          attempts++;
          
          // Check for 503 (Service Unavailable) or high demand errors
          const isRetryable = error.message?.includes("503") || 
                            error.message?.includes("high demand") || 
                            error.message?.includes("UNAVAILABLE");
          
          if (isRetryable && attempts < maxAttempts) {
            const delay = Math.pow(2, attempts) * 1000; // 2s, 4s backoff
            console.log(`Gemini API busy (Attempt ${attempts}/${maxAttempts}). Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          break; // Not retryable or max attempts reached
        }
      }

      throw lastError;
    } catch (error: any) {
      console.error("Gemini Real-Estate Guru Server Error:", error);
      
      // Provide a clean, specific error message if it was a high-capacity issue
      if (error.message?.includes("503") || error.message?.includes("high demand")) {
        return res.status(503).json({ 
          error: "The Real-Estate Guru is currently handling high volume from other Chennai users. Please try sending your message again in a few seconds." 
        });
      }
      
      res.status(500).json({ error: error.message || "Failed to communicate with Chennai Real-Estate Guru." });
    }
  });

  // API endpoint for dynamic Rental Agreement Customization and AI Drafting
  app.post("/api/generate-agreement", async (req, res) => {
    try {
      const { propertyTitle, rent, deposit, tenantName, ownerName, durationMonths, customClauses } = req.body;
      if (!propertyTitle || !rent || !tenantName) {
        return res.status(400).json({ error: "Property title, Rent, and Tenant Name are required." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key is not configured on the server. Please add it to your secrets settings." });
      }

      // Initialize modern GoogleGenAI client and set User-Agent telemetry
      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `Draft a professional, legally-rigorous peer-to-peer Residential Rent Agreement for a property in Chennai, Tamil Nadu under the Tamil Nadu Regulation of Rights and Responsibilities of Landlords and Tenants Act.
      
      Details:
      - Property / Asset: ${propertyTitle}
      - Landlord / Owner Name: ${ownerName || "Direct Owner"}
      - Tenant Name: ${tenantName}
      - Monthly Rent: ₹${rent.toLocaleString()}/month (Direct settlement, zero agency commission)
      - Security Deposit: ₹${deposit ? deposit.toLocaleString() : "Not Specified"}
      - Lease Term / Duration: ${durationMonths || 11} Months
      - Custom Clauses / Special Terms: ${customClauses || "Standard peaceable enjoyment, no commercial subletting, pet-friendly."}

      Ensure it includes:
      1. A "PEER-TO-PEER CLAUSE" explicitly stating that no brokers, intermediaries, or agency commissions are involved or due.
      2. Clear deposit security refund guidelines upon handover at lease completion.
      3. Formal legalese structure with section headings (Rent Payment, Maintenance, Tenure, Covenants).
      4. Placeholders for signatures of both parties.
      
      Format with elegant typography, spacing, and structured clauses. Output only the final document text without any markdown fence brackets (like \`\`\`markdown or similar).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          temperature: 0.7,
        }
      });

      const replyText = response.text || "Failed to generate agreement draft. Please try again.";
      return res.json({ agreement: replyText });
    } catch (error: any) {
      console.error("Gemini Agreement Generator Server Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate rent agreement draft." });
    }
  });

  // Configure Vite Development / Production asset middlewares
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
