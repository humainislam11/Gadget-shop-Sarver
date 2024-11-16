const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173", // Update to your frontend's URL
  })
);
app.use(express.json());

// JWT Middleware
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  const token = authorization.split(" ")[1];
  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  jwt.verify(token, process.env.ACCESS_KEY_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Invalid token" });
    }
    req.decoded = decoded;
    next();
  });
};

// Verify Seller Middleware
const verifySeller = async (req, res, next) => {
  const email = req.decoded.email;
  const query = { email: email };
  const user = await userCollection.findOne(query);
  if (user?.role !== "seller") {
    return res.status(403).send({ message: "Forbidden Access" });
  }
  next();
};

// MongoDB Connection
const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fbfpgjp.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(url, {
  serverApi: {
    version: ServerApiVersion.v1,
  },
});

const userCollection = client.db("gadget-shop").collection("user");
const productCollection = client.db("gadget-shop").collection("product");

// Database Connection Function
const dbConnect = async () => {
  try {
    await client.connect();
    console.log("Database connected successfully");

    // Routes
    // Get User by Email
    app.get("/user/:email", async (req, res) => {
      const query = { email: req.params.email };
      const user = await userCollection.findOne(query);
      res.send(user);
    });

    // Add Product
    app.post("/addProduct", verifyJWT, verifySeller, async (req, res) => {
      const product = req.body;
      const result = await productCollection.insertOne(product);
      res.send(result);
    });

    // Insert User
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

// Root Route
app.get("/", (req, res) => {
  res.send("Server is running");
});

// JWT Authentication
app.post("/authentication", (req, res) => {
  const userEmail = req.body;
  const token = jwt.sign(userEmail, process.env.ACCESS_KEY_TOKEN, { expiresIn: "10d" });
  res.send({ token });
});

// Start Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Handle Server Termination and Close MongoDB Connection
process.on("SIGINT", async () => {
  await client.close();
  console.log("Database connection closed.");
  process.exit(0);
});
