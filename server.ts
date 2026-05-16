import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { AccessToken, IngressClient, IngressInput, RoomServiceClient } from "livekit-server-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const apiKey = process.env.LIVEKIT_API_KEY?.replace(/['"]/g, '');
const apiSecret = process.env.LIVEKIT_API_SECRET?.replace(/['"]/g, '');
const rawUrl = (process.env.LIVEKIT_URL || process.env.VITE_LIVEKIT_URL)?.replace(/['"]/g, '');
const livekitUrl = rawUrl?.replace('wss://', 'https://').replace('ws://', 'http://');

const ingressClient = new IngressClient(livekitUrl || "", apiKey || "", apiSecret || "");
const roomService = new RoomServiceClient(livekitUrl || "", apiKey || "", apiSecret || "");

// --- Gemini Setup ---
let genAI: GoogleGenerativeAI | null = null;

function getGeminiModel() {
  if (!genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY" || key === "") {
      throw new Error("GEMINI_API_KEY არის ცარიელი ან არასწორი. გთხოვთ დააყენოთ ის Settings > Secrets მენიუდან.");
    }
    genAI = new GoogleGenerativeAI(key);
  }
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
}
// --------------------

// API: Get Live Stats
app.get("/api/stats", async (req, res) => {
  try {
    const rooms = await roomService.listRooms();
    let totalParticipants = 0;
    
    // Count participants across all rooms
    rooms.forEach(room => {
      totalParticipants += room.numParticipants;
    });

    res.json({
      activeRooms: rooms.length,
      totalParticipants: totalParticipants,
      timestamp: Date.now()
    });
  } catch (e) {
    console.error("Stats Error:", e);
    res.status(500).json({ activeRooms: 0, totalParticipants: 0 });
  }
});

// API: Generate LiveKit Token
app.get("/api/get-token", async (req, res) => {
  const { roomName, participantName } = req.query;

  if (!roomName || !participantName) {
    return res.status(400).json({ error: "roomName and participantName are required" });
  }

  if (!apiKey || !apiSecret) {
    return res.status(500).json({ error: "LiveKit API key or secret not configured" });
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: participantName as string,
    ttl: '24h', // OBS sessions might need longer survival
  });

  at.addGrant({ 
    roomJoin: true, 
    room: roomName as string,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true 
  });

  res.json({ token: await at.toJwt() });
});

// API: Create Ingress (RTMP)
app.post("/api/create-ingress", async (req, res) => {
  const { roomName } = req.body;

  if (!roomName) {
    return res.status(400).json({ error: "roomName is required" });
  }

  if (!apiKey || !apiSecret || !livekitUrl) {
    const missing = [];
    if (!apiKey) missing.push("LIVEKIT_API_KEY");
    if (!apiSecret) missing.push("LIVEKIT_API_SECRET");
    if (!livekitUrl) missing.push("LIVEKIT_URL/VITE_LIVEKIT_URL");
    
    return res.status(500).json({ 
      error: "LiveKit configuration incomplete", 
      details: `აკლია ცვლადები: ${missing.join(", ")}. დარწმუნდით რომ Secrets-ში სწორად გიწერიათ.`
    });
  }

  try {
    // 1. Try to find an existing ingress for this room
    const existingIngresses = await ingressClient.listIngress({ roomName: roomName as string });
    if (existingIngresses.length > 0) {
      return res.json(existingIngresses[0]);
    }

    // 2. If room-specific fails, try to see if we have ANY ingress we can reuse (to stay under limit)
    const allIngresses = await ingressClient.listIngress({});
    if (allIngresses.length > 0) {
      const reuse = allIngresses[0];
      // Update the existing ingress to target the current room
      const updated = await ingressClient.updateIngress(reuse.ingressId, {
        name: "OBS RTMP (Updated)",
        roomName: roomName as string,
        participantIdentity: `obs-rtmp-${Math.floor(Math.random() * 10000)}`,
        participantName: "OBS RTMP",
      });
      return res.json(updated);
    }

    // 3. Create a new one if none exist
    const ingress = await ingressClient.createIngress(IngressInput.RTMP_INPUT, {
      roomName: roomName as string,
      participantIdentity: `obs-rtmp-${Math.floor(Math.random() * 10000)}`,
      participantName: "OBS RTMP",
    });
    res.json(ingress);
  } catch (e: any) {
    console.error("Ingress Error:", e);
    
    if (e?.message?.includes("limit exceeded")) {
      return res.status(500).json({
        error: "Ingress Limit Reached",
        details: "თქვენს LiveKit პროექტში ლიმიტი ამოიწურა. გთხოვთ წაშალოთ ძველი Ingress-ები LiveKit Dashboard-იდან."
      });
    }

    res.status(500).json({ 
      error: e?.message || "Failed to create ingress",
      details: "თქვენი LiveKit პროექტი არ უჭერს მხარს RTMP-ს ან სერვერი დროებით მიუწვდომელია."
    });
  }
});

app.get("/api/leaderboard", async (req, res) => {
  try {
    const model = getGeminiModel();
    const prompt = `Return a JSON array of current La Liga 2025-2026 standings (top 20 teams). 
    Fields: rank (number), team (string), logo (string placeholder url if possible or just name), played (number), won (number), drawn (number), lost (number), points (number).
    Return ONLY valid JSON. Note: today is ${new Date().toISOString()}.
    Note: if the season is over or in progress, provide the most up-to-date realistic standings based on your knowledge current as of May 16, 2026. 
    Ensure it is a valid JSON array of objects.`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
       res.json(JSON.parse(jsonMatch[0]));
    } else {
       throw new Error("Invalid JSON from Gemini: " + text);
    }
  } catch (err: any) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ 
      error: "Failed to fetch standings from AI source",
      details: err.message
    });
  }
});

async function startServer() {
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
