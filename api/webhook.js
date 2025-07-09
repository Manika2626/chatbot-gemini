const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ fulfillmentText: "Method not allowed" });
  }

  const body = req.body;
  const queryText = body?.queryResult?.queryText || "";

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

    const result = await model.generateContent(queryText);
    const response = result.response;
    const text = response.text();

    return res.json({ fulfillmentText: text });
  } catch (err) {
    console.error("Error with Gemini:", err);
    return res.json({ fulfillmentText: "⚠️ Sorry, something went wrong." });
  }
};
