import cors from 'cors';
import express from 'express';
import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb';
// const { MongoClient, ServerApiVersion, ObjectId } = mongodb;

const app = express();
const port = 5000;

// Enable CORS to allow frontend to communicate with this backend
app.use(cors());
// Increase payload limit to 10MB to handle base64 images
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

const DUMMY_POSTS = [
  {
    uid: "dummy_user_1",
    authorName: "Sarah Jenkins",
    authorPhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    content: "Just arrived in Bali! The weather is absolutely perfect. Cannot wait to explore the temples tomorrow. 🌴☀️ #travel #vacation",
    imageURL: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
    likes: 142,
    likedBy: [],
    comments: [],
    createdAt: Date.now() - 86400000, // 1 day ago
    location: { lat: -8.4095, lng: 115.1889, name: "Bali, Indonesia" }
  },
  {
    uid: "dummy_user_2",
    authorName: "Tech Daily",
    authorPhoto: "",
    content: "The new AI models are changing everything about how we build software. It's not just about writing code anymore, it's about architectural thinking. What are your thoughts? 💻",
    likes: 328,
    likedBy: [],
    comments: [],
    createdAt: Date.now() - 43200000, // 12 hours ago
    location: { lat: 37.7749, lng: -122.4194, name: "San Francisco, CA" }
  },
  {
    uid: "dummy_user_3",
    authorName: "Alex Rivera",
    authorPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop",
    content: "Made this amazing spicy pasta from scratch today. The secret is in the fresh basil! Who wants the recipe? 🍝",
    imageURL: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&q=80",
    likes: 85,
    likedBy: [],
    comments: [],
    createdAt: Date.now() - 3600000, // 1 hour ago
    location: { lat: 40.7128, lng: -74.0060, name: "New York, NY" }
  },
  {
    uid: "dummy_user_4",
    authorName: "Marcus Chen",
    authorPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
    content: "Golden hour hike. The view from the top made the 2 hour trek completely worth it. 🏔️",
    imageURL: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
    likes: 210,
    likedBy: [],
    comments: [],
    createdAt: Date.now() - 172800000, // 2 days ago
    location: { lat: 34.0522, lng: -118.2437, name: "Los Angeles, CA" }
  }
];

async function run() {
  try {
    // Connect the client to the server
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    db = client.db(DB_NAME);
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // Seed dummy posts if empty
    const postsCollection = db.collection('posts');
    const count = await postsCollection.countDocuments();
    if (count === 0) {
      console.log("Database empty. Seeding with dummy posts...");
      await postsCollection.insertMany(DUMMY_POSTS);
      console.log("Seeded successfully.");
    }

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

// 3b. Get All Profiles (for Map)
app.get('/api/profiles', async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });

  try {
    const profiles = db.collection('profiles');
    // Only return profiles that have a location
    const users = await profiles.find({ 
      lastLocation: { $exists: true, $ne: null } 
    }).project({ 
      uid: 1, 
      displayName: 1, 
      photoURL: 1, 
      lastLocation: 1,
      interests: 1,
      bio: 1,
      instagramHandle: 1,
      friends: 1
    }).limit(100).toArray();
    
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch profiles" });
  }
});

// 3c. Get Batch Profiles (For Friend Requests list)
app.post('/api/profiles/batch', async (req, res) => {
    if (!db) return res.status(503).json({ error: "Database not connected" });
    try {
        const { uids } = req.body;
        if (!Array.isArray(uids) || uids.length === 0) return res.json([]);

        const profiles = db.collection('profiles');
        const users = await profiles.find({ uid: { $in: uids } }).project({
            uid: 1, 
            displayName: 1, 
            photoURL: 1
        }).toArray();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch batch profiles" });
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

// 5. Friend Request Logic
app.post('/api/friends/request', async (req, res) => {
    if (!db) return res.status(503).json({ error: "Database not connected" });
    try {
        const { fromUid, toUid } = req.body;
        const profiles = db.collection('profiles');

        // Add to outgoing of sender
        await profiles.updateOne(
            { uid: fromUid },
            { $addToSet: { outgoingRequests: toUid } }
        );
        // Add to incoming of receiver
        await profiles.updateOne(
            { uid: toUid },
            { $addToSet: { incomingRequests: fromUid } }
        );

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to send request" });
    }
});

app.post('/api/friends/accept', async (req, res) => {
    if (!db) return res.status(503).json({ error: "Database not connected" });
    try {
        const { userUid, requesterUid } = req.body;
        const profiles = db.collection('profiles');

        // Update User (Accepter)
        await profiles.updateOne(
            { uid: userUid },
            { 
                $pull: { incomingRequests: requesterUid },
                $addToSet: { friends: requesterUid }
            }
        );

        // Update Requester
        await profiles.updateOne(
            { uid: requesterUid },
            { 
                $pull: { outgoingRequests: userUid },
                $addToSet: { friends: userUid }
            }
        );

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to accept request" });
    }
});

app.post('/api/friends/reject', async (req, res) => {
    if (!db) return res.status(503).json({ error: "Database not connected" });
    try {
        const { userUid, requesterUid } = req.body;
        const profiles = db.collection('profiles');

        await profiles.updateOne(
            { uid: userUid },
            { $pull: { incomingRequests: requesterUid } }
        );
        
        // Also remove from requester's outgoing
        await profiles.updateOne(
            { uid: requesterUid },
            { $pull: { outgoingRequests: userUid } }
        );

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to reject request" });
    }
});

app.post('/api/friends/remove', async (req, res) => {
    if (!db) return res.status(503).json({ error: "Database not connected" });
    try {
        const { uid1, uid2 } = req.body;
        const profiles = db.collection('profiles');

        await profiles.updateOne({ uid: uid1 }, { $pull: { friends: uid2 } });
        await profiles.updateOne({ uid: uid2 }, { $pull: { friends: uid1 } });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to remove friend" });
    }
});


// 6. Create Post
app.post('/api/posts', async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });
  try {
    const postData = req.body;
    const posts = db.collection('posts');
    const result = await posts.insertOne({
      ...postData,
      likes: 0,
      likedBy: [],
      comments: [],
      createdAt: Date.now()
    });
    res.json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error("Create Post Error:", error);
    res.status(500).json({ error: "Failed to create post" });
  }
});

// 7. Get All Posts
app.get('/api/posts', async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });
  try {
    const posts = db.collection('posts');
    // Get latest 50 posts, sorted by newest first
    const allPosts = await posts.find({}).sort({ createdAt: -1 }).limit(50).toArray();
    res.json(allPosts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// 8. Get User Posts - API to fetch posts created by a particular user
app.get('/api/posts/user/:uid', async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });
  try {
    const posts = db.collection('posts');
    // Filter by uid to only get posts created by this user
    const userPosts = await posts.find({ uid: req.params.uid }).sort({ createdAt: -1 }).toArray();
    res.json(userPosts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user posts" });
  }
});

// 9. Get Single Post
app.get('/api/posts/:id', async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });
  try {
    const postId = req.params.id;
    if (!ObjectId.isValid(postId)) return res.status(400).json({ error: "Invalid ID" });

    const posts = db.collection('posts');
    const post = await posts.findOne({ _id: new ObjectId(postId) });
    if (!post) return res.status(404).json({ error: "Post not found" });
    
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

// 10. Update Post
app.put('/api/posts/:id', async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });
  try {
    const postId = req.params.id;
    const { uid, content, imageURL } = req.body;

    if (!ObjectId.isValid(postId)) return res.status(400).json({ error: "Invalid ID" });

    const posts = db.collection('posts');
    const post = await posts.findOne({ _id: new ObjectId(postId) });

    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.uid !== uid) return res.status(403).json({ error: "Unauthorized" });

    const updateDoc = {
      $set: {
        content,
        imageURL,
        updatedAt: Date.now()
      }
    };

    await posts.updateOne({ _id: new ObjectId(postId) }, updateDoc);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update post" });
  }
});

// 11. Delete Post
app.delete('/api/posts/:id', async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });
  try {
    const postId = req.params.id;
    const { uid } = req.body; // Need uid in body to verify ownership

    if (!ObjectId.isValid(postId)) return res.status(400).json({ error: "Invalid ID" });

    const posts = db.collection('posts');
    const post = await posts.findOne({ _id: new ObjectId(postId) });

    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.uid !== uid) return res.status(403).json({ error: "Unauthorized" });

    await posts.deleteOne({ _id: new ObjectId(postId) });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete post" });
  }
});

// 12. Toggle Like
app.post('/api/posts/:id/like', async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });
  try {
    const postId = req.params.id;
    const { uid } = req.body;
    
    if (!uid) return res.status(400).json({ error: "User ID required" });

    if (!ObjectId.isValid(postId)) {
      return res.status(400).json({ error: "Invalid Post ID" });
    }

    const posts = db.collection('posts');
    const post = await posts.findOne({ _id: new ObjectId(postId) });

    if (!post) return res.status(404).json({ error: "Post not found" });

    const likedBy = post.likedBy || [];
    const isLiked = likedBy.includes(uid);

    let update;
    if (isLiked) {
      update = {
        $pull: { likedBy: uid },
        $inc: { likes: -1 }
      };
    } else {
      update = {
        $addToSet: { likedBy: uid },
        $inc: { likes: 1 }
      };
    }

    await posts.updateOne({ _id: new ObjectId(postId) }, update);
    const updatedPost = await posts.findOne({ _id: new ObjectId(postId) });
    
    if (!updatedPost) return res.status(404).json({ error: "Post not found after update" });

    res.json({ likes: updatedPost.likes, likedBy: updatedPost.likedBy || [] });
  } catch (error) {
    console.error("Toggle Like Error:", error);
    res.status(500).json({ error: "Failed to toggle like: " + error.message });
  }
});

// 13. Add Comment
app.post('/api/posts/:id/comment', async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });
  try {
    const postId = req.params.id;
    const { uid, text } = req.body;
    
    if (!uid || !text) return res.status(400).json({ error: "Missing required fields" });
    if (!ObjectId.isValid(postId)) return res.status(400).json({ error: "Invalid Post ID" });

    // Fetch user profile for author details
    const profiles = db.collection('profiles');
    const userProfile = await profiles.findOne({ uid });
    
    // Fallback if profile not found
    const authorName = userProfile?.displayName || "User";
    const authorPhoto = userProfile?.photoURL || "";

    const newComment = {
      id: new ObjectId(), 
      uid,
      authorName,
      authorPhoto,
      text,
      createdAt: Date.now()
    };

    const posts = db.collection('posts');
    await posts.updateOne(
      { _id: new ObjectId(postId) },
      { $push: { comments: newComment } }
    );
    
    res.json(newComment);
  } catch (error) {
    console.error("Add Comment Error:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

app.listen(port, () => {
  // Console log handled in run() after db connection
});