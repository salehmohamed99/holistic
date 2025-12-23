const axios = require("axios").default;

const multer = require("multer");
// const fs = require("fs");
// var FormData = require("form-data");
// const app = require("../app");

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
exports.WHATSAPP_TOKEN = WHATSAPP_TOKEN;

const WHATSAPP_PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
exports.WHATSAPP_PHONE_NUMBER_ID = WHATSAPP_PHONE_NUMBER_ID;
const INSTAGRAM_TOKEN = process.env.INSTAGRAM_TOKEN;
const INSTAGRAM_PAGE_ID = process.env.PAGE_ID;

// //sendWellcomeMessage
// exports.sendWellcomeMessage = async (payload) => {
//   const res = await saveMessage(payload);

//   payload["msg_id"] = res["newMsg"]._id;
//   payload["to"] = res["to"].phone_number;

//   const send = await sendToWhatsapp(payload);
//   return true;
// };

exports.sendWellcomeMessageApi = async (req, res) => {
  let payload = {
    // from: adminId,
    to: req.query.to,
    phone_number: req.query.to,
    content: "template Api",
    type: "catalog",
  };
  // const res22 = await saveMessage(payload);

  // payload["msg_id"] = res22["newMsg"]._id;
  // payload["to"] = res22["to"].phone_number;
  try {
    const send = await sendToWhatsapp(payload);
    res.status(200).send({ error: false, data: "done", send });
  } catch (e) {
    res.status(400).send({ error: true, data: "error", e });
  }
  return true;
};
