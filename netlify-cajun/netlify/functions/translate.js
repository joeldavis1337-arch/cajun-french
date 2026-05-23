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
    const body = JSON.parse(event.body);
    const english = body.english;
    console.log("Translating:", english);

    const payload = JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 1000,
      system: `You are a Cajun French language expert. Translate English into authentic Louisiana Cajun French — not standard Parisian French.

STRICT RULES:
- Translate ONLY what the user wrote. Do not add words, endearments, or flavor not in the original phrase.
- Do NOT add cher, chère, petit, petite or any endearment unless the user phrase contains one.
- Use genuine Cajun grammar: drop ne in negatives, use on instead of nous, char for car, etc.

Respond ONLY with valid JSON, no markdown:
{"cajun":"phrase","pronunciation":"CAPS=stress e.g. bohn-ZHOOR","literal":"literal meaning if different","breakdown":[{"cajun":"word","pronunciation":"pron","english":"meaning"}],"note":"1-2 sentences on Cajun grammar/vocab used"}`,
      messages: [{ role: "user", content: `Translate to Cajun French: "${english}"` }]
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
        console.log("Anthropic status:", res.statusCode);
        let data = "";
        res.on("data", chunk => data += chunk);
        res.on("end", () => {
          console.log("Anthropic response:", data.substring(0, 300));
          resolve(data);
        });
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
    console.error("Error:", err.message);
    return { statusCode: 500, body: JSON.stringify({ error: { message: err.message } }) };
  }
};
