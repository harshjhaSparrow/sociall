import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);
const DB_NAME = "socially_db";

const CREDENTIALS_FILE = path.join(__dirname, '..', 'user_credentials.json');

const NAMES = [
    "Arjun Sharma", "Priya Gupta", "Rohan Verma", "Ananya Iyer", "Vikram Singh",
    "Ishani Malhotra", "Kabir Das", "Sanya Roy", "Rahul Kapoor", "Megha Jain",
    "Aditya Chopra", "Sneha Reddy", "Zoya Khan", "Neil Batra", "Tara Singh",
    "Siddharth Goel", "Riya Sen", "Aman Gupta", "Divya Bansal", "Karan Johar",
    "Pooja Hegde", "Suresh Raina", "Naina Talwar", "Bunny", "Aditi",
    "Amitabh", "Deepika", "Ranbir", "Alia", "Shah Rukh", "Salman", "Aamir",
    "Katrina", "Varun", "Shraddha", "Kartik", "Sara", "Janhvi", "Ananya",
    "Kriti", "Ayushmann", "Vicky", "Rajkummar", "Taapsee", "Bhumi", "Kiara",
    "Sidharth", "Tiger", "Disha", "Jacqueline", "John Abraham", "Hrithik",
    "Akshay Kumar", "Kareena", "Priyanka", "Anushka"
];

const JOBS = [
    "Software Engineer", "Marketing Manager", "Fitness Coach", "Content Creator",
    "Architect", "UI Designer", "Chef", "Student", "Data Scientist", "Artist",
    "Journalist", "Lawyer", "Yoga Instructor", "Entrepreneur", "Vet",
    "Photographer", "HR Expert", "Blogger", "Filmmaker", "UI/UX Designer",
    "Product Manager", "Stock Trader", "Digital Nomad", "Music Producer"
];

const INTERESTS = ["tech", "hiking", "travel", "foodie", "photography", "art", "gym", "gaming", "music", "books", "movies", "pets"];

const BIOS = [
    "Coffee lover and weekend hiker. Looking for tech talks in Gurgaon!",
    "Always up for a brunch! Let's explore the hidden cafes of Delhi.",
    "Gym is my second home. Connect for fitness tips.",
    "Capturing life one frame at a time. Photography & travel ✈️",
    "Interested in sustainable design and heritage walks.",
    "Pixel perfect designs and intense gaming sessions. 🎮",
    "Experimenting with fusion food. Invite me for a cook-off! 🍳",
    "Passionate about sustainable fashion and indie music.",
    "AI enthusiast and a part-time guitarist. Let's jam!",
    "Acrylic paint on canvas. Exploring the colors of old Delhi.",
    "Political junkie and local news tracker. Always on the move.",
    "Justice and jogging. Finding peace in NCR's parks.",
    "Lifestyle blogger based in Noida. Love brunching!",
    "Twitch streamer. Apex Legends and Valorant fan.",
    "Aligning soul and mind. Let's do yoga in the park.",
    "Building the next big thing. Let's talk business over coffee.",
    "Animal lover 🐶. Reach out for pet tips or playdates.",
    "Exploring NCR through a lens. Street photography.",
    "Connecting people. Love movies and popcorn 🍿",
    "Fashion is life. NCR is my runway.",
    "Reading between the lines. Book club? 📚",
    "Vanderlust. Let's explore the unexplored."
];

const LOCATIONS = [
    { name: "Sector 29, Gurgaon", lat: 28.4595, lng: 77.0266 },
    { name: "Cyber Hub, Gurgaon", lat: 28.4949, lng: 77.0878 },
    { name: "Connaught Place, Delhi", lat: 28.6139, lng: 77.2090 },
    { name: "Hauz Khas Village, Delhi", lat: 28.5521, lng: 77.1948 },
    { name: "Saket (Select Citywalk), Delhi", lat: 28.5287, lng: 77.2185 },
    { name: "Sector 18, Noida", lat: 28.5681, lng: 77.3214 },
    { name: "Noida Electronic City", lat: 28.6273, lng: 77.3725 },
    { name: "Raj Nagar, Ghaziabad", lat: 28.6854, lng: 77.4470 },
    { name: "Indirapuram, Ghaziabad", lat: 28.6366, lng: 77.3621 },
    { name: "Faridabad Sector 15", lat: 28.4111, lng: 77.3134 },
    { name: "Vasant Vihar, Delhi", lat: 28.5600, lng: 77.1600 },
    { name: "GK 2, Delhi", lat: 28.5300, lng: 77.2400 },
    { name: "Dwarka Sector 10, Delhi", lat: 28.5800, lng: 77.0600 },
    { name: "Rohini Sector 11, Delhi", lat: 28.7200, lng: 77.1200 },
    { name: "DLF Phase 3, Gurgaon", lat: 28.4900, lng: 77.1000 }
];

const POST_TEMPLATES = [
    "Just found this amazing hidden cafe in {loc}! The vibes are immaculate. ☕✨",
    "Anyone up for a heritage walk in {loc} this Sunday?",
    "The sunset at {loc} is something else today! 🌅",
    "Training for a half marathon. Join me for runs in {loc}! 🏃‍♂️",
    "Thinking of starting a tech weekend meetup in {loc}. Let's talk AI! 💻",
    "Street photography day at {loc}. The crowd here is vibrant! 📸",
    "NCR traffic is insane, but the view from my office in {loc} makes up for it.",
    "Best place for authentic food in {loc}? Any recommendations? 🍱",
    "Feeling inspired to paint today. NCR's street life is so colorful! 🎨",
    "Weather is perfect for a picnic in {loc}. 🧺🌸",
    "Weekend vibes at {loc}! Who's around? 🕺",
    "Work from cafe day in {loc}. WiFi is great, coffee is better.",
    "Met some really cool people at {loc} today. This app is working! 🙌",
    "Planning a movie marathon tonight. Any suggestions?",
    "Just adopted a puppy! 🐶 Suggestions for pet-friendly parks in {loc}?"
];

async function seed() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
        const db = client.db(DB_NAME);

        const usersCol = db.collection('users');
        const profilesCol = db.collection('profiles');
        const postsCol = db.collection('posts');

        const credentials = [];

        console.log(`Seeding ${NAMES.length} users...`);

        for (let i = 0; i < NAMES.length; i++) {
            const name = NAMES[i];
            const email = `${name.toLowerCase().replace(/\s/g, '.')}${i}@orbyt.app`;
            const password = "password123";

            // Create User
            let uid;
            const existing = await usersCol.findOne({ email });
            if (!existing) {
                const userRes = await usersCol.insertOne({
                    email,
                    password,
                    createdAt: new Date()
                });
                uid = userRes.insertedId.toString();
            } else {
                uid = existing._id.toString();
            }

            credentials.push({ email, password, uid, name });

            // Random Profile Data
            const job = JOBS[Math.floor(Math.random() * JOBS.length)];
            const bio = BIOS[Math.floor(Math.random() * BIOS.length)];
            const loc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
            const userInterests = INTERESTS.sort(() => 0.5 - Math.random()).slice(0, 3);
            const photoURL = `https://i.pravatar.cc/150?u=${uid}`;

            // Create/Update Profile
            await profilesCol.updateOne(
                { uid },
                {
                    $set: {
                        uid,
                        email,
                        displayName: name,
                        photoURL,
                        jobRole: job,
                        bio,
                        interests: userInterests,
                        lastLocation: {
                            ...loc,
                            lat: loc.lat + (Math.random() - 0.5) * 0.02, // Add jitter for crowd effect
                            lng: loc.lng + (Math.random() - 0.5) * 0.02
                        },
                        isDiscoverable: true,
                        discoveryRadius: 15,
                        thatsMePhotos: [
                            `https://picsum.photos/seed/${uid}a/800/1200`,
                            `https://picsum.photos/seed/${uid}b/800/1200`,
                            `https://picsum.photos/seed/${uid}c/800/1200`
                        ],
                        createdAt: Date.now()
                    }
                },
                { upsert: true }
            );

            // Create 3-5 posts for each user
            const postCount = Math.floor(Math.random() * 3) + 3;
            for (let j = 0; j < postCount; j++) {
                const template = POST_TEMPLATES[Math.floor(Math.random() * POST_TEMPLATES.length)];
                const content = template.replace("{loc}", loc.name);
                
                await postsCol.insertOne({
                    uid,
                    authorName: name,
                    authorPhoto: photoURL,
                    content,
                    likes: Math.floor(Math.random() * 100),
                    likedBy: [],
                    comments: [],
                    createdAt: Date.now() - Math.floor(Math.random() * 1000000000), // Up to 11 days old
                    location: {
                        ...loc,
                        lat: loc.lat + (Math.random() - 0.5) * 0.01,
                        lng: loc.lng + (Math.random() - 0.5) * 0.01
                    },
                    type: Math.random() > 0.7 ? 'meetup' : 'regular',
                    meetupDetails: Math.random() > 0.7 ? {
                        title: `${name}'s ${userInterests[0]} Meetup`,
                        date: new Date(Date.now() + Math.floor(Math.random() * 500000000)).toISOString()
                    } : null
                });
            }
        }

        // Write credentials to file
        fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2));
        console.log(`Credentials saved to ${CREDENTIALS_FILE}`);
        console.log("Massive seeding completed successfully!");

    } catch (err) {
        console.error("Seeding failed:", err);
    } finally {
        await client.close();
    }
}

seed();
