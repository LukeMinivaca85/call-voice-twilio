const express = require("express");
const twilio = require("twilio");

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

function voice() {
  return new twilio.twiml.VoiceResponse();
}

function sendTwiML(res, twiml) {
  res.type("text/xml");
  res.send(twiml.toString());
}

app.get("/", (req, res) => {
  res.send(`
    <h1>Lukintosh Voice is online</h1>
    <p>Voice endpoint: <a href="/voice">/voice</a></p>
    <p>Status: Operational</p>
  `);
});

app.get("/voice", (req, res) => {
  const twiml = voice();

  twiml.say(
    { voice: "alice", language: "en-US" },
    "Thank you for calling Lukintosh Corporation."
  );

  const gather = twiml.gather({
    numDigits: 1,
    timeout: 8,
    action: "/menu",
    method: "POST",
  });

  gather.say(
    { voice: "alice", language: "en-US" },
    "Press 1 for Lukintosh ID. Press 2 for Yeux support. Press 3 for company information. Press 4 for service status. Press 5 to leave a message."
  );

  twiml.redirect({ method: "POST" }, "/no-input");

  sendTwiML(res, twiml);
});

app.post("/menu", (req, res) => {
  const twiml = voice();
  const digit = req.body.Digits;

  if (digit === "1") {
    twiml.say(
      { voice: "alice", language: "en-US" },
      "Lukintosh ID support is currently in testing. Account login, two factor authentication, and security features are being prepared."
    );
  } else if (digit === "2") {
    twiml.say(
      { voice: "alice", language: "en-US" },
      "Yeux support is currently in testing. Yeux is the Lukintosh eye tracking control system."
    );
  } else if (digit === "3") {
    twiml.say(
      { voice: "alice", language: "en-US" },
      "Lukintosh Corporation is a technology company in development, focused on software, artificial intelligence, developer tools, and human computer interaction."
    );
  } else if (digit === "4") {
    twiml.say(
      { voice: "alice", language: "en-US" },
      "Current service status: operational. This is a testing line, not an emergency support channel."
    );
  } else if (digit === "5") {
    twiml.say(
      { voice: "alice", language: "en-US" },
      "Please leave your message after the tone. You have thirty seconds."
    );

    twiml.record({
      maxLength: 30,
      playBeep: true,
      transcribe: false,
      action: "/recording-finished",
      method: "POST",
    });

    sendTwiML(res, twiml);
    return;
  } else {
    twiml.say(
      { voice: "alice", language: "en-US" },
      "Invalid option."
    );
  }

  twiml.pause({ length: 1 });

  twiml.say(
    { voice: "alice", language: "en-US" },
    "Thank you for calling Lukintosh. Goodbye."
  );

  twiml.hangup();

  sendTwiML(res, twiml);
});

app.post("/no-input", (req, res) => {
  const twiml = voice();

  twiml.say(
    { voice: "alice", language: "en-US" },
    "No option was selected. Please visit lukintosh.com for more information."
  );

  twiml.hangup();

  sendTwiML(res, twiml);
});

app.post("/recording-finished", (req, res) => {
  console.log("New voicemail:");
  console.log("From:", req.body.From);
  console.log("Recording URL:", req.body.RecordingUrl);

  const twiml = voice();

  twiml.say(
    { voice: "alice", language: "en-US" },
    "Thank you. Your message has been recorded. Goodbye."
  );

  twiml.hangup();

  sendTwiML(res, twiml);
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Lukintosh Voice server running on port ${PORT}`);
});
