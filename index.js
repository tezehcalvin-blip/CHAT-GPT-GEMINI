const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const axios = require("axios");

const OPENAI_API_KEY = process.env.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;
const GEMINI_API_KEY = process.env.AQ.Ab8RN6KT1LJHk_HR4LefRkB4jxXHKF59n4QsTqpW5Vie-AZvRw;

async function askChatGPT(text) {
  const res = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: text }]
    },
    {
      headers: {
        Authorization: `Bearer ${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}`
      }
    }
  );
  return res.data.choices[0].message.content;
}

async function askGemini(text) {
  const res = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
    {
      contents: [{ parts: [{ text }] }]
    }
  );
  return res.data.candidates[0].content.parts[0].text;
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session");
  const sock = makeWASocket({ auth: state });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
    if (!text) return;

    let reply;

    try {
      // Try ChatGPT first
      reply = await askChatGPT(text);
    } catch (e) {
      console.log("ChatGPT failed, switching to Gemini...");
      try {
        reply = await askGemini(text);
      } catch (err) {
        reply = "⚠️ Both AI services failed. Try again later.";
      }
    }

    await sock.sendMessage(msg.key.remoteJid, { text: reply });
  });

  sock.ev.on("creds.update", saveCreds);
}

startBot();
