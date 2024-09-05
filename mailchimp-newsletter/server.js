// server.js
const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
const crypto = require("crypto");

// Load environment variables
dotenv.config();

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Endpoint to handle donation
app.post("/donate", async (req, res) => {
  const { amount, donorName, donorPhone } = req.body;

  try {
    // Step 1: Get the OAuth token from Jenga API
    const tokenResponse = await axios.post(
      "https://uat.finserve.africa/authentication/api/v3/authenticate/merchant",
      {
        merchantCode: process.env.MERCHANT_CODE,
        consumerSecret: process.env.JENGA_CONSUMER_SECRET,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Api-Key": process.env.JENGA_API_KEY,
        },
      }
    );

    const accessToken = tokenResponse.data.accessToken;

    // Step 2: Generate the order reference
    const orderReference = `ORD-${Date.now()}`;

    // Step 3: Create the payment request
    const paymentResponse = await axios.post(
      "https://v3-uat.jengapgw.io/processPayment",
      {
        token: accessToken,
        merchantCode: process.env.MERCHANT_CODE,
        currency: "KES",
        orderAmount: amount,
        orderReference: orderReference,
        productType: "Donation",
        productDescription: "Donation Description",
        paymentTimeLimit: "15mins",
        customerFirstName: donorName.split(" ")[0],
        customerLastName: donorName.split(" ")[1] || "",
        customerPostalCodeZip: "00100",
        customerAddress: "123 Tom Mboya Street, Nairobi",
        customerEmail: "donor@example.com",
        customerPhone: donorPhone,
        callbackUrl: "http://localhost:3000/callback",
        countryCode: "KE",
        secondaryReference: "SecRef123",
        signature: `${process.env.MERCHANT_CODE}${orderReference}KES${amount}http://localhost:3000/callback`,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    res.json({
      success: true,
      message: "Donation processed successfully",
      data: paymentResponse.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error processing donation",
      error: error.message,
    });
  }
});

// Endpoint to handle the callback
app.get("/callback", (req, res) => {
  const {
    transactionId,
    status,
    date,
    desc,
    amount,
    orderReference,
    hash,
    extraData,
  } = req.query;

  // Validate the response hash (assuming you have the same secret for validation)
  const signature = crypto
    .createHash("sha256")
    .update(
      `${process.env.MERCHANT_CODE}${orderReference}KES${amount}http://localhost:3000/callback`
    )
    .digest("hex");

  if (signature !== hash) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid response signature" });
  }

  // Handle the callback data
  res.json({
    success: true,
    message: "Callback received successfully",
    data: {
      transactionId,
      status,
      date,
      desc,
      amount,
      orderReference,
      extraData,
    },
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});