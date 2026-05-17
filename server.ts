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

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
  {
    auth: {
      persistSession: false
    },
    realtime: {
      transport: ws
    }
  }
);

// Nginx RTMP Webhook
// Nginx sends data as application/x-www-form-urlencoded
app.post("/api/webhooks/rtmp", async (req, res) => {
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

// Mock stats - in a real VDS setup, you might query your media server (MediaMTX/Nginx) for actual viewer counts
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
