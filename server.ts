import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { AccessToken, IngressClient, IngressInput } from "livekit-server-sdk";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;
const livekitUrl = process.env.LIVEKIT_URL;

const ingressClient = new IngressClient(livekitUrl || "", apiKey || "", apiSecret || "");

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

  try {
    const ingress = await ingressClient.createIngress(IngressInput.RTMP_INPUT, {
      roomName: roomName as string,
      participantIdentity: `rtmp-${Math.floor(Math.random() * 10000)}`,
      participantName: "RTMP Broadcaster",
    });
    res.json(ingress);
  } catch (e) {
    console.error("Ingress Error:", e);
    res.status(500).json({ error: e instanceof Error ? e.message : "Failed to create ingress" });
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
