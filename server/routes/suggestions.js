const express = require("express");
const router = express.Router();
const Suggestion = require("../models/Suggestion");
const authMiddleware = require("../middleware/auth");
const crypto = require("crypto");

// Helper: hash IP for privacy
const hashIP = (ip) =>
  crypto.createHash("sha256").update(ip + process.env.JWT_SECRET).digest("hex");

// ─── PUBLIC: Submit a suggestion ─────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { songName, singerName, suggestedBy, message } = req.body;

    if (!songName?.trim() || !singerName?.trim()) {
      return res.status(400).json({ message: "Song name and singer name are required" });
    }

    const normalizedSong = songName.toLowerCase().trim();
    const normalizedSinger = singerName.toLowerCase().trim();

    // Check for duplicate
    const existing = await Suggestion.findOne({
      songNameNormalized: normalizedSong,
      singerNameNormalized: normalizedSinger,
    });

    if (existing) {
      return res.status(409).json({
        message: "This song has already been suggested!",
        duplicate: true,
        suggestion: {
          _id: existing._id,
          songName: existing.songName,
          singerName: existing.singerName,
          votes: existing.votes,
        },
      });
    }

    const suggestion = new Suggestion({
      songName: songName.trim(),
      singerName: singerName.trim(),
      suggestedBy: suggestedBy?.trim() || "Anonymous",
      message: message?.trim() || "",
    });

    await suggestion.save();

    // Emit real-time event via Socket.IO (attached to app)
    const io = req.app.get("io");
    if (io) {
      io.emit("newSuggestion", {
        _id: suggestion._id,
        songName: suggestion.songName,
        singerName: suggestion.singerName,
        suggestedBy: suggestion.suggestedBy,
        message: suggestion.message,
        status: suggestion.status,
        votes: suggestion.votes,
        createdAt: suggestion.createdAt,
      });
    }

    res.status(201).json({ message: "Suggestion submitted successfully!", suggestion });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "This song has already been suggested!", duplicate: true });
    }
    console.error("Submit error:", err);
    res.status(500).json({ message: "Server error. Please try again." });
  }
});

// ─── PUBLIC: Get all approved/pending suggestions ─────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { status = "pending", sort = "votes" } = req.query;
    const sortOptions = sort === "votes" ? { votes: -1, createdAt: -1 } : { createdAt: -1 };

    const suggestions = await Suggestion.find({ status })
      .sort(sortOptions)
      .select("-votedIPs")
      .lean();

    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ─── PUBLIC: Upvote a suggestion ──────────────────────────────────────────────
router.patch("/:id/vote", async (req, res) => {
  try {
    const suggestion = await Suggestion.findById(req.params.id);

    if (!suggestion) return res.status(404).json({ message: "Suggestion not found" });
    
    suggestion.votes += 1;
    await suggestion.save();

    const io = req.app.get("io");
    if (io) {
      io.emit("voteUpdate", { _id: suggestion._id, votes: suggestion.votes });
    }

    res.json({ votes: suggestion.votes });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ─── ADMIN: Get ALL suggestions ───────────────────────────────────────────────
router.get("/admin/all", authMiddleware, async (req, res) => {
  try {
    const { status, sort = "createdAt" } = req.query;
    const filter = status ? { status } : {};
    const sortOptions = sort === "votes" ? { votes: -1 } : { createdAt: -1 };

    const suggestions = await Suggestion.find(filter)
      .sort(sortOptions)
      .select("-votedIPs")
      .lean();

    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ─── ADMIN: Update suggestion status ─────────────────────────────────────────
router.patch("/admin/:id/status", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "approved", "rejected", "played"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const suggestion = await Suggestion.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, select: "-votedIPs" }
    );

    if (!suggestion) return res.status(404).json({ message: "Suggestion not found" });

    const io = req.app.get("io");
    if (io) {
      io.emit("statusUpdate", { _id: suggestion._id, status: suggestion.status });
    }

    res.json(suggestion);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ─── ADMIN: Delete suggestion ─────────────────────────────────────────────────
router.delete("/admin/:id", authMiddleware, async (req, res) => {
  try {
    const suggestion = await Suggestion.findByIdAndDelete(req.params.id);
    if (!suggestion) return res.status(404).json({ message: "Suggestion not found" });

    const io = req.app.get("io");
    if (io) io.emit("deleteSuggestion", { _id: req.params.id });

    res.json({ message: "Suggestion deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ─── ADMIN: Clear all suggestions ────────────────────────────────────────────
router.delete("/admin/clear/all", authMiddleware, async (req, res) => {
  try {
    await Suggestion.deleteMany({});
    const io = req.app.get("io");
    if (io) io.emit("clearAll");
    res.json({ message: "All suggestions cleared" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
