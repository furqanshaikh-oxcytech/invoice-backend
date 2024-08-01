const express = require("express");

const bodyParser = require("body-parser");
const cors = require("cors");
const authRoutes = require("../routes/auth");
require("dotenv").config();

const app = express();
// add comment
// app.use(
//   cors({
//     origin: "https://project-app-nem-frontend.vercel.app",
//     allowedHeaders: ["Accept", "Content-Type", "Authorization"],
//     methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
//     preflightContinue: false,
//     optionsSuccessStatus: 204,
//     credentials: true,
//   })
// );

// Middleware
app.use(bodyParser.json());
app.use(cors())

// Routes
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Working");
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
