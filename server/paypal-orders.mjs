// server/paypal-orders.mjs
import crypto from "crypto";

export class PayPalOrdersService {
  constructor({ env, clientId, clientSecret }) {
    this.env = env === "live" ? "live" : "sandbox";
    this.clientId = clientId;
    this.clientSecret = clientSecret;

    this.cachedToken = null; // { token, expiresAtMs }
  }

  baseUrl() {
    return this.env === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";
  }

  async getAccessToken() {
    const now = Date.now();
    if (this.cachedToken && now < this.cachedToken.expiresAtMs - 30_000) {
      return this.cachedToken.token;
    }

    const url = `${this.baseUrl()}/v1/oauth2/token`;
    const basic = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`PayPal OAuth error: ${res.status} ${res.statusText} ${text}`);
    }

    const data = await res.json();
    this.cachedToken = {
      token: data.access_token,
      expiresAtMs: now + Number(data.expires_in) * 1000,
    };

    return data.access_token;
  }

  async api(path, { method = "GET", body, idempotencyKey } = {}) {
    const token = await this.getAccessToken();

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    // Idempotencia (recomendado en POST)
    if (idempotencyKey) headers["PayPal-Request-Id"] = idempotencyKey;

    const res = await fetch(`${this.baseUrl()}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text().catch(() => "");
    const json = text ? safeJson(text) : null;

    if (!res.ok) {
      throw new Error(
        `PayPal API error ${res.status} ${res.statusText}: ${text || "[no body]"}`
      );
    }

    return json;
  }

  /**
   * Crea una orden de PayPal (Checkout Orders v2).
   * Te regresa id + approvalUrl para redirigir al usuario a PayPal.
   */
  async createOrder({
    currency = "MXN",
    total,
    returnUrl,
    cancelUrl,
    brandName = "Hunnab.Q",
  }) {
    const value = Number(total);
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error("Total inválido para crear orden PayPal.");
    }

    const payload = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: value.toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: brandName,
        user_action: "PAY_NOW",
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    };

    const data = await this.api("/v2/checkout/orders", {
      method: "POST",
      body: payload,
      idempotencyKey: crypto.randomUUID(),
    });

    const approvalUrl =
      Array.isArray(data?.links)
        ? data.links.find((l) => l?.rel === "approve")?.href
        : null;

    return { id: data?.id, approvalUrl, raw: data };
  }

  /**
   * Captura el pago de una orden aprobada.
   */
  async captureOrder(orderId) {
    if (!orderId) throw new Error("orderId requerido para capturar.");
    const data = await this.api(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
      method: "POST",
      body: {},
      idempotencyKey: crypto.randomUUID(),
    });
    return data;
  }

  /**
   * Consulta una orden (útil para debug/estado).
   */
  async getOrder(orderId) {
    if (!orderId) throw new Error("orderId requerido.");
    return this.api(`/v2/checkout/orders/${encodeURIComponent(orderId)}`, { method: "GET" });
  }
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}