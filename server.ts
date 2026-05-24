import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";

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
const mutedUsers = new Map<string, number>(); // username -> expireTimestamp (0 = permanent)
const blockedUsers = new Set<string>();

// Get chat moderation lists
app.get("/api/chat/moderation", (req, res) => {
  const now = Date.now();
  // Clean up expired mutes
  for (const [user, expire] of mutedUsers.entries()) {
    if (expire !== 0 && expire < now) {
      mutedUsers.delete(user);
    }
  }

  res.json({
    muted: Array.from(mutedUsers.entries()).map(([username, expire]) => ({ username, expire })),
    blocked: Array.from(blockedUsers)
  });
});

// Moderation actions
app.post("/api/chat/moderation/mute", (req, res) => {
  const { username, duration } = req.body; // duration in seconds
  if (!username) return res.status(400).json({ error: "ნიკნეიმი არ არის მითითებული" });
  
  const normalizedUser = String(username).trim().toUpperCase();
  let expireTime = 0; // permanent
  if (duration && Number(duration) > 0) {
    expireTime = Date.now() + Number(duration) * 1000;
  }
  
  mutedUsers.set(normalizedUser, expireTime);
  console.log(`🔇 Muted user chat: ${username} (duration: ${duration ? duration + 's' : 'perm'})`);
  res.json({ 
    success: true, 
    muted: Array.from(mutedUsers.entries()).map(([u, exp]) => ({ username: u, expire: exp })) 
  });
});

app.post("/api/chat/moderation/unmute", (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "ნიკნეიმი არ არის მითითებული" });
  mutedUsers.delete(String(username).trim().toUpperCase());
  console.log(`🔊 Unmuted user chat: ${username}`);
  res.json({ 
    success: true, 
    muted: Array.from(mutedUsers.entries()).map(([u, exp]) => ({ username: u, expire: exp })) 
  });
});

app.post("/api/chat/moderation/block", (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "ნიკნეიმი არ არის მითითებული" });
  blockedUsers.add(String(username).trim().toUpperCase());
  console.log(`🚫 Blocked user chat: ${username}`);
  res.json({ success: true, blocked: Array.from(blockedUsers) });
});

app.post("/api/chat/moderation/unblock", (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "ნიკნეიმი არ არის მითითებული" });
  blockedUsers.delete(String(username).trim().toUpperCase());
  console.log(`✅ Unblocked user chat: ${username}`);
  res.json({ success: true, blocked: Array.from(blockedUsers) });
});

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

  const normalizedUser = String(user).trim().toUpperCase();
  if (blockedUsers.has(normalizedUser)) {
    return res.status(403).json({ error: "BLOCKED", message: "თქვენ დაბლოკილი ხართ ჩატიდან" });
  }
  if (mutedUsers.has(normalizedUser)) {
    const expireTime = mutedUsers.get(normalizedUser);
    if (expireTime !== 0 && expireTime && expireTime < Date.now()) {
      mutedUsers.delete(normalizedUser);
    } else {
      const remainingSecs = expireTime ? Math.ceil((expireTime - Date.now()) / 1000) : 0;
      const msgStr = expireTime === 0 ? "თქვენ გაჩუმებული ხართ ჩატიდან" : `თქვენ გაჩუმებული ხართ ჩატიდან კიდევ ${remainingSecs} წამით`;
      return res.status(403).json({ error: "MUTED", message: msgStr });
    }
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

const DEFAULT_TERMS = `1. ზოგადი დებულებები
1.1. წინამდებარე დოკუმენტი არეგულირებს ურთიერთობას მომხმარებელსა და GEOSTREAM-ის ადმინისტრაციას შორის.
1.2. საიტი წარმოადგენს საინფორმაციო-გასართობ პლატფორმას, რომელიც მომხმარებელს სთავაზობს ბმულებსა და წვდომას ფეხბურთის, UFC-ისა და სხვა სპორტული ღონისძიებების პირდაპირ ტრანსლაციებზე.

2. ინტელექტუალური საკუთრება და პასუხისმგებლობის შეზღუდვა
2.1. GEOSTREAM არ ახორციელებს ვიდეო მასალის შენახვას საკუთარ სერვერებზე. ჩვენ მხოლოდ ვაწვდით მომხმარებლებს ინტერნეტში საჯაროდ ხელმისაწვდომი ტრანსლაციების ბმულებს.
2.2. ყველა საავტორო უფლება ტრანსლაციაზე ეკუთვნის მათ კანონიერ მფლობელებს.
2.3. ადმინისტრაცია არ არის პასუხისმგებელი ტრანსლაციის ხარისხზე, წყვეტაზე ან იმ შინაარსზე, რომელიც გადაიცემა მესამე მხარის პლატფორმების საშუალებით.

3. მომხმარებლის ვალდებულებები
3.1. საიტით სარგებლობა ნებადართულია მხოლოდ პირადი, არაკომერციული მიზნებისთვის.
3.2. მომხმარებელს ეკრძალება საიტზე არსებული მასალის რეპროდუცირება, გავრცელება ან სხვა კომერციული მიზნით გამოყენება ადმინისტრაციის თანხმობის გარეშე.
3.3. მომხმარებელი ვალდებულია დაიცვას ეთიკის ნორმები საიტის კომენტარების ველში (ასეთის არსებობის შემთხვევაში). იკრძალება შეურაცხყოფა, რასიზმი და სპამი.

4. ასაკობრივი შეზღუდვა
4.1. სპორტული ორთაბრძოლების (მაგ: UFC) და მასთან დაკავშირებული რეკლამების (მაგ: საბუკმეკერო კომპანიები) სპეციფიკიდან გამომდინარე, საიტი განკუთვნილია მხოლოდ სრულწლოვანი (18+) პირებისთვის.

5. მესამე მხარის რეკლამები და ბმულები
5.1. საიტზე შესაძლოა განთავსებული იყოს მესამე მხარის სარეკლამო ბანერები ან ბმულები.
5.2. ადმინისტრაცია არ აგებს პასუხს იმ ვებ-გვერდების შინაარსსა და უსაფრთხოებაზე, რომლებზეც მომხმარებელი გადადის სარეკლამო ბმულების საშუალებით.

6. ცვლილებები წესებში
6.1. ადმინისტრაცია იტოვებს უფლებას, ნებისმიერ დროს შეიტანოს ცვლილებები წინამდებარე წესებში მომხმარებლის წინასწარი გაფრთხილების გარეშე.
6.2. ცვლილებები ძალაში შედის მათი საიტზე გამოქვეყნებისთანავე.`;

const TERMS_FILE_PATH = path.join(process.cwd(), "terms_and_conditions.txt");

app.get("/api/terms", (req, res) => {
  try {
    if (fs.existsSync(TERMS_FILE_PATH)) {
      const content = fs.readFileSync(TERMS_FILE_PATH, "utf-8");
      return res.json({ content });
    }
    return res.json({ content: DEFAULT_TERMS });
  } catch (err: any) {
    console.error("Error reading terms:", err);
    return res.status(500).json({ error: "Failed to read terms and conditions" });
  }
});

app.post("/api/terms", (req, res) => {
  const { content } = req.body;
  if (content === undefined) {
    return res.status(400).json({ error: "შინაარსი არ არის გადმოცემული" });
  }
  try {
    fs.writeFileSync(TERMS_FILE_PATH, content, "utf-8");
    return res.json({ success: true, content });
  } catch (err: any) {
    console.error("Error writing terms:", err);
    return res.status(500).json({ error: "Failed to write terms and conditions" });
  }
});

// Sync La Liga standings from Google search using Gemini API
app.post("/api/laliga/sync", async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ GEMINI_API_KEY environment variable is not defined.");
    return res.status(500).json({ error: "Google Gemini API-ის გასაღები ვერ მოიძებნა სერვერზე. გთხოვთ დაამატოთ ის Settings > Secrets-ში." });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const prompt = `Search for the current official Spanish La Liga (LaLiga EA Sports) standings / table for the current 2025/2026 season. If not available, search for the latest live 2024/2025 or current standings.
Using Google Search grounding, find the real-time statistics for each of the 20 teams.
Return a valid JSON array of objects representing the standings, sorted by their rank (1 to 20).

For each team object in the array, include these exact keys:
1. "rank": number (1 to 20)
2. "name": string (The Georgian name of the team, mapped from the list below)
3. "logo": string (The logo URL, mapped from the list below)
4. "played": number (Total games played, e.g. 36)
5. "won": number (Total matches won)
6. "drawn": number (Total matches drawn)
7. "lost": number (Total matches lost)
8. "gf": number (Goals for / scored)
9. "ga": number (Goals against / conceded)
10. "gd": number (Goal difference, calculated as gf - ga)
11. "points": number (Total points)
12. "status": string (Has to be exactly "same", "up", or "down")
13. "form": array of strings (e.g. ["W", "D", "W", "L", "W"] representing the 5 most recent games, ordered oldest first, only containing 'W', 'D', 'L')

Mapping of English names, Georgian names, and logo URLs to use:
- FC Barcelona / Barcelona -> "ბარსელონა" | Logo: "https://api.sofascore.app/api/v1/team/2817/image"
- Real Madrid -> "რეალ მადრიდი" | Logo: "https://api.sofascore.app/api/v1/team/2829/image"
- Villarreal -> "ვილიარეალი" | Logo: "https://api.sofascore.app/api/v1/team/2819/image"
- Atletico Madrid -> "ატლეტიკო მადრიდი" | Logo: "https://api.sofascore.app/api/v1/team/2836/image"
- Real Betis -> "რეალ ბეტისი" | Logo: "https://api.sofascore.app/api/v1/team/2816/image"
- Celta Vigo / Celta de Vigo -> "სელტა" | Logo: "https://api.sofascore.app/api/v1/team/2821/image"
- Getafe -> "ხეტაფე" | Logo: "https://api.sofascore.app/api/v1/team/2824/image"
- Real Sociedad -> "რეალ სოსიედადი" | Logo: "https://api.sofascore.app/api/v1/team/2825/image"
- Athletic Club / Athletic Bilbao -> "ატლეტიკ კლუბი" | Logo: "https://api.sofascore.app/api/v1/team/2820/image"
- Rayo Vallecano -> "რაიო ვალეკანო" | Logo: "https://api.sofascore.app/api/v1/team/2818/image"
- Valencia -> "ვალენსია" | Logo: "https://api.sofascore.app/api/v1/team/2828/image"
- Sevilla -> "სევილია" | Logo: "https://api.sofascore.app/api/v1/team/2833/image"
- Osasuna -> "ოსასუნა" | Logo: "https://api.sofascore.app/api/v1/team/2826/image"
- Espanyol -> "ესპანიოლი" | Logo: "https://api.sofascore.app/api/v1/team/2814/image"
- Girona -> "ჟირონა" | Logo: "https://api.sofascore.app/api/v1/team/2823/image"
- Alaves / Deportivo Alaves -> "ალავესი" | Logo: "https://api.sofascore.app/api/v1/team/2885/image"
- Elche -> "ელჩე" | Logo: "https://api.sofascore.app/api/v1/team/2827/image"
- Mallorca -> "მალიორკა" | Logo: "https://api.sofascore.app/api/v1/team/2822/image"
- Levante -> "ლევანტე" | Logo: "https://api.sofascore.app/api/v1/team/2815/image"
- Real Oviedo -> "რეალ ოვიედო" | Logo: "https://api.sofascore.app/api/v1/team/2832/image"
- Leganes / CD Leganes -> "ლეგანესი" | Logo: "https://api.sofascore.app/api/v1/team/2820/image"
- Las Palmas -> "ლას პალმასი" | Logo: "https://api.sofascore.app/api/v1/team/2819/image"
- Real Valladolid / Valladolid -> "ვალიადოლიდი" | Logo: "https://api.sofascore.app/api/v1/team/2831/image"

If other teams are promoted/present instead of Oviedo, Levante, or Elche, please map their English names to appropriate Georgian translations (e.g. Leganes -> ლეგანესი, Valladolid -> ვალიადოლიდი, Las Palmas -> ლას პალმასი) and use a Sofascore app image pattern or a fallback image.

Return ONLY the raw JSON array containing the twenty team objects in order of rank. Do not add markdown code blocks (like \`\`\`json) or wrap it with anything else. Just start with [ and end with ].`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("No response text from Gemini API");
    }

    let cleanText = responseText.trim();
    if (cleanText.includes("```")) {
      // Extract from markdown code block
      const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        cleanText = match[1].trim();
      } else {
        cleanText = cleanText.replace(/```json/gi, "").replace(/```/gi, "").trim();
      }
    }

    // Try parsing as JSON to confirm validity
    const standings = JSON.parse(cleanText);
    if (!Array.isArray(standings)) {
      throw new Error("Result is not a JSON array of teams");
    }

    // Post-process to ensure type safety & clean up any minor format typos from the model
    const cleanedStandings = standings.map((item: any, idx: number) => {
      const gf = Number(item.gf) || 0;
      const ga = Number(item.ga) || 0;
      let formArray = Array.isArray(item.form) ? item.form : [];
      if (formArray.length === 0 && typeof item.form === "string") {
        formArray = item.form.split("").filter((char: string) => ["W", "D", "L"].includes(char.toUpperCase()));
      }
      formArray = formArray.map((f: string) => {
        const uppercaseF = String(f).toUpperCase();
        return ["W", "D", "L"].includes(uppercaseF) ? uppercaseF : "W";
      }).slice(0, 5);
      
      while (formArray.length < 5) {
        formArray.push("W");
      }

      return {
        rank: idx + 1,
        name: String(item.name || "Unknown Team"),
        logo: String(item.logo || "https://api.sofascore.app/api/v1/team/2817/image"),
        played: Number(item.played) || 0,
        won: Number(item.won) || 0,
        drawn: Number(item.drawn) || 0,
        lost: Number(item.lost) || 0,
        gf,
        ga,
        gd: gf - ga,
        points: Number(item.points) || 0,
        status: ["up", "down", "same"].includes(item.status) ? item.status : "same",
        form: formArray
      };
    });

    console.log("⚽ Successfully synced La Liga standings using Gemini!");
    return res.json({ success: true, standings: cleanedStandings });
  } catch (err: any) {
    console.error("❌ La Liga Sync Error:", err);
    return res.status(500).json({ error: "ლა ლიგის სინქრონიზაციისას დაფიქსირდა შეცდომა: " + err.message });
  }
});

// Admin Users List with Service Role Admin SDK or clean mock fallback
app.get("/api/admin/users", async (req, res) => {
  if (!supabaseAdmin) {
    return res.json({
      success: true,
      users: [
        { id: "u-1", email: "georgetchedia74@gmail.com", user_metadata: { full_name: "გიორგი ჭედია" }, created_at: "2026-05-18T12:00:00Z" },
        { id: "u-2", email: "admin@geostream.ge", user_metadata: { full_name: "ადმინისტრატორი" }, created_at: "2026-05-19T08:30:00Z" },
        { id: "u-3", email: "sandro99@gmail.com", user_metadata: { full_name: "სანდრო მელაძე" }, created_at: "2026-05-20T14:15:00Z" },
        { id: "u-4", email: "luka.k@yahoo.com", user_metadata: { full_name: "ლუკა კაპანაძე" }, created_at: "2026-05-21T10:05:00Z" },
        { id: "u-5", email: "nini_baramidze@gmail.com", user_metadata: { full_name: "ნინი ბარამიძე" }, created_at: "2026-05-21T18:22:00Z" }
      ],
      is_mock: true
    });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
      console.warn("Error fetching users from Supabase admin, using database/mock fallback:", error);
      return res.json({
        success: true,
        users: [
          { id: "u-1", email: "georgetchedia74@gmail.com", user_metadata: { full_name: "გიორგი ჭედია" }, created_at: "2026-05-18T12:00:00Z" },
          { id: "u-2", email: "admin@geostream.ge", user_metadata: { full_name: "ადმინისტრატორი" }, created_at: "2026-05-19T08:30:00Z" },
          { id: "u-3", email: "sandro99@gmail.com", user_metadata: { full_name: "სანდრო მელაძე" }, created_at: "2026-05-20T14:15:00Z" }
        ],
        is_mock: true
      });
    }

    res.json({
      success: true,
      users: data.users || [],
      is_mock: false
    });
  } catch (err: any) {
    console.error("Exception in fetch users endpoint:", err);
    res.status(500).json({ error: err.message || "Failed to fetch users" });
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
