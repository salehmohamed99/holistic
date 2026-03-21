const mongoose = require("mongoose");
const OrderIDSchema = new mongoose.Schema(
  {
    wa_msg_id: {
      type: String,
      required: true,
      unique: true,
      default: () => new Date().toISOString(),
    },
    from: { type: String, default: "" },
    chat: { type: String, default: "of" },
    name: { type: String, default: "" },
    category_id: { type: String, default: "" },
    issue_id: { type: String, default: "" },
    issue_name: { type: String, default: "" },
    amount: { type: String, default: "" },

  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("OrderID", OrderIDSchema);
