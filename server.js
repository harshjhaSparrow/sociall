import express from 'express';
import cors from 'cors';
import { MongoClient, ServerApiVersion } from 'mongodb';


const app = express();
const port = 5000;

// Enable CORS to allow frontend to communicate with this backend
app.use(cors());
app.use(express.json());

// MongoDB Credentials provided
const uri = "mongodb+srv://harshjha19101997:UysDNAaDLvU0ZE2u@cluster0.xve5ejh.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db;
const DB_NAME = "socially_db";

async function run() {
  try {
    // Connect the client to the server
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    db = client.db(DB_NAME);
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    console.log(`Server listening on http://localhost:${port}`);
  } catch (e) {
    console.error("MongoDB connection error:", e);
  }
}
run().catch(console.dir);

// --- API ROUTES ---

// 1. Sign Up
app.post('/api/auth/signup', async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });
  
  try {
    const { email, password } = req.body;
    const users = db.collection('users');
    
    // Check if user exists
    const existing = await users.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Email already in use" });
    }

    // Create user (Note: In production, hash the password!)
    const newUser = {
      email,
      password, 
      createdAt: new Date()
    };
    
    const result = await users.insertOne(newUser);
    res.json({ user: { uid: result.insertedId.toString(), email } });
  } catch (error) {
    res.status(500).json({ error: "Signup failed" });
  }
});

// 2. Login
app.post('/api/auth/login', async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });

  try {
    const { email, password } = req.body;
    const users = db.collection('users');
    
    // Find user by credentials
    const user = await users.findOne({ email, password });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    res.json({ user: { uid: user._id.toString(), email } });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

// 3. Get Profile
app.get('/api/profile/:uid', async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });

  try {
    const profiles = db.collection('profiles');
    const profile = await profiles.findOne({ uid: req.params.uid });
    
    // Return null if not found, frontend handles redirection
    res.json(profile || null);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// 4. Create/Update Profile
app.post('/api/profile/:uid', async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });

  try {
    const { uid } = req.params;
    const data = req.body;
    const profiles = db.collection('profiles');
    
    // Upsert (Update if exists, Insert if new)
    await profiles.updateOne(
      { uid },
      { $set: { ...data, uid, updatedAt: new Date() } },
      { upsert: true }
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile" });
  }
});

app.listen(port, () => {
  // Console log handled in run() after db connection
});