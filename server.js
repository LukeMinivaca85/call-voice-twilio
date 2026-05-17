const express = require("express");
const twilio = require("twilio");

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const voice = { voice: "alice", language: "en-US" };

function twiml() {
  return new twilio.twiml.VoiceResponse();
}

function send(res, response) {
  res.type("text/xml");
  res.send(response.toString());
}

function buildMainMenu() {
  const r = twiml();

  r.pause({ length: 1 });

  r.say(voice, "Thank you for calling Lukintosh Corporation.");
  r.say(
    voice,
    "Your call may be monitored or recorded for quality, training, security, and service improvement purposes."
  );

  const lang = r.gather({
    numDigits: 1,
    timeout: 8,
    action: "/language",
    method: "POST",
  });

  lang.say(voice, "For English, press 1. Para portugues, press 2.");

  r.redirect({ method: "POST" }, "/voice");

  return r;
}

app.get("/", (req, res) => {
  res.send(`
    <h1>Lukintosh Voice Support</h1>
    <p>Status: online</p>
    <p><a href="/voice">Voice XML preview</a></p>
    <p><a href="/preview">Full browser preview</a></p>
  `);
});

app.get("/voice", (req, res) => {
  send(res, buildMainMenu());
});

app.post("/voice", (req, res) => {
  send(res, buildMainMenu());
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

  if (digit !== "1") {
    r.say(voice, "Portuguese support is not available on this testing line yet. Continuing in English.");
  }

  r.say(voice, "Please listen carefully as our menu options have recently changed.");

  const gather = r.gather({
    numDigits: 1,
    timeout: 10,
    action: "/department",
    method: "POST",
  });

  gather.say(voice, "For Lukintosh Accounts and sign in support, press 1.");
  gather.say(voice, "For Yeux accessibility and eye tracking support, press 2.");
  gather.say(voice, "For developer tools, APIs, and platform services, press 3.");
  gather.say(voice, "For security, abuse, and account protection, press 4.");
  gather.say(voice, "For company, media, and business information, press 5.");

  r.redirect({ method: "POST" }, "/language");

  send(res, r);
});

app.post("/department", (req, res) => {
  const r = twiml();
  const department = req.body.Digits || "unknown";

  r.say(voice, "Before we continue, we need to collect a few details.");

  const gather = r.gather({
    input: "dtmf",
    numDigits: 6,
    timeout: 12,
    action: `/account?department=${department}`,
    method: "POST",
  });

  gather.say(
    voice,
    "Please enter your six digit support code or ticket number. If you do not have one, enter zero zero zero zero zero zero."
  );

  r.redirect({ method: "POST" }, `/account?department=${department}`);

  send(res, r);
});

app.post("/account", (req, res) => {
  const r = twiml();
  const department = req.query.department || "unknown";
  const ticket = req.body.Digits || "000000";

  r.say(voice, `Thank you. Your reference code is ${ticket.split("").join(" ")}.`);

  const gather = r.gather({
    input: "dtmf",
    numDigits: 1,
    timeout: 10,
    action: `/reason?department=${department}&ticket=${ticket}`,
    method: "POST",
  });

  gather.say(voice, "For login or password issues, press 1.");
  gather.say(voice, "For product setup or installation, press 2.");
  gather.say(voice, "For billing or subscription information, press 3.");
  gather.say(voice, "For technical errors, press 4.");
  gather.say(voice, "For another reason, press 5.");

  r.redirect({ method: "POST" }, `/reason?department=${department}&ticket=${ticket}`);

  send(res, r);
});

app.post("/reason", (req, res) => {
  const r = twiml();

  const department = req.query.department || "unknown";
  const ticket = req.query.ticket || "000000";
  const reason = req.body.Digits || "unknown";

  console.log("New support call:", {
    from: req.body.From,
    to: req.body.To,
    country: req.body.FromCountry,
    department,
    ticket,
    reason,
  });

  r.say(voice, "Thank you. We are checking your information.");
  r.pause({ length: 1 });

  r.say(voice, "Please hold while we route your call to the correct support channel.");
  r.play("https://api.twilio.com/cowbell.mp3");

  r.say(voice, "Your call is important to us. Current estimated wait time is less than one minute.");
  r.pause({ length: 2 });

  r.say(voice, "All support specialists are currently unavailable on this testing line.");
  r.say(
    voice,
    "You may leave a message after the tone. Please include your name, email address, and a short description of the issue."
  );

  r.record({
    maxLength: 45,
    playBeep: true,
    transcribe: false,
    action: `/voicemail?department=${department}&ticket=${ticket}&reason=${reason}`,
    method: "POST",
  });

  send(res, r);
});

app.post("/voicemail", (req, res) => {
  const r = twiml();

  console.log("Voicemail received:", {
    from: req.body.From,
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
});
