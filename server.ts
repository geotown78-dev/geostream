import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Supabase Init for Webhook
import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

// Fix for Node.js environment without native WebSocket
(global as any).WebSocket = ws;

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

let supabaseAdmin: any = null;

if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('http')) {
  try {
    supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false
      }
    });
    console.log("✅ Supabase admin initialized");
  } catch (err) {
    console.error("❌ Failed to initialize Supabase client:", err);
  }
} else {
  console.warn("⚠️ Supabase credentials missing or invalid - Webhooks will be disabled.");
}

// Nginx RTMP Webhook
// Nginx sends data as application/x-www-form-urlencoded
app.post("/api/webhooks/rtmp", async (req, res) => {
  if (!supabaseAdmin) {
    console.error("Webhook ignored: Supabase client not initialized.");
    return res.status(500).send('Environment Missing');
  }

  const { call, name, addr } = req.body;
  
  console.log(`RTMP Webhook Received: ${call} for stream: ${name} from ${addr}`);

  if (call === 'publish' && name) {
    try {
      // Check if event already exists
      const { data: existingEvent } = await supabaseAdmin
        .from('events')
        .select('id')
        .eq('room_name', name)
        .eq('is_live', true)
        .maybeSingle();

      if (!existingEvent) {
        // Create new auto-detected event
        const vdsIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        
        // We use a default VDS IP since we often know it from the user setup
        // or they can pass it as a param if they customize the Nginx call
        const streamUrl = `http://5.83.153.142/hls/${name}.m3u8`;

        const { error } = await supabaseAdmin
          .from('events')
          .insert({
            title: `Live Stream: ${name}`,
            room_name: name,
            is_live: true,
            sport: 'Live',
            start_time: new Date().toISOString(),
            stream_url: streamUrl,
            stream_key: name,
            thumbnail: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1000'
          });

        if (error) console.error('Error creating auto-event:', error);
        else console.log(`Auto-event created for stream: ${name}`);
      }
    } catch (err) {
      console.error('Webhook processing error:', err);
    }
  } else if (call === 'publish_done' && name) {
    // Optionally mark as not live when stream ends
    try {
      await supabaseAdmin
        .from('events')
        .update({ is_live: false })
        .eq('room_name', name);
      console.log(`Stream ended: ${name}`);
      delete chats[name];
      console.log(`🧹 Chat messages cleared on publish_done for stream: ${name}`);
    } catch (err) {
      console.error('Error ending stream:', err);
    }
  }

  res.status(200).send('OK');
});

// API: Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// Favicon redirects to custom user icon to bypass any cached / missing public file issues
app.get("/favicon.ico", (req, res) => {
  res.redirect("https://zhtllxbbexcwvgrmxdux.supabase.co/storage/v1/object/public/GEOSTREAM/f23282a4-c96c-4da4-8ebb-b298708c9a6f.png");
});
app.get("/favicon.png", (req, res) => {
  res.redirect("https://zhtllxbbexcwvgrmxdux.supabase.co/storage/v1/object/public/GEOSTREAM/f23282a4-c96c-4da4-8ebb-b298708c9a6f.png");
});

// Chat Storage in RAM
interface ChatMessage {
  id: string;
  user: string;
  msg: string;
  color: string;
  timestamp: string;
}

const chats: Record<string, ChatMessage[]> = {};

// Get chat history
app.get("/api/chat/:roomId", (req, res) => {
  const { roomId } = req.params;
  res.json({ messages: chats[roomId] || [] });
});

// Post a chat message
app.post("/api/chat/:roomId", (req, res) => {
  const { roomId } = req.params;
  const { user, msg, color, id } = req.body;
  if (!user || !msg) {
    return res.status(400).json({ error: "Missing user or msg" });
  }

  if (!chats[roomId]) {
    chats[roomId] = [];
  }

  const newMessage: ChatMessage = {
    id: id ? String(id) : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    user: String(user).trim(),
    msg: String(msg).trim(),
    color: color || "text-brand-primary",
    timestamp: new Date().toISOString()
  };

  chats[roomId].push(newMessage);

  // Keep max 250 messages per room to optimize memory
  if (chats[roomId].length > 250) {
    chats[roomId].shift();
  }

  res.status(200).json({ success: true, message: newMessage });
});

// Delete chat history for a room
app.delete("/api/chat/:roomId", (req, res) => {
  const { roomId } = req.params;
  delete chats[roomId];
  console.log(`🧹 Chat messages cleared/deleted for room: ${roomId}`);
  res.json({ success: true });
});

// Mock stats
app.get("/api/stats", async (req, res) => {
  res.json({
    activeRooms: 1,
    totalParticipants: "Varies",
    timestamp: Date.now()
  });
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
