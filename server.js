const express = require("express");
const twilio = require("twilio");

const app = express();
app.use(express.urlencoded({ extended: false }));

app.get("/voice", (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();

  twiml.say({ voice: "alice", language: "en-US" },
    "Thank you for calling Lukintosh Corporation. This line is currently in testing."
  );

  res.type("text/xml");
  res.send(twiml.toString());
});

app.post("/menu", (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  const digit = req.body.Digits;

  if (digit === "1") {
    twiml.say({ voice: "alice", language: "en-US" }, "Lukintosh ID support is currently in testing.");
  } else if (digit === "2") {
    twiml.say({ voice: "alice", language: "en-US" }, "Yeux Support is currently in testing.");
  } else if (digit === "3") {
    twiml.say({ voice: "alice", language: "en-US" }, "Lukintosh Corporation is a technology company in development.");
  } else {
    twiml.say({ voice: "alice", language: "en-US" }, "Invalid option.");
  }

  twiml.pause({ length: 2 });
  twiml.say({ voice: "alice", language: "en-US" }, "Thank you for calling Lukintosh.");
  twiml.hangup();

  res.type("text/xml");
  res.send(twiml.toString());
});

app.listen(8000, () => {
  console.log("Lukintosh Voice server running on port 8000");
});
