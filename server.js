const express = require("express");
const app = express();

app.use(express.json());

// ------------------
// MOCK CUSTOMER DATA
// ------------------
const CUSTOMER_REGISTRY = {
  "9999999999": { status: "ACTIVE" },
  "8888888888": { status: "ACTIVE" },
  "7777777777": { status: "BLOCKED" }
};

// ------------------
// OTP STORE
// ------------------
const OTP_STORE = {};

// ------------------
// HEALTH
// ------------------
app.get("/health", (req, res) => {
  res.json({ status: "UP" });
});

// ------------------
// VERIFY CUSTOMER
// ------------------
app.post("/api/customer/verify", (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ code: "PHONE_REQUIRED" });
  }

  const customer = CUSTOMER_REGISTRY[phone];

  if (!customer) {
    return res.json({ code: "CUSTOMER_NOT_FOUND" });
  }

  if (customer.status !== "ACTIVE") {
    return res.json({ code: "CUSTOMER_BLOCKED" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  OTP_STORE[phone] = {
    otp,
    expiresAt: Date.now() + 180000
  };

  res.json({
    code: "OTP_SENT",
    otp,
    expiresInSeconds: 180
  });
});

// ------------------
// VERIFY OTP
// ------------------
app.post("/api/customer/otp/verify", (req, res) => {
  const { phone, otp } = req.body;

  const record = OTP_STORE[phone];

  if (!record) {
    return res.json({ code: "OTP_NOT_FOUND" });
  }

  if (Date.now() > record.expiresAt) {
    delete OTP_STORE[phone];
    return res.json({ code: "OTP_EXPIRED" });
  }

  if (record.otp !== otp) {
    return res.json({ code: "INVALID_OTP" });
  }

  delete OTP_STORE[phone];
  res.json({ code: "OTP_VERIFIED" });
});

// ------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
