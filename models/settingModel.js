const mongoose = require("mongoose");
const SettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
    },
    value: {
      type: String,
    },
    path: {
      type: String,
    },
    location: {
      type: "object",
      properties: {
        longitude: {
          type: String,
        },
        latitude: {
          type: String,
        },
        name: {
          type: String,
        },
        address: {
          type: String,
        },
      },
    },
    expires_at: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Setting", SettingSchema);
