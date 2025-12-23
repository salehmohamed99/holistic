const mongoose = require('mongoose');
const SettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
    },
    value: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Setting', SettingSchema);
