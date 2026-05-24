const express = require("express");
const twilio = require("twilio");

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const voice = { voice: "alice", language: "en-US" };

const NUMBERS = {
  MAIN_SUPPORT: {
    label: "Lukintosh Main Support",
    publicName: "United States and Canada Main Support",
    number: "1-800-753-3988",
    endpoint: "/voice/main-support",
  },
  BUSINESS: {
    label: "Lukintosh Business",
    publicName: "Business and Corporate Inquiries",
    number: "1-888-LUK-2819",
    endpoint: "/voice/business",
  },
};

function twiml() {
  return new twilio.twiml.VoiceResponse();
}

function send(res, response) {
  res.type("text/xml");
  res.send(response.toString());
}

function normalizeNumber(value = "") {
  return String(value).replace(/[^\d]/g, "");
}

function detectLineFromTwilioTo(to = "") {
  const clean = normalizeNumber(to);

  // 1-800-753-3988
  if (clean.endsWith("18007533988") || clean.endsWith("8007533988")) {
    return "MAIN_SUPPORT";
  }

  // 1-888-LUK-2819 = 1-888-585-2819
  if (clean.endsWith("18885852819") || clean.endsWith("8885852819")) {
    return "BUSINESS";
  }

  return "MAIN_SUPPORT";
}

function buildMainMenu(lineKey = "MAIN_SUPPORT") {
  const r = twiml();
  const line = NUMBERS[lineKey] || NUMBERS.MAIN_SUPPORT;

  r.pause({ length: 1 });

  r.say(voice, "Thank you for calling Lukintosh Corporation.");

  if (lineKey === "BUSINESS") {
    r.say(
      voice,
      "You have reached Lukintosh Business and Corporate Inquiries."
    );
  } else {
    r.say(
      voice,
      "You have reached Lukintosh Main Support for the United States and Canada."
    );
  }

  r.say(
    voice,
    "Your call may be monitored or recorded for quality, training, security, and service improvement purposes."
  );

  const lang = r.gather({
    numDigits: 1,
    timeout: 8,
    action: `/language?line=${lineKey}`,
    method: "POST",
  });

  lang.say(voice, "For English, press 1. Para portugues, press 2.");

  r.redirect({ method: "POST" }, line.endpoint);

  return r;
}

app.get("/", (req, res) => {
  res.send(`
    <h1>Lukintosh Voice Support</h1>
    <p>Status: online</p>

    <h2>Numbers</h2>
    <ul>
      <li><strong>Main Support:</strong> ${NUMBERS.MAIN_SUPPORT.number}</li>
      <li><strong>Business:</strong> ${NUMBERS.BUSINESS.number}</li>
    </ul>

    <h2>Twilio Webhooks</h2>
    <ul>
      <li><a href="/voice/main-support">/voice/main-support</a> — 1-800 main support</li>
      <li><a href="/voice/business">/voice/business</a> — 1-888 business</li>
      <li><a href="/voice">/voice</a> — automatic fallback by Twilio To number</li>
      <li><a href="/preview">/preview</a> — full browser preview</li>
    </ul>
  `);
});

// Fallback antigo: detecta automaticamente pelo número chamado.
app.get("/voice", (req, res) => {
  const lineKey = detectLineFromTwilioTo(req.query.To || req.body?.To || "");
  send(res, buildMainMenu(lineKey));
});

app.post("/voice", (req, res) => {
  const lineKey = detectLineFromTwilioTo(req.body.To || "");
  send(res, buildMainMenu(lineKey));
});

// Endpoint oficial do 1-800 principal.
app.get("/voice/main-support", (req, res) => {
  send(res, buildMainMenu("MAIN_SUPPORT"));
});

app.post("/voice/main-support", (req, res) => {
  send(res, buildMainMenu("MAIN_SUPPORT"));
});

// Endpoint oficial do 1-888-LUK-2819 Business.
app.get("/voice/business", (req, res) => {
  send(res, buildMainMenu("BUSINESS"));
});

app.post("/voice/business", (req, res) => {
  send(res, buildMainMenu("BUSINESS"));
});

app.get("/preview", (req, res) => {
  const r = twiml();

  r.say(voice, "Thank you for calling Lukintosh Corporation.");
  r.say(
    voice,
    "Your call may be monitored or recorded for quality, training, security, and service improvement purposes."
  );

  r.say(voice, "For English, press 1. Para portugues, press 2.");
  r.say(voice, "Please listen carefully as our menu options have recently changed.");
  r.say(voice, "For Lukintosh Accounts and sign in support, press 1.");
  r.say(voice, "For Yeux accessibility and eye tracking support, press 2.");
  r.say(voice, "For developer tools, APIs, and platform services, press 3.");
  r.say(voice, "For security, abuse, and account protection, press 4.");
  r.say(voice, "For company, media, and business information, press 5.");
  r.say(voice, "Before we continue, we need to collect a few details.");
  r.say(voice, "Please enter your six digit support code or ticket number.");
  r.say(voice, "Please hold while we route your call to the correct support channel.");
  r.say(voice, "Your call is important to us. Current estimated wait time is less than one minute.");
  r.say(voice, "All support specialists are currently unavailable on this testing line.");
  r.say(voice, "Please leave your message after the tone.");

  send(res, r);
});

app.post("/language", (req, res) => {
  const r = twiml();

  const digit = req.body.Digits;
  const lineKey = req.query.line || "MAIN_SUPPORT";

  if (digit !== "1") {
    r.say(
      voice,
      "Portuguese support is not available on this testing line yet. Continuing in English."
    );
  }

  if (lineKey === "BUSINESS") {
    r.say(
      voice,
      "You are now in the Lukintosh Business and Corporate Inquiries menu."
    );
  } else {
    r.say(
      voice,
      "You are now in the Lukintosh Main Support menu."
    );
  }

  r.say(voice, "Please listen carefully as our menu options have recently changed.");

  const gather = r.gather({
    numDigits: 1,
    timeout: 10,
    action: `/department?line=${lineKey}`,
    method: "POST",
  });

  if (lineKey === "BUSINESS") {
    gather.say(voice, "For business partnerships, press 1.");
    gather.say(voice, "For developer relations, press 2.");
    gather.say(voice, "For media and press inquiries, press 3.");
    gather.say(voice, "For legal, compliance, or security matters, press 4.");
    gather.say(voice, "For general corporate information, press 5.");
  } else {
    gather.say(voice, "For Lukintosh Accounts and sign in support, press 1.");
    gather.say(voice, "For Yeux accessibility and eye tracking support, press 2.");
    gather.say(voice, "For developer tools, APIs, and platform services, press 3.");
    gather.say(voice, "For security, abuse, and account protection, press 4.");
    gather.say(voice, "For company, media, and business information, press 5.");
  }

  r.redirect({ method: "POST" }, `/language?line=${lineKey}`);

  send(res, r);
});

app.post("/department", (req, res) => {
  const r = twiml();

  const lineKey = req.query.line || "MAIN_SUPPORT";
  const department = req.body.Digits || "unknown";

  r.say(voice, "Before we continue, we need to collect a few details.");

  const gather = r.gather({
    input: "dtmf",
    numDigits: 6,
    timeout: 12,
    action: `/account?line=${lineKey}&department=${department}`,
    method: "POST",
  });

  gather.say(
    voice,
    "Please enter your six digit support code or ticket number. If you do not have one, enter zero zero zero zero zero zero."
  );

  r.redirect(
    { method: "POST" },
    `/account?line=${lineKey}&department=${department}`
  );

  send(res, r);
});

app.post("/account", (req, res) => {
  const r = twiml();

  const lineKey = req.query.line || "MAIN_SUPPORT";
  const department = req.query.department || "unknown";
  const ticket = req.body.Digits || "000000";

  r.say(voice, `Thank you. Your reference code is ${ticket.split("").join(" ")}.`);

  const gather = r.gather({
    input: "dtmf",
    numDigits: 1,
    timeout: 10,
    action: `/reason?line=${lineKey}&department=${department}&ticket=${ticket}`,
    method: "POST",
  });

  if (lineKey === "BUSINESS") {
    gather.say(voice, "For partnership or commercial opportunities, press 1.");
    gather.say(voice, "For developer platform or API inquiries, press 2.");
    gather.say(voice, "For media, press, or brand inquiries, press 3.");
    gather.say(voice, "For legal, trust, or compliance matters, press 4.");
    gather.say(voice, "For another business reason, press 5.");
  } else {
    gather.say(voice, "For login or password issues, press 1.");
    gather.say(voice, "For product setup or installation, press 2.");
    gather.say(voice, "For billing or subscription information, press 3.");
    gather.say(voice, "For technical errors, press 4.");
    gather.say(voice, "For another reason, press 5.");
  }

  r.redirect(
    { method: "POST" },
    `/reason?line=${lineKey}&department=${department}&ticket=${ticket}`
  );

  send(res, r);
});

app.post("/reason", (req, res) => {
  const r = twiml();

  const lineKey = req.query.line || "MAIN_SUPPORT";
  const line = NUMBERS[lineKey] || NUMBERS.MAIN_SUPPORT;

  const department = req.query.department || "unknown";
  const ticket = req.query.ticket || "000000";
  const reason = req.body.Digits || "unknown";

  console.log("New support call:", {
    line: line.label,
    publicName: line.publicName,
    calledNumber: req.body.To,
    from: req.body.From,
    country: req.body.FromCountry,
    department,
    ticket,
    reason,
  });

  r.say(voice, "Thank you. We are checking your information.");
  r.pause({ length: 1 });

  r.say(voice, "Please hold while we route your call to the correct support channel.");
  r.play("https://lukintosh.com/public/lukintosh_hold.mp3");

  r.say(
    voice,
    "Your call is important to us. Current estimated wait time is less than one minute."
  );

  r.pause({ length: 2 });

  r.say(voice, "All support specialists are currently unavailable on this testing line.");

  if (lineKey === "BUSINESS") {
    r.say(
      voice,
      "You may leave a business message after the tone. Please include your name, organization, email address, and a short description of your inquiry."
    );
  } else {
    r.say(
      voice,
      "You may leave a support message after the tone. Please include your name, email address, and a short description of the issue."
    );
  }

  r.record({
    maxLength: 45,
    playBeep: true,
    transcribe: false,
    action: `/voicemail?line=${lineKey}&department=${department}&ticket=${ticket}&reason=${reason}`,
    method: "POST",
  });

  send(res, r);
});

app.post("/voicemail", (req, res) => {
  const r = twiml();

  const lineKey = req.query.line || "MAIN_SUPPORT";
  const line = NUMBERS[lineKey] || NUMBERS.MAIN_SUPPORT;

  console.log("Voicemail received:", {
    line: line.label,
    publicName: line.publicName,
    from: req.body.From,
    to: req.body.To,
    recordingUrl: req.body.RecordingUrl,
    duration: req.body.RecordingDuration,
    department: req.query.department,
    ticket: req.query.ticket,
    reason: req.query.reason,
  });

  r.say(voice, "Thank you. Your message has been recorded.");
  r.say(voice, "A support record has been created for this call.");
  r.say(voice, "Goodbye.");
  r.hangup();

  send(res, r);
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Lukintosh Voice Support running on port ${PORT}`);
  console.log(`Main Support endpoint: ${NUMBERS.MAIN_SUPPORT.endpoint}`);
  console.log(`Business endpoint: ${NUMBERS.BUSINESS.endpoint}`);
});
