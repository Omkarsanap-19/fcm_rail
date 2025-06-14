require("dotenv").config();
const express = require("express");
const { GoogleAuth } = require("google-auth-library");
const axios = require("axios");
const path = require("path");

const app = express();
app.use(express.json());

// Load environment variables
const PORT = process.env.PORT || 3000;
const PROJECT_ID = process.env.PROJECT_ID;
const SCOPES = ["https://www.googleapis.com/auth/firebase.messaging"];

// Path to your service account JSON
const SERVICE_ACCOUNT_PATH = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);

// Auth setup
const auth = new GoogleAuth({
  keyFile: SERVICE_ACCOUNT_PATH,
  scopes: SCOPES,
});

// Send notification route
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
        token: token,
        notification: {
          title: title,
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
