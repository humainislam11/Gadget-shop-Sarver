const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion } = require("mongodb");
require('dotenv').config();

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  optionsSuccessStatus: 200,
}));
app.use(express.json());

// MongoDB connection
const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fbfpgjp.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(url, {
  serverApi: {
    version: ServerApiVersion.v1,
  }
});

const userCollection = client.db('gadget-shop').collection('user');
const productCollection = client.db('gadget-shop').collection('product');

// JWT middleware
const verifyJWT = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_KEY_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
};

// Database connection function
const dbConnect = async () => {
  try {
    await client.connect();
    console.log("Database connected successfully");

    // Get user
   

    // Insert user
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "User already exists" });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

  } catch (error) {
    console.error("Database connection error:", error);
  }
};

dbConnect();

// Root route
app.get("/", (req, res) => {
  res.send("Server is running");
});

// JWT Authentication
app.post('/authentication', (req, res) => {
  const userEmail = req.body;
  const token = jwt.sign(userEmail, process.env.ACCESS_KEY_TOKEN, { expiresIn: '10d' });
  res.send({ token });
});

// Protected route example
app.get('/protected', verifyJWT, (req, res) => {
  res.send({ message: "This is a protected route", user: req.decoded });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Handle server termination and close MongoDB connection
process.on('SIGINT', async () => {
  await client.close();
  console.log("Database connection closed.");
  process.exit(0);
});
