import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Google GenAI if key is present
const aiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (aiApiKey && aiApiKey !== 'MY_GEMINI_API_KEY') {
  try {
    ai = new GoogleGenAI({ apiKey: aiApiKey });
    console.log('Google GenAI initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize Google GenAI:', err);
  }
} else {
  console.warn('GEMINI_API_KEY is missing or using default placeholder. Assistant will run in fallback mode.');
}

// Enable JSON body parsing
app.use(express.json());

// API: AI Assistant
app.post('/api/assistant', async (req, res) => {
  const { messages } = req.body;
  
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages payload' });
  }

  // Fallback if AI is not configured
  if (!ai) {
    const lastMessage = messages[messages.length - 1]?.content || '';
    let reply = "Hello! Thank you for reaching out to AsooYeshua Ministry. I am currently running in offline prayer mode. Yes, Tersoo Terence Aker (AsooYeshua) would love to connect with you! To book a call directly, please use the Reservation Form on the screen or click the 'Book Call' tab so we can schedule a time and notify AsooYeshua on WhatsApp.";
    
    if (lastMessage.toLowerCase().includes('hello') || lastMessage.toLowerCase().includes('hi')) {
      reply = "Blessed day! Welcome to AsooYeshua Ministry, chaired by Tersoo Terence Aker (AsooYeshua). How can I assist you in your walk of faith today? You can ask me about AsooYeshua's sermons, digital books in our Marketplace, or book a private phone/WhatsApp consultation with him.";
    } else if (lastMessage.toLowerCase().includes('sermon') || lastMessage.toLowerCase().includes('blog') || lastMessage.toLowerCase().includes('preach')) {
      reply = "AsooYeshua has written several powerful messages on the Gospel of Grace, Biblical Faith, and the Great Commission. You can view all of them under our 'Blog' tab, and even purchase full sermon series and books in our 'Marketplace'!";
    } else if (lastMessage.toLowerCase().includes('marketplace') || lastMessage.toLowerCase().includes('book') || lastMessage.toLowerCase().includes('buy')) {
      reply = "Our Marketplace contains inspiring materials written and recorded by Tersoo Terence Aker to equip your faith. These include the 'Foundations of Faith Guidebook', 'Sermons of Grace Audio Series', and our '365 Devotional'. You can easily purchase them via Flutterwave and download them instantly!";
    } else if (lastMessage.toLowerCase().includes('call') || lastMessage.toLowerCase().includes('talk') || lastMessage.toLowerCase().includes('schedule') || lastMessage.toLowerCase().includes('phone')) {
      reply = "AsooYeshua would be glad to pray with you or discuss your inquiries. Please click the 'Book Call' button or fill out the call reservation form in this panel. Once booked, a direct notification will be prepared for his WhatsApp so he can reach out to you!";
    }

    return res.json({ response: reply });
  }

  try {
    // Format conversation history for Gemini
    const systemInstruction = `You are the personal AI Pastoral Assistant for Tersoo Terence Aker (aka AsooYeshua), a dedicated Christian preacher and minister chaired of "AsooYeshua Ministry", which promotes the pure gospel of Jesus Christ.
Your purpose:
1. Warmly greet visitors, answer theological questions, provide scriptural encouragement, and promote the gospel of Jesus Christ.
2. Share AsooYeshua's mission: Tersoo Terence Aker is a fiery preacher dedicated to building faith and promoting salvation. His TikTok, Facebook, and YouTube handles are all "AsooYeshua".
3. Promote AsooYeshua's blog/sermons and marketplace eBooks/audios. When helpful, refer them to the Marketplace tab to buy his books or Sermons of Grace using Flutterwave!
4. Encourage them to arrange a private consultation or call with AsooYeshua.
   - If they express interest in talking with him, praying together, or scheduling a call, guide them to fill out the Call Booking Form on the website or say: "I would love to arrange a call with AsooYeshua for you! Please provide your Name, WhatsApp Number, and preferred Date/Time, or fill out the booking form on the right so I can instantly notify AsooYeshua on WhatsApp."

Tone: Pastoral, compassionate, biblically sound, encouraging, respectful, and professional. Always sign off with a warm, faith-filled closing or blessing. Avoid robotic or dry language. Speak like a loving guide representing a Christian ministry. Use scriptures where appropriate (KJV/NIV style).`;

    // Map messages into Gemini's contents format
    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    // Call Gemini 2.5 Flash
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 800,
      }
    });

    const replyText = response.text || "Thank you for writing. May the grace of our Lord Jesus Christ be with you.";
    return res.json({ response: replyText });
  } catch (error: any) {
    console.error('Error generating AI response:', error);
    return res.status(500).json({ error: 'Failed to generate response', details: error.message });
  }
});

// Start server and handle Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware mounted in Development mode.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving static files in Production mode.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
