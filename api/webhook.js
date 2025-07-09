const admin = require("firebase-admin");
const { Buffer } = require("buffer");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// ✅ Decode and parse Firebase credentials
if (!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 is not set in env");
}

const serviceAccountJSON = Buffer.from(
  process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
  "base64"
).toString("utf8");

const serviceAccount = JSON.parse(serviceAccountJSON);

// ✅ Initialize Firebase admin (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// ✅ Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Vercel Serverless Function entrypoint
 */
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const queryText = (req.body.queryResult?.queryText || "").toLowerCase();

    if (!queryText) {
      return res.json({
        fulfillmentText: "Sorry, I didn't get your question. Please try again.",
      });
    }

    // 🔍 Extract keywords from query
    const keywords = queryText
      .split(/[ ,]+/)
      .map((w) => w.trim())
      .filter(Boolean);

    // 🔍 Fetch announcements
    const snapshot = await db.collection("announcements").get();

    let matchedDoc = null;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const type = (data.type || "").toLowerCase();
      const title = (data.title || "").toLowerCase();

      if (
        keywords.some(
          (kw) => type.includes(kw) || title.includes(kw)
        )
      ) {
        matchedDoc = data;
      }
    });

    if (matchedDoc) {
      const message = `📢 *${matchedDoc.title}* by ${matchedDoc.authorName}\n\n${matchedDoc.description}\n\n📅 Date: ${new Date(matchedDoc.timestamp).toLocaleString()}\n\n🔗 [View Image](${matchedDoc.fileURL})`;
      return res.json({ fulfillmentText: message });
    }

    // 🤖 Fallback to Gemini (with a short, concise answer)
    const geminiPrompt = `
      Answer the following query clearly, in under 100 words:
      "${queryText}"
    `;

    const result = await model.generateContent(geminiPrompt);
    const response = result.response.text();

    return res.json({ fulfillmentText: response });
  } catch (error) {
    console.error("Error handling webhook:", error);
    return res.json({
      fulfillmentText:
        "Sorry, something went wrong while processing your request.",
    });
  }
};
