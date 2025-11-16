import { getConfig } from "../config";

export async function placeOrder(getAccessTokenSilently, orderData = {}) {
  const { audience } = getConfig();
  const apiOrigin = "http://localhost:3001"; // later replace with your Vercel API URL

  try {
    const token = await getAccessTokenSilently({
      authorizationParams: { audience },
    });

    const res = await fetch(`${apiOrigin}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(`API error: ${res.status} ${msg}`);
    }

    return res.json();
  } catch (err) {
    console.error("Order placement failed:", err);
    throw err;
  }
}