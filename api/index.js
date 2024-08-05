const express = require("express");
const cors = require("cors");
const helmet = require('helmet');
const authRoutes = require("../routes/auth");
const formRoutes = require('../routes/form') 
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json()); 
// app.use(cors());
app.use(helmet());

// Routes
app.use("/auth", authRoutes);
app.use("/form", formRoutes); 

app.get("/", (req, res) => {
  res.send("Working");
});

// Error handling middleware (optional)
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({ error: "Something went wrong!" });
// });

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
