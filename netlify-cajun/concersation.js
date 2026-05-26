const https = require("https");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: { message: "API key not configured" } }) };
  }

  try {
    const { messages, scenario, kidsMode } = JSON.parse(event.body);

    const systemPrompt = kidsMode
      ? `You are Tee (short for Petit), a 7-year-old Cajun French speaking child from Mamou, Louisiana. You speak authentic Louisiana Cajun French mixed with some English like a real Cajun child would. You are playful, energetic, and respond like a real kid. 

The adult is practicing speaking Cajun French with you. Respond naturally in Cajun French the way a Mamou child would speak. Keep responses short like a child would say them.

After your response, on a new line add:
PRONUNCIATION: [pronunciation guide using CAPS for stressed syllables]
ENGLISH: [what you said in English]
CORRECTION: [if the user made a mistake, gently note it here, otherwise leave blank]

Stay in character as a Cajun child the whole time.`
      : `You are Clothilde, a warm Cajun French speaking woman from Mamou, Louisiana in her 60s. You speak authentic Louisiana Cajun French — not standard Parisian French. You use real Cajun vocabulary: "char" for car, drop "ne" in negatives, use "on" for we, say "cher" and "chère" as endearments, use words like "parrain", "minou", "graton", "frisson", "honteux", "comme ci comme ça".

Current scenario: ${scenario}

The person you are speaking with is learning Cajun French. Speak naturally in Cajun French. Keep responses conversational — 1 to 3 sentences. 

After your Cajun response, on a new line add:
PRONUNCIATION: [pronunciation guide using CAPS for stressed syllables]
ENGLISH: [what you said in English]  
CORRECTION: [if the user made a Cajun French mistake worth noting, gently correct it here, otherwise leave blank]

Be warm, encouraging, and patient. Stay in character the whole time.`;

    const payload = JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 500,
      system: systemPrompt,
      messages: messages
    });

    const result = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: "api.anthropic.com",
        path: "/v1/messages",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Length": Buffer.byteLength(payload)
        }
      }, (res) => {
        let data = "";
        res.on("data", chunk => data += chunk);
        res.on("end", () => resolve(data));
      });
      req.on("error", reject);
      req.write(payload);
      req.end();
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: result
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: { message: err.message } }) };
  }
};
