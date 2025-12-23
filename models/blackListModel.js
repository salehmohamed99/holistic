const mongoose = require('mongoose');
const blackListSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
    },
    messageType: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

blackListSchema.index({ phoneNumber: 1 });

module.exports = mongoose.model('BlackList', blackListSchema);
