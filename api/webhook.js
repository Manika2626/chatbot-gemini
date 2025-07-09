import admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Buffer } from "buffer";

// Initialize Firebase only once
if (!admin.apps.length) {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 is not set");
  }

  const serviceAccountJSON = Buffer.from(
    process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
    "base64"
  ).toString("utf8");

  const serviceAccount = JSON.parse(serviceAccountJSON);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    // Preflight request
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST", "OPTIONS"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const queryText = (req.body.queryResult?.queryText || "").toLowerCase();

    if (!queryText) {
      return res.json({
        fulfillmentText: "Sorry, I didn't get your question. Please try again.",
      });
    }

    // Extract keywords
    const keywords = queryText
      .split(/[ ,]+/)
      .map((w) => w.trim())
      .filter(Boolean);

    // Firestore search
    const snapshot = await db.collection("announcements").get();

    let matchedDoc = null;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const type = (data.type || "").toLowerCase();
      const title = (data.title || "").toLowerCase();

      if (
        keywords.some((kw) => type.includes(kw) || title.includes(kw))
      ) {
        matchedDoc = data;
      }
    });

    if (matchedDoc) {
      const message = `📢 *${matchedDoc.title}* by ${matchedDoc.authorName}\n\n${matchedDoc.description}\n\n📅 Date: ${new Date(matchedDoc.timestamp).toLocaleString()}\n\n🔗 [View Image](${matchedDoc.fileURL})`;
      return res.json({ fulfillmentText: message });
    }

    // fallback: Gemini
    const geminiPrompt = `
      Answer the following query in under 100 words, clear and concise:
      "${queryText}"
    `;

    const result = await model.generateContent(geminiPrompt);
    const response = result.response.text();

    return res.json({ fulfillmentText: response });
  } catch (err) {
    console.error("Error in webhook:", err);
    return res.json({
      fulfillmentText: "Sorry, something went wrong while processing your request.",
    });
  }
}
