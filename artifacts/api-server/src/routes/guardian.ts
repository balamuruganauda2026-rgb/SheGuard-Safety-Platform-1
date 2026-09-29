import { Router, type IRouter } from "express";

type GuardianMessage = {
  role: "user" | "assistant";
  content: string;
};

type GuardianRequest = {
  messages?: GuardianMessage[];
  context?: {
    route?: string;
  };
};

const router: IRouter = Router();

const fallbackReply = (input: string, route: string) => {
  const normalized = input.toLowerCase();

  if (/\b(urgent|danger|unsafe|emergency|help me now|attack)\b/.test(normalized)) {
    return "If you are in immediate danger, move toward a populated, safer place if you can and call 112 yourself. Open the SOS plan for the manual call link and optional, session-only location action. SheGuard cannot dispatch help, contact anyone, or confirm a call.";
  }
  if (/\b(check[\s-]?in|timer|journey|arrive)\b/.test(normalized)) {
    return "You can set a local countdown in Safety check-in. It stays visible in this browser and does not call, message, or alert your trusted contacts when time passes.";
  }
  if (/\b(location|share|coordinates|where am i)\b/.test(normalized)) {
    return "The SOS plan can ask your browser for location after you choose Get my location. The result is used for this session only and can be copied or shared manually; this app does not store or send it.";
  }
  if (/\b(cyber|digital|password|code|account|privacy)\b/.test(normalized)) {
    return "Open Digital safety for short practice scenarios, or Resource guide for the official National Cyber Crime Reporting Portal. Do not share passwords or one-time codes. This is general education, not professional advice.";
  }
  if (/\b(rights|legal|law|consent|report)\b/.test(normalized)) {
    return "Open Know your rights for plain-language orientation and Resource guide for source-linked India resources. The app cannot assess a case or provide legal advice.";
  }
  if (route === "/sos") {
    return "You are on the SOS plan. Choose the manual action that fits: call 112 yourself, or request session-only location and then share it manually. Nothing is dispatched or sent automatically.";
  }
  return "I can help you find the next step in this SheGuard demo: SOS plan, Safety check-in, Trusted contacts, Safety map, Resource guide, rights, or Digital safety. I cannot contact services, notify contacts, store location, or confirm that a call happened.";
};

const systemPrompt = `You are Guardian, the in-app safety guidance assistant for SheGuard.
Be calm, concise, practical, and non-judgmental. This is a browser-only presentation demo for India.
You may explain the app's real features: a manual tel:112 link on SOS, optional browser geolocation for the current session that is not stored, manual copy/share of that result, local trusted contacts CRUD, a local check-in countdown with no alerts, external Google Maps searches, official links in Resource guide, and general educational pages for rights and digital safety.
Never claim that SheGuard called emergency services, dispatched help, shared location, contacted trusted contacts, sent notifications, stored coordinates, checked live availability, or completed any action. Say the user must choose and confirm those actions themselves.
For immediate danger, recommend moving toward a populated safer place if possible and calling 112 themselves. Do not present yourself as emergency dispatch, a lawyer, clinician, investigator, or a replacement for official services.
Do not ask for passwords, one-time codes, API keys, or identifying details. Avoid collecting unnecessary personal information. Give short next steps and mention the relevant real in-app route when useful.
If a question requires current local facts, say the app cannot verify them and direct the user to the official links in Resource guide.`;

router.post("/guardian", async (req, res): Promise<void> => {
  const body = req.body as GuardianRequest;
  const messages = Array.isArray(body.messages)
    ? body.messages
        .filter((message) => message && (message.role === "user" || message.role === "assistant") && typeof message.content === "string")
        .map((message) => ({ role: message.role, content: message.content.trim().slice(0, 4000) }))
        .filter((message) => message.content.length > 0)
        .slice(-16)
    : [];
  const latestUserMessage = [...messages].reverse().find((message) => message.role === "user")?.content ?? "";
  const route = typeof body.context?.route === "string" ? body.context.route : "";
  const fallback = fallbackReply(latestUserMessage, route);
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    res.json({ reply: fallback, mode: "fallback" });
    return;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        max_tokens: 260,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      req.log.warn({ statusCode: response.status }, "Guardian provider request failed; using fallback");
      res.json({ reply: fallback, mode: "fallback" });
      return;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) {
      res.json({ reply: fallback, mode: "fallback" });
      return;
    }

    res.json({ reply, mode: "ai" });
  } catch (error) {
    req.log.warn({ err: error }, "Guardian provider unavailable; using fallback");
    res.json({ reply: fallback, mode: "fallback" });
  }
});

export default router;