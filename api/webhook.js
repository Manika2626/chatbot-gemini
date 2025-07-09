import admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Buffer } from "buffer";

// Firebase initialization (once)
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
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST", "OPTIONS"]);
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const queryText = (req.body.queryResult?.queryText || "").toLowerCase().trim();

    if (!queryText) {
      return res.json({
        fulfillmentText: "Sorry, I didn't get your question. Please try again.",
      });
    }

    const keywords = queryText
      .split(/[ ,]+/)
      .map((w) => w.trim())
      .filter(Boolean);

    const snapshot = await db.collection("announcements").get();

    let bestMatch = null;
    let bestMatchScore = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const searchableText = `
        ${(data.type || "").toLowerCase()}
        ${(data.title || "").toLowerCase()}
        ${(data.authorName || "").toLowerCase()}
      `;

      let score = 0;
      keywords.forEach((kw) => {
        if (searchableText.includes(kw)) {
          score += 1;
        }
      });

      if (score > bestMatchScore) {
        bestMatchScore = score;
        bestMatch = data;
      }
    });

    let fulfillmentText = "";

    if (bestMatch && bestMatchScore > 0) {
      // Ask Gemini to nicely phrase the matched announcement
      const prompt = `
        Please summarize the following announcement in a friendly, clear way under 80 words.
        Include the title, author, date, and image link at the end.
        Announcement:
        Title: ${bestMatch.title}
        Author: ${bestMatch.authorName}
        Description: ${bestMatch.description || ""}
        Date: ${new Date(bestMatch.timestamp).toLocaleString()}
        Image URL: ${bestMatch.fileURL}
      `;

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      fulfillmentText = response.trim();
    } else {
      // No match, fallback to Gemini for a general answer
      const fallbackPrompt = `
        Answer the following user query in a friendly, concise way under 80 words:
        "${queryText}"
      `;

      const result = await model.generateContent(fallbackPrompt);
      const response = result.response.text();

      fulfillmentText = response.trim();
    }

    return res.json({ fulfillmentText });
  } catch (err) {
    console.error("Error in webhook:", err);
    return res.json({
      fulfillmentText: "Sorry, something went wrong while processing your request.",
    });
  }
}
