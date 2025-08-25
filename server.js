const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors"); // Import CORS
const multer = require("multer");
const fs = require("fs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5500;

// Middleware
app.use(cors()); // Enable CORS
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/videos", express.static(path.join(__dirname, "videos")));

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === "video") {
      cb(null, "videos/");
    } else {
      cb(null, "uploads/");
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// MongoDB Atlas Connection
const mongoURI = process.env.MONGO_URI; // Add your MongoDB Atlas URI in a .env file
mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("Error connecting to MongoDB Atlas:", err));

// Mongoose Schemas
const ReviewSchema = new mongoose.Schema({
  name: String,
  rating: Number,
  review: String,
  date: { type: Date, default: Date.now },
});

const MessageSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  message: String,
  date: { type: Date, default: Date.now },
});

const Review = mongoose.model("Review", ReviewSchema);
const Message = mongoose.model("Message", MessageSchema);

// Routes
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/services", (req, res) =>
  res.sendFile(path.join(__dirname, "services.html"))
);
app.get("/gallery", (req, res) =>
  res.sendFile(path.join(__dirname, "gallery.html"))
);
app.get("/reviews", (req, res) =>
  res.sendFile(path.join(__dirname, "reviews.html"))
);
app.get("/contact", (req, res) =>
  res.sendFile(path.join(__dirname, "contact.html"))
);
app.get("/admin-login", (req, res) =>
  res.sendFile(path.join(__dirname, "admin-login.html"))
);
app.get("/admin-dashboard", (req, res) =>
  res.sendFile(path.join(__dirname, "admin-dashboard.html"))
);
app.get("/write-review", (req, res) =>
  res.sendFile(path.join(__dirname, "write_review.html"))
);

// API Endpoints
app.post("/api/reviews", async (req, res) => {
  try {
    const newReview = new Review(req.body);
    await newReview.save();
    res.status(201).json({ message: "Review submitted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit review" });
  }
});

app.get("/api/reviews", async (req, res) => {
  try {
    const reviews = await Review.find().sort({ date: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

app.post("/api/consultation", async (req, res) => {
  try {
    const newMessage = new Message(req.body);
    await newMessage.save();
    res.status(201).json({ message: "Message sent successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

app.get("/api/consultation", async (req, res) => {
  try {
    const messages = await Message.find().sort({ date: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

app.post("/api/upload", upload.single("file"), (req, res) => {
  res.status(200).json({ message: "File uploaded successfully" });
});

app.get("/api/videos", (req, res) => {
  const videosPath = path.join(__dirname, "videos");
  fs.readdir(videosPath, (err, files) => {
    if (err) {
      return res.status(500).json({ error: "Failed to fetch videos" });
    }
    const videoFiles = files.filter(
      (file) =>
        path.extname(file).toLowerCase() === ".mp4" ||
        path.extname(file).toLowerCase() === ".mov"
    );
    res.json(videoFiles);
  });
});

app.post("/admin-login", (req, res) => {
  const { adminId, adminPassword } = req.body;
  const adminUser = process.env.ADMIN_USER;
  const adminPass = process.env.ADMIN_PASS;

  if (adminId === adminUser && adminPassword === adminPass) {
    res.redirect("/admin-dashboard");
  } else {
    res.status(401).send("Invalid credentials");
  }
});

// Start Server
app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
