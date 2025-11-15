const express = require("express");
const cors = require("cors");
const { Resend } = require("resend");

const app = express();
app.use(cors());
app.use(express.json());

const resend = new Resend(process.env.RESEND_API_KEY);

app.post("/api/send-code", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ ok:false, error:"email required" });

    // 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const r = await resend.emails.send({
      from: "FuturBet <noreply@yourdomain.com>", // use a verified sender
      to: email,
      subject: "Your FuturBet login code",
      text: `Your code is ${code}. It expires in 10 minutes.`
    });

    if (r.error) return res.status(500).json({ ok:false, error:r.error.message });

    res.json({ ok:true, codeSent:true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok:false, error:"send failed" });
  }
});

const PORT = 8787;
app.listen(PORT, () => {
  console.log(`Email API running at http://localhost:${PORT}`);
});
