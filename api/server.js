import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { auth, requiredScopes } from "express-oauth2-jwt-bearer";
import axios from "axios";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Quick sanity check route
app.get("/ping", (req, res) => {
  res.send("pong");
});

// Verify required environment variables
const requiredEnv = [
  "AUTH0_DOMAIN",
  "AUTH0_API_AUDIENCE",
  "AUTH0_M2M_CLIENT_ID",
  "AUTH0_M2M_CLIENT_SECRET",
];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`Missing environment variable: ${key}`);
    process.exit(1);
  }
}

// Middleware to validate JWT for the Pizza42 API
const checkJwt = auth({
  audience: process.env.AUTH0_API_AUDIENCE,
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
});

// POST /api/orders - Create and save a new order to Auth0 user metadata
app.post("/api/orders", checkJwt, requiredScopes("create:orders"), async (req, res) => {
  const order = req.body;
  const userId = req.auth.payload.sub;
  console.log("Order received:", order);

  try {
    const tokenResponse = await axios.post(
      `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
      {
        client_id: process.env.AUTH0_M2M_CLIENT_ID,
        client_secret: process.env.AUTH0_M2M_CLIENT_SECRET,
        audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
        grant_type: "client_credentials",
      },
      { headers: { "content-type": "application/json" } }
    );

    const mgmtToken = tokenResponse.data.access_token;

    const userResponse = await axios.get(
      `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(userId)}`,
      { headers: { Authorization: `Bearer ${mgmtToken}` } }
    );

    const existingMetadata = userResponse.data.user_metadata || {};
    const existingOrders = existingMetadata.orders || [];

    const updatedOrders = [...existingOrders, order];

    const patchResponse = await axios.patch(
      `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(userId)}`,
      {
        user_metadata: {
          ...existingMetadata,
          last_order: order,
          orders: updatedOrders,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${mgmtToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Patch response status:", patchResponse.status);

    res.json({
      ok: true,
      message: `Order saved for ${order.size} ${order.item}`,
      time: new Date().toISOString(),
    });
  } catch (err) {
    const errorDetails = err.response?.data || err.message;
    console.error("Error updating user metadata:", errorDetails);
    res.status(500).json({
      ok: false,
      message: "Failed to save order to profile",
      error: errorDetails,
    });
  }
});

// GET /api/orders/history - Return user's order history from Auth0 metadata
app.get("/api/orders/history", checkJwt, async (req, res) => {
  console.log("✅ /api/orders/history route hit");
  const userId = req.auth.payload.sub;
  console.log("User ID:", userId);

  try {
    const tokenResponse = await axios.post(
      `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
      {
        client_id: process.env.AUTH0_M2M_CLIENT_ID,
        client_secret: process.env.AUTH0_M2M_CLIENT_SECRET,
        audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
        grant_type: "client_credentials",
      },
      { headers: { "content-type": "application/json" } }
    );

    const mgmtToken = tokenResponse.data.access_token;

    const userResponse = await axios.get(
      `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(userId)}`,
      { headers: { Authorization: `Bearer ${mgmtToken}` } }
    );

    const metadata = userResponse.data.user_metadata || {};
    res.json({
      orders: metadata.orders || [],
      last_order: metadata.last_order || null,
    });
  } catch (err) {
    const errorDetails = err.response?.data || err.message;
    console.error("Error fetching user order history:", errorDetails);
    res.status(500).json({
      ok: false,
      message: "Failed to fetch order history",
      error: errorDetails,
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
