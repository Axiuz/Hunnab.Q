require("dotenv").config();
const express = require("express");
const paypal = require("@paypal/checkout-server-sdk");

const app = express();
app.use(express.json());

/* ============================
   CONFIGURAR CLIENTE PAYPAL
============================ */

function getClient() {
  const environment =
    process.env.PAYPAL_ENV === "live"
      ? new paypal.core.LiveEnvironment(
          process.env.PAYPAL_CLIENT_ID,
          process.env.PAYPAL_CLIENT_SECRET
        )
      : new paypal.core.SandboxEnvironment(
          process.env.PAYPAL_CLIENT_ID,
          process.env.PAYPAL_CLIENT_SECRET
        );

  return new paypal.core.PayPalHttpClient(environment);
}

/* ============================
   CREAR ORDEN
============================ */

app.post("/api/paypal/create-order", async (req, res) => {
  try {
    const { total } = req.body;

    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");

    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "MXN",
            value: Number(total).toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: "Hunnab.Q",
        user_action: "PAY_NOW",
        return_url: "http://localhost:3000/success",
        cancel_url: "http://localhost:3000/cancel",
      },
    });

    const client = getClient();
    const response = await client.execute(request);

    const approvalUrl =
      response.result.links.find(l => l.rel === "approve")?.href;

    res.json({
      id: response.result.id,
      approvalUrl,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creando orden PayPal" });
  }
});

/* ============================
   CAPTURAR ORDEN
============================ */

app.post("/api/paypal/capture-order", async (req, res) => {
  try {
    const { orderId } = req.body;

    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    const client = getClient();
    const response = await client.execute(request);

    res.json(response.result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error capturando orden" });
  }
});

/* ============================
   INICIAR SERVIDOR
============================ */

app.listen(process.env.PORT || 3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});