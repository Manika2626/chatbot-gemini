const { GoogleGenerativeAI } = require("@google/generative-ai");
const admin = require("firebase-admin");

// decode base64 service account key from env
const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf-8")
);

// initialize firebase app if not already
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ fulfillmentText: "Method not allowed" });
  }

  const body = req.body;
  const queryText = body?.queryResult?.queryText?.toLowerCase().trim() || "";

  try {
    // 🔷 First, try to find a matching document where title matches query
    const snapshot = await db.collection("announcements")
      .where("title", "==", queryText)
      .get();

    if (!snapshot.empty) {
      const doc = snapshot.docs[0].data();

      const message = `📢 *${doc.title}* by ${doc.authorName}\n\n${doc.description}\n\n📅 Date: ${new Date(doc.timestamp).toLocaleString()}\n\n🔗 [View Image](${doc.fileURL})`;

      return res.json({ fulfillmentText: message });
    }

    // 🔷 If not found, fallback to Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    const result = await model.generateContent(queryText);
    const response = result.response;
    const text = response.text();

    return res.json({ fulfillmentText: text });
  } catch (err) {
    console.error("Error:", err);
    return res.json({ fulfillmentText: "⚠️ Sorry, something went wrong." });
  }
};
