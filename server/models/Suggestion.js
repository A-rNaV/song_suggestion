const mongoose = require("mongoose");

const suggestionSchema = new mongoose.Schema(
  {
    songName: {
      type: String,
      required: [true, "Song name is required"],
      trim: true,
      maxlength: [150, "Song name cannot exceed 150 characters"],
    },
    singerName: {
      type: String,
      required: [true, "Singer/Artist name is required"],
      trim: true,
      maxlength: [100, "Singer name cannot exceed 100 characters"],
    },
    // normalized versions for duplicate checking (lowercase, trimmed)
    songNameNormalized: {
      type: String,
      trim: true,
      lowercase: true,
    },
    singerNameNormalized: {
      type: String,
      trim: true,
      lowercase: true,
    },
    suggestedBy: {
      type: String,
      trim: true,
      maxlength: [80, "Name cannot exceed 80 characters"],
      default: "Anonymous",
    },
    message: {
      type: String,
      trim: true,
      maxlength: [300, "Message cannot exceed 300 characters"],
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "played"],
      default: "pending",
    },
    votes: {
      type: Number,
      default: 1,
    },
    // store IPs (hashed) to prevent vote spam
    votedIPs: {
      type: [String],
      default: [],
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast duplicate detection
suggestionSchema.index({ songNameNormalized: 1, singerNameNormalized: 1 }, { unique: true });
suggestionSchema.index({ status: 1, createdAt: -1 });

// Pre-save hook to set normalized fields
suggestionSchema.pre("save", function (next) {
  this.songNameNormalized = this.songName.toLowerCase().trim();
  this.singerNameNormalized = this.singerName.toLowerCase().trim();
  next();
});

module.exports = mongoose.model("Suggestion", suggestionSchema);
