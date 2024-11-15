const express = require("express")
const cors = require("cors");
const jwt = require("jsonwebtoken")
const { MongoClient, ServerApiVersion } = require("mongodb");
require('dotenv').config()

const app = express()

const port = process.env.PORT || 4000;

//middleware
app.use(cors())
app.use(express.json())


//mongodb
const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fbfpgjp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(url, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  const dbConnect = async()=>{
    try{
       client.connect()
       console.log("Database connected successfully")
    }catch(error){
        console.log(error.name,error.message)
    }
  }

  dbConnect()

//api

app.get("/",(req,res)=>{
    res.send("Server is running")
})





//jwt
app.post('/authentication', async(req,res)=>{
  const userEmail = req.body;
  const token = jwt.sign(userEmail, process.env.ACCESS_KEY_TOKEN,{expiresIn: '10d'});
  res.send({token})
})



app.listen(port , ()=>{
    console.log(`server is running on port ${port}`)
})
