const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") {
    // handle CORS preflight
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ fulfillmentText: "🚫 Method not allowed" });
  }

  const body = req.body;
  const queryText = body?.queryResult?.queryText || "";

  if (!queryText.trim()) {
    return res.json({ fulfillmentText: "🤔 Please ask something." });
  }

  try {
    // use the correct Gemini Pro model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const result = await model.generateContent(queryText);

    const response = result.response;
    const text = response.text();

    if (!text.trim()) {
      throw new Error("Empty response from Gemini");
    }

    return res.json({ fulfillmentText: text.trim() });
  } catch (err) {
    console.error("❌ Error with Gemini:", err);
    return res.json({
      fulfillmentText: "⚠️ Sorry, something went wrong with Gemini.",
    });
  }
};
