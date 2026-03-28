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
    language: { type: String, default: "ar" },

    name: { type: String, default: "" },

    addresses: [
      {
        id: { type: String, default: "" },
        name: { type: String, default: "" },
        email: { type: String, default: "" },
        country: { type: String, default: "" },
        country_name_ar: { type: String, default: "" },
        country_name_en: { type: String, default: "" },
        state: { type: String, default: "" },
        state_name: { type: String, default: "" },
        street: { type: String, default: "" },
      }
    ],
    choosen_address: { type: String, default: "" },
    delivery_price: { type: String, default: "" },
    is_offer: { type: Boolean, default: false },
    is_delete: { type: Boolean, default: false },
    is_ordered: { type: Boolean, default: false },
    order_id: { type: String, default: "" },

    // usage
    token: { type: String, default: "" },
    to_verified: { type: Boolean, default: false },
    country_code: { type: String, default: "" },
    phone: { type: String, default: "" },
    category_id: { type: String, default: "" },
    subcategory_id: { type: String, default: "" },
    items_counter: { type: Number, default: 0 },
    items_length: { type: Number, default: 0 },
    total_price: { type: String, default: "" },
    status: { type: String, default: "" },    // {"choose_items"}
    card: [],
    init_card: [],
    init_card_counter: { type: Number, default: 0 },
    address_counter: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    total_weight: { type: Number, default: 0 },
    same_card: { type: Number, default: 0 },
    payment_method: { type: String, default: "" },



  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("OrderID", OrderIDSchema);
