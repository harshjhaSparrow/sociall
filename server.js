import cors from "cors";
import express from "express";
import http from "http";
import path from "path";
import WebSocket, { WebSocketServer } from "ws";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
//this is for hosting frontend in render
app.use(express.static(path.join(__dirname, "dist")));

//this is for hosting frontend in render
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const port = process.env.PORT || 5000;
// Create HTTP server wrapping Express
const server = http.createServer(app);

// Initialize WebSocket Server
const wss = new WebSocketServer({ server });

// Enable CORS to allow frontend to communicate with this backend
app.use(cors());
// Increase payload limit to 10MB to handle base64 images
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// MongoDB Credentials provided
const uri =
  "mongodb+srv://harshjha19101997:UysDNAaDLvU0ZE2u@cluster0.xve5ejh.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
  tls: true,
  retryWrites: true,
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;
const DB_NAME = "socially_db";
const clients = new Map(); // uid -> Set<WebSocket>

// --- WebSocket Logic ---
wss.on("connection", (ws, req) => {
  // Extract UID from query params (e.g. /?uid=123)
  const urlParams = new URLSearchParams(req.url.split("?")[1]);
  const uid = urlParams.get("uid");

  if (uid) {
    if (!clients.has(uid)) {
      clients.set(uid, new Set());
    }
    clients.get(uid).add(ws);

    ws.on("close", () => {
      if (clients.has(uid)) {
        clients.get(uid).delete(ws);
        if (clients.get(uid).size === 0) {
          clients.delete(uid);
        }
      }
    });

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
        }
      } catch (e) {
        // Ignore malformed messages
      }
    });
  }
});

function sendToUser(uid, data) {
  if (clients.has(uid)) {
    clients.get(uid).forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }
}

async function createNotification(type, fromUid, toUid, postId = null) {
  if (!db || fromUid === toUid) return;

  try {
    const notifications = db.collection("notifications");
    const profiles = db.collection("profiles");

    // Check if either user has blocked the other before sending notification
    const sender = await profiles.findOne({ uid: fromUid });
    const receiver = await profiles.findOne({ uid: toUid });

    if (!sender || !receiver) return;

    // Block logic
    const senderBlocked = sender.blockedUsers || [];
    const receiverBlocked = receiver.blockedUsers || [];

    if (senderBlocked.includes(toUid) || receiverBlocked.includes(fromUid)) {
      return; // Do not send notification
    }

    const senderName = sender.displayName;
    const senderPhoto = sender.photoURL;

    await notifications.insertOne({
      type,
      fromUid,
      fromName: senderName,
      fromPhoto: senderPhoto,
      toUid,
      postId,
      read: false,
      createdAt: Date.now(),
    });
  } catch (e) {
    console.error("Error creating notification", e);
  }
}

const DUMMY_POSTS = [
  {
    uid: "dummy_user_1",
    authorName: "Sarah Jenkins",
    authorPhoto:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    content:
      "Just arrived in Bali! The weather is absolutely perfect. Cannot wait to explore the temples tomorrow. 🌴☀️ #travel #vacation",
    imageURL:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&q=80",
    likes: 142,
    likedBy: [],
    comments: [],
    createdAt: Date.now() - 86400000,
    location: { lat: -8.4095, lng: 115.1889, name: "Bali, Indonesia" },
  },
  {
    uid: "dummy_user_2",
    authorName: "Tech Daily",
    authorPhoto: "",
    content:
      "The new AI models are changing everything about how we build software. It's not just about writing code anymore, it's about architectural thinking. What are your thoughts? 💻",
    likes: 328,
    likedBy: [],
    comments: [],
    createdAt: Date.now() - 43200000,
    location: { lat: 37.7749, lng: -122.4194, name: "San Francisco, CA" },
  },
];

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    db = client.db(DB_NAME);
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );

    const postsCollection = db.collection("posts");
    const count = await postsCollection.countDocuments();
    if (count === 0) {
      console.log("Database empty. Seeding with dummy posts...");
      await postsCollection.insertMany(DUMMY_POSTS);
    }
    console.log(`Server listening on http://localhost:${port}`);
  } catch (e) {
    console.error("MongoDB connection error:", e);
  }
}
run().catch(console.dir);

// --- HELPER: Get Blocked Lists ---
async function getMutualBlockedUids(viewerUid) {
  if (!viewerUid) return [];

  const profiles = db.collection("profiles");

  // 1. Get who the viewer has blocked
  const viewer = await profiles.findOne({ uid: viewerUid });
  const blockedByViewer = viewer?.blockedUsers || [];

  // 2. Get who has blocked the viewer
  const blockers = await profiles
    .find({ blockedUsers: viewerUid })
    .project({ uid: 1 })
    .toArray();
  const blockingViewer = blockers.map((b) => b.uid);

  // Combine arrays unique
  return [...new Set([...blockedByViewer, ...blockingViewer])];
}

// --- API ROUTES ---

// 1. Sign Up
app.post("/api/auth/signup", async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });

  try {
    const { email, password } = req.body;
    const users = db.collection("users");
    const profiles = db.collection("profiles");

    const existing = await users.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const newUser = { email, password, createdAt: new Date() };
    const result = await users.insertOne(newUser);
    const uid = result.insertedId.toString();

    await profiles.insertOne({
      uid,
      email,
      displayName: email.split("@")[0],
      photoURL: "",
      interests: [],
      blockedUsers: [],
      createdAt: Date.now(),
    });

    res.json({ user: { uid, email } });
  } catch (error) {
    res.status(500).json({ error: "Signup failed" });
  }
});

// 2. Login
app.post("/api/auth/login", async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });

  try {
    const { email, password } = req.body;
    const users = db.collection("users");
    const user = await users.findOne({ email, password });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    res.json({ user: { uid: user._id.toString(), email } });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

// 2.5 Google Social Login
app.post("/api/auth/google", async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });

  try {
    const { email, displayName, photoURL } = req.body;
    const users = db.collection("users");
    const profiles = db.collection("profiles");

    let user = await users.findOne({ email });
    let uid;

    if (!user) {
      const newUser = { email, authType: "google", createdAt: new Date() };
      const result = await users.insertOne(newUser);
      uid = result.insertedId.toString();

      await profiles.insertOne({
        uid,
        email,
        displayName: displayName || email.split("@")[0],
        photoURL: photoURL || "",
        interests: [],
        blockedUsers: [],
        createdAt: Date.now(),
      });
    } else {
      uid = user._id.toString();
      if (photoURL || displayName) {
        const updateFields = {};
        if (photoURL) updateFields.photoURL = photoURL;
        if (Object.keys(updateFields).length > 0) {
          await profiles.updateOne({ uid }, { $set: updateFields });
        }
      }
    }
    res.json({ user: { uid, email } });
  } catch (error) {
    res.status(500).json({ error: "Google login failed" });
  }
});

// 3. Get Profile
app.get("/api/profile/:uid", async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });

  try {
    const profiles = db.collection("profiles");
    const profile = await profiles.findOne({ uid: req.params.uid });

    // Privacy: If user is in Ghost Mode, strip location data
    if (profile && profile.isGhostMode) {
      delete profile.lastLocation;
    }

    res.json(profile || null);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// 3b. Get All Profiles (for Map) - Updated with Block Filtering
app.get("/api/profiles", async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });

  try {
    const { viewerUid } = req.query;
    const profiles = db.collection("profiles");

    // Filter Logic: Exclude blocked users
    let filter = {
      lastLocation: { $exists: true, $ne: null },
      isGhostMode: { $ne: true },
    };

    if (viewerUid) {
      const excludedUids = await getMutualBlockedUids(viewerUid);
      if (excludedUids.length > 0) {
        filter.uid = { $nin: excludedUids };
      }
    }

    const users = await profiles
      .find(filter)
      .project({
        uid: 1,
        displayName: 1,
        photoURL: 1,
        lastLocation: 1,
        interests: 1,
        bio: 1,
        instagramHandle: 1,
        friends: 1,
      })
      .limit(100)
      .toArray();

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch profiles" });
  }
});

// 3c. Get Batch Profiles
app.post("/api/profiles/batch", async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });
  try {
    const { uids } = req.body;
    if (!Array.isArray(uids) || uids.length === 0) return res.json([]);

    const profiles = db.collection("profiles");
    const users = await profiles
      .find({ uid: { $in: uids } })
      .project({
        uid: 1,
        displayName: 1,
        photoURL: 1,
      })
      .toArray();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch batch profiles" });
  }
});

// 4. Create/Update Profile
app.post("/api/profile/:uid", async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });

  try {
    const { uid } = req.params;
    const data = req.body;
    const profiles = db.collection("profiles");

    const updateFields = { ...data, uid, updatedAt: new Date() };
    const updateDoc = { $set: updateFields };

    // HARDENING: If enabling Ghost Mode, strictly delete location data from DB
    if (data.isGhostMode === true) {
      updateFields.isGhostMode = true; // Ensure boolean
      // Remove location data entirely from the document
      updateDoc.$unset = { lastLocation: "" };
      delete updateFields.lastLocation; // Prevent re-adding in $set
    } else if (data.isGhostMode === false) {
      updateFields.isGhostMode = false;
    }

    await profiles.updateOne({ uid }, updateDoc, { upsert: true });

    res.json({ success: true });
  } catch (error) {
    console.error("Profile Update Error", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// --- USER ACTIONS (BLOCK/REPORT) ---

// Block User
app.post("/api/user/block", async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });
  try {
    const { uid, targetUid } = req.body;
    const profiles = db.collection("profiles");

    // 1. Add to blocked list
    await profiles.updateOne(
      { uid: uid },
      { $addToSet: { blockedUsers: targetUid } },
    );

    // 2. Remove friendship/requests both ways AND cleanup request messages
    await profiles.updateOne(
      { uid: uid },
      {
        $pull: {
          friends: targetUid,
          incomingRequests: targetUid,
          outgoingRequests: targetUid,
        },
        $unset: { [`friendRequestMessages.${targetUid}`]: "" },
      },
    );
    await profiles.updateOne(
      { uid: targetUid },
      {
        $pull: { friends: uid, incomingRequests: uid, outgoingRequests: uid },
        $unset: { [`friendRequestMessages.${uid}`]: "" },
      },
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Block Error", error);
    res.status(500).json({ error: "Failed to block user" });
  }
});

// Unblock User
app.post("/api/user/unblock", async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });
  try {
    const { uid, targetUid } = req.body;
    const profiles = db.collection("profiles");

    await profiles.updateOne(
      { uid: uid },
      { $pull: { blockedUsers: targetUid } },
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to unblock user" });
  }
});

// Report User/Post
app.post("/api/report", async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });
  try {
    const { reporterUid, targetUid, reason, postId } = req.body;
    const reports = db.collection("reports");

    await reports.insertOne({
      reporterUid,
      targetUid, // The user being reported
      reason,
      postId: postId || null, // Optional, if reporting specific content
      createdAt: Date.now(),
      status: "pending", // For future admin panel
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to submit report" });
  }
});

// 5. Friend Requests
app.post("/api/friends/request", async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });
  try {
    const { fromUid, toUid, message } = req.body;
    const profiles = db.collection("profiles");

    await profiles.updateOne(
      { uid: fromUid },
      { $addToSet: { outgoingRequests: toUid } },
    );

    const updateDoc = { $addToSet: { incomingRequests: fromUid } };
    if (message) {
      updateDoc.$set = { [`friendRequestMessages.${fromUid}`]: message };
    }

    await profiles.updateOne({ uid: toUid }, updateDoc);
    await createNotification("friend_request", fromUid, toUid);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to send request" });
  }
});

app.post("/api/friends/accept", async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });
  try {
    const { userUid, requesterUid } = req.body;
    const profiles = db.collection("profiles");

    await profiles.updateOne(
      { uid: userUid },
      {
        $pull: { incomingRequests: requesterUid },
        $addToSet: { friends: requesterUid },
        $unset: { [`friendRequestMessages.${requesterUid}`]: "" },
      },
    );
    await profiles.updateOne(
      { uid: requesterUid },
      {
        $pull: { outgoingRequests: userUid },
        $addToSet: { friends: userUid },
      },
    );
    await createNotification("friend_accept", userUid, requesterUid);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to accept request" });
  }
});

app.post("/api/friends/reject", async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });
  try {
    const { userUid, requesterUid } = req.body;
    const profiles = db.collection("profiles");

    await profiles.updateOne(
      { uid: userUid },
      {
        $pull: { incomingRequests: requesterUid },
        $unset: { [`friendRequestMessages.${requesterUid}`]: "" },
      },
    );
    await profiles.updateOne(
      { uid: requesterUid },
      {
        $pull: { outgoingRequests: userUid },
      },
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to reject request" });
  }
});

app.post("/api/friends/remove", async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });
  try {
    const { uid1, uid2 } = req.body;
    const profiles = db.collection("profiles");
    await profiles.updateOne({ uid: uid1 }, { $pull: { friends: uid2 } });
    await profiles.updateOne({ uid: uid2 }, { $pull: { friends: uid1 } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to remove friend" });
  }
});

// 6. Create Post
app.post("/api/posts", async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });
  try {
    const postData = req.body;
    const posts = db.collection("posts");
    const profiles = db.collection("profiles");

    // SECURITY: Force removal of location if user is in Ghost Mode
    const profile = await profiles.findOne({ uid: postData.uid });
    if (profile && profile.isGhostMode) {
      delete postData.location;
    }

    const result = await posts.insertOne({
      ...postData,
      likes: 0,
      likedBy: [],
      comments: [],
      createdAt: Date.now(),
    });
    res.json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error("Create Post Error:", error);
    res.status(500).json({ error: "Failed to create post" });
  }
});

// 7. Get All Posts (Filtered by Block)
app.get("/api/posts", async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });
  try {
    const { viewerUid } = req.query;
    const posts = db.collection("posts");

    let filter = {};
    if (viewerUid) {
      const excludedUids = await getMutualBlockedUids(viewerUid);
      if (excludedUids.length > 0) {
        filter.uid = { $nin: excludedUids };
      }
    }

    const allPosts = await posts
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
    res.json(allPosts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// 8. Get User Posts
app.get("/api/posts/user/:uid", async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });
  try {
    const posts = db.collection("posts");
    const userPosts = await posts
      .find({ uid: req.params.uid })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(userPosts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user posts" });
  }
});

// 9. Get Single Post
app.get("/api/posts/:id", async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });
  try {
    const postId = req.params.id;
    if (!ObjectId.isValid(postId))
      return res.status(400).json({ error: "Invalid ID" });

    const posts = db.collection("posts");
    const post = await posts.findOne({ _id: new ObjectId(postId) });
    if (!post) return res.status(404).json({ error: "Post not found" });

    res.json(post);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

// 10. Update Post
app.put("/api/posts/:id", async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });
  try {
    const postId = req.params.id;
    const { uid, content, imageURL } = req.body;

    if (!ObjectId.isValid(postId))
      return res.status(400).json({ error: "Invalid ID" });

    const posts = db.collection("posts");
    const post = await posts.findOne({ _id: new ObjectId(postId) });

    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.uid !== uid)
      return res.status(403).json({ error: "Unauthorized" });

    const updateDoc = {
      $set: {
        content,
        imageURL,
        updatedAt: Date.now(),
      },
    };

    await posts.updateOne({ _id: new ObjectId(postId) }, updateDoc);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update post" });
  }
});

// 11. Delete Post
app.delete("/api/posts/:id", async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });
  try {
    const postId = req.params.id;
    const { uid } = req.body;

    if (!ObjectId.isValid(postId))
      return res.status(400).json({ error: "Invalid ID" });

    const posts = db.collection("posts");
    const post = await posts.findOne({ _id: new ObjectId(postId) });

    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.uid !== uid)
      return res.status(403).json({ error: "Unauthorized" });

    await posts.deleteOne({ _id: new ObjectId(postId) });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete post" });
  }
});

// 12. Toggle Like
app.post("/api/posts/:id/like", async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });
  try {
    const postId = req.params.id;
    const { uid } = req.body;

    if (!uid) return res.status(400).json({ error: "User ID required" });
    if (!ObjectId.isValid(postId))
      return res.status(400).json({ error: "Invalid Post ID" });

    const posts = db.collection("posts");
    const post = await posts.findOne({ _id: new ObjectId(postId) });

    if (!post) return res.status(404).json({ error: "Post not found" });

    const likedBy = post.likedBy || [];
    const isLiked = likedBy.includes(uid);

    let update;
    if (isLiked) {
      update = { $pull: { likedBy: uid }, $inc: { likes: -1 } };
    } else {
      update = { $addToSet: { likedBy: uid }, $inc: { likes: 1 } };
    }

    await posts.updateOne({ _id: new ObjectId(postId) }, update);
    const updatedPost = await posts.findOne({ _id: new ObjectId(postId) });

    if (!isLiked && post.uid !== uid) {
      await createNotification("like", uid, post.uid, postId);
    }

    res.json({ likes: updatedPost.likes, likedBy: updatedPost.likedBy || [] });
  } catch (error) {
    res.status(500).json({ error: "Failed to toggle like" });
  }
});

// 13. Add Comment
app.post("/api/posts/:id/comment", async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });
  try {
    const postId = req.params.id;
    const { uid, text } = req.body;

    if (!uid || !text)
      return res.status(400).json({ error: "Missing required fields" });
    if (!ObjectId.isValid(postId))
      return res.status(400).json({ error: "Invalid Post ID" });

    const profiles = db.collection("profiles");
    const userProfile = await profiles.findOne({ uid });

    const authorName = userProfile?.displayName || "User";
    const authorPhoto = userProfile?.photoURL || "";

    const newComment = {
      id: new ObjectId(),
      uid,
      authorName,
      authorPhoto,
      text,
      createdAt: Date.now(),
    };

    const posts = db.collection("posts");
    await posts.updateOne(
      { _id: new ObjectId(postId) },
      { $push: { comments: newComment } },
    );

    const post = await posts.findOne({ _id: new ObjectId(postId) });
    if (post && post.uid !== uid) {
      await createNotification("comment", uid, post.uid, postId);
    }

    res.json(newComment);
  } catch (error) {
    res.status(500).json({ error: "Failed to add comment" });
  }
});

// 14. Get Notifications
app.get("/api/notifications/:uid", async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });
  try {
    const notifications = db.collection("notifications");
    const list = await notifications
      .find({ toUid: req.params.uid })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// 15. Mark Notifications Read
app.post("/api/notifications/mark-read", async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });
  try {
    const { notificationIds } = req.body;
    const notifications = db.collection("notifications");
    const ids = notificationIds.map((id) => new ObjectId(id));
    await notifications.updateMany(
      { _id: { $in: ids } },
      { $set: { read: true } },
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to mark read" });
  }
});

// 16. Chat - Send Message
app.post("/api/chat/send", async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });
  try {
    const { fromUid, toUid, text } = req.body;
    const messages = db.collection("messages");

    const newMessage = {
      fromUid,
      toUid,
      text,
      read: false,
      createdAt: Date.now(),
    };

    const result = await messages.insertOne(newMessage);
    const fullMessage = { ...newMessage, _id: result.insertedId };

    sendToUser(toUid, fullMessage);
    sendToUser(fromUid, fullMessage);

    res.json(fullMessage);
  } catch (error) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

// 17. Chat - Get History
app.get("/api/chat/history/:uid1/:uid2", async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });
  try {
    const { uid1, uid2 } = req.params;
    const messages = db.collection("messages");

    const history = await messages
      .find({
        $or: [
          { fromUid: uid1, toUid: uid2 },
          { fromUid: uid2, toUid: uid1 },
        ],
      })
      .sort({ createdAt: 1 })
      .toArray();

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// 18. Chat - Get Inbox
app.get("/api/chat/inbox/:uid", async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });
  try {
    const { uid } = req.params;
    const messages = db.collection("messages");

    // We want to filter out messages from blocked users
    // Ideally we filter in DB, but aggregation is complex.
    // We'll rely on frontend to hide or simpler backend logic if strictly needed.
    // For now, let's just return raw inbox, but strictly speaking, blocked users shouldn't show up.

    const pipeline = [
      {
        $match: {
          $or: [{ fromUid: uid }, { toUid: uid }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$fromUid", uid] }, "$toUid", "$fromUid"],
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$toUid", uid] }, { $eq: ["$read", false] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: "profiles",
          localField: "_id",
          foreignField: "uid",
          as: "otherUser",
        },
      },
      { $unwind: "$otherUser" },
      {
        $project: {
          _id: 0,
          partner: "$otherUser",
          lastMessage: 1,
          unreadCount: 1,
        },
      },
      { $sort: { "lastMessage.createdAt": -1 } },
    ];

    const inbox = await messages.aggregate(pipeline).toArray();
    res.json(inbox);
  } catch (error) {
    console.error("Inbox Error", error);
    res.status(500).json({ error: "Failed to fetch inbox" });
  }
});

// 19. Chat - Mark Read
app.post("/api/chat/mark-read", async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });
  try {
    const { myUid, partnerUid } = req.body;
    const messages = db.collection("messages");

    await messages.updateMany(
      { toUid: myUid, fromUid: partnerUid, read: false },
      { $set: { read: true } },
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
});

// 20. Chat - Get Unread Count
app.get("/api/chat/unread-count/:uid", async (req, res) => {
  if (!db) return res.status(503).json({ error: "Database not connected" });
  try {
    const { uid } = req.params;
    const messages = db.collection("messages");
    const count = await messages.countDocuments({
      toUid: uid,
      read: false,
    });
    res.json({ count });
  } catch (e) {
    res.status(500).json({ error: "Failed to get unread count" });
  }
});

server.listen(port, () => {});
