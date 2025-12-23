const mongoose = require('mongoose');
const WebhookLogSchema = new mongoose.Schema(
  {
    data: {type: Object, default: {}}
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('WebhookLog', WebhookLogSchema);
