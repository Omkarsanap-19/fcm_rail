require("dotenv").config();
const express = require("express");
const { GoogleAuth } = require("google-auth-library");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const PROJECT_ID = process.env.PROJECT_ID;
const SCOPES = ["https://www.googleapis.com/auth/firebase.messaging"];

// Create a temp file for credentials (Render doesn’t allow direct files)
const tempPath = path.join(__dirname, "tempServiceAccount.json");
fs.writeFileSync(tempPath, process.env.FIREBASE_CONFIG);

// Auth setup
const auth = new GoogleAuth({
  keyFile: tempPath,
  scopes: SCOPES,
});

app.post("/sendNotification", async (req, res) => {
  const { token, title, message } = req.body;

  if (!token || !title || !message) {
    return res.status(400).json({ error: "Missing token, title, or message" });
  }

  try {
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    const url = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;

    const notificationPayload = {
      message: {
        token,
        notification: {
          title,
          body: message,
        },
      },
    };

    const response = await axios.post(url, notificationPayload, {
      headers: {
        Authorization: `Bearer ${accessToken.token}`,
        "Content-Type": "application/json",
      },
    });

    res.status(200).json({ success: true, response: response.data });
  } catch (error) {
    console.error("Error sending FCM notification:", error.message);
    res.status(500).json({ error: "Failed to send notification", details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
