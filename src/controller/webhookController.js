const axios = require("axios").default;
const token = process.env.WHATSAPP_TOKEN;
const Orders = require("../models/ordersModel");
const OrderID = require("../models/OrderIDModel");
const moment = require("moment-timezone");
const mongoose = require("mongoose");

const WHATSAPP_PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const axiosHelper = require("../helpers/axiosHelper");
const fs = require("fs");
const messageController = require("./messageController"),
  sendToWhatsapp = require("./sendToWhatsapp");
const thawaniController = require("./thawaniController");
const WebhookLogController = require("./WebhookLogController");

const path = require("path");
const { log } = require("console");
const { title } = require("process");
exports.postHandler = async (req, res) => {
  console.log(JSON.stringify(req.body, null, 2));
  try {
    const WebhookLog = await WebhookLogController.create(req.body);

    if (req.body.object === "whatsapp_business_account") {
      ////////////////////////////// Make Order ///////////////////////////////////

      if (
        req.body.entry[0].changes[0].value.messaging_product &&
        req.body.entry[0].changes[0].value.messages
      ) {
        let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload

        let holistic = await OrderID.findOne({ from });

        if (holistic == null) {
          holistic = new OrderID({ from, chat: "of" });
          await holistic.save();
        }

        if (holistic.chat == "of") {
          if (
            req.body.entry[0].changes[0].value.messaging_product &&
            req.body.entry[0].changes[0].value.messages &&
            req.body.entry[0].changes[0].value.messages[0].type == "text"
          ) {
            let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
            let name =
              req.body.entry[0].changes[0].value.contacts[0].profile.name; // extract the phone number from the webhook payload
            let wa_msg_id = req.body.entry[0].changes[0].value.messages[0].id;
            let parentMsg = req.body.entry[0].changes[0].value.messages[0]
              .context
              ? req.body.entry[0].changes[0].value.messages[0].context.id
              : null;

            if (
              req.body.entry[0].changes[0].value.messages[0].text.body ==
              "تقييم"
            ) {
              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                type: "start_service",
              };

              sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else {
              shinas = await OrderID.findOneAndUpdate(
                { from: from },
                {
                  $set: {
                    wa_msg_id: wa_msg_id,
                    category_id: "",
                    issue_id: "",
                    issue_name: "",
                    amount: "",
                  },
                },
                { new: true, upsert: true },
              );

              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                type: "start_service",
              };

              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            }
          } else if (
            req.body.entry[0].changes[0].value.messaging_product &&
            req.body.entry[0].changes[0].value.messages &&
            req.body.entry[0].changes[0].value.messages[0].type ==
            "interactive" &&
            req.body.entry[0].changes[0].value.messages[0].interactive.type ==
            "button_reply"
          ) {
            let title =
              req.body.entry[0].changes[0].value.messages[0].interactive
                .button_reply.title;

            if (title == "تبرع") {
              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                type: "show_categories",
              };

              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else if (title == "خدمة المتبرعين") {
              shinas.chat = "on";
              await shinas.save();

              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                content:
                  "تم تفعيل الدردشة العادية \n يمكنك الأن متابعة الدردشه",
                type: "text",
              };
              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
              const wellcomeData2 = {
                from: "00",
                to: from,
                phone_number: from,
                type: "active",
              };
              await sendToWhatsapp.sendToWhatsapp(wellcomeData2);
            }
          } else if (
            req.body.entry[0].changes[0].value.messaging_product &&
            req.body.entry[0].changes[0].value.messages &&
            req.body.entry[0].changes[0].value.messages[0].type == "button" &&
            req.body.entry[0].changes[0].value.messages[0].type == "button"
          ) {
            let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
            let title =
              req.body.entry[0].changes[0].value.messages[0].button.text;
          } else if (
            req.body.entry[0].changes[0].value.messaging_product ===
            "whatsapp" &&
            req.body.entry[0].changes[0].value.messages &&
            req.body.entry[0].changes[0].value.messages[0].type ===
            "interactive" &&
            req.body.entry[0].changes[0].value.messages[0].interactive
              .nfm_reply &&
            req.body.entry[0].changes[0].value.messages[0].interactive.nfm_reply
              .name === "flow"
          ) {
            let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
            let name = req.body.entry[0].changes[0].value.contacts[0]?.profile?.name || from; // extract the name

            let response_json = JSON.parse(
              req.body.entry[0].changes[0].value.messages[0].interactive
                .nfm_reply.response_json,
            );

            console.log("Flow response_json:", JSON.stringify(response_json, null, 2));


            if (response_json.flow_token == "1913030049295042") {
              if (response_json.issues) {
                shinas.issue_id = response_json.issues;
                const wellcomeData = {
                  from: "00",
                  to: from,
                  phone_number: from,
                  category_id: response_json.categories,
                  issue_id: response_json.issues,
                  type: "complete_data",
                };
                await sendToWhatsapp.sendToWhatsapp(wellcomeData);
              } else {
                const wellcomeData = {
                  from: "00",
                  to: from,
                  phone_number: from,
                  category_id: response_json.categories,
                  name,
                  type: "complete_data",
                };
                await sendToWhatsapp.sendToWhatsapp(wellcomeData);
              }

              shinas.category_id = response_json.categories;
              await shinas.save();
            } else if (response_json.flow_token == "2129485467870341") {
              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                amount: response_json.amount,
                phone: response_json.phone,
                type: "checkout",
              };
              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else if (response_json.flow_token === "1207821791525394") {
              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                gift_type: response_json.gift_type,
                gift_scope: response_json.gift_scope,
                amount: response_json.amount,
                phone_sender: response_json.phone_sender,
                name_sender: response_json.name_sender,
                name_receiver: response_json.name_receiver,
                phone_receiver: response_json.phone_receiver,
                type: "checkout_gift",
              };
              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            }
          }
        } else {
          if (
            req.body.entry[0].changes[0].value.messaging_product &&
            req.body.entry[0].changes[0].value.messages &&
            req.body.entry[0].changes[0].value.messages[0].type == "text"
          ) {
            let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
            let wa_msg_id = req.body.entry[0].changes[0].value.messages[0].id;
            if (
              req.body.entry[0].changes[0].value.messages[0].text.body ==
              "تفعيل" ||
              req.body.entry[0].changes[0].value.messages[0].text.body ==
              "active" ||
              req.body.entry[0].changes[0].value.messages[0].text.body ==
              "Active"
            ) {
              holistic.chat = "of";
              await holistic.save();
              if (holistic.language === "ar") {
                const wellcomeData2 = {
                  from: "00",
                  to: from,
                  phone_number: from,
                  content: "تم الرجوع الى الخدمة التلقائية",
                  type: "text",
                };
                await sendToWhatsapp.sendToWhatsapp(wellcomeData2);
              } else {
                const wellcomeData2 = {
                  from: "00",
                  to: from,
                  phone_number: from,
                  content: "The automatic service has been returned",
                  type: "text",
                };
                await sendToWhatsapp.sendToWhatsapp(wellcomeData2);
              }

              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                parentMsg: wa_msg_id,
                type: "select_language",
              };
              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            }
          }
        }
      }

      res.sendStatus(200);
    } else {
      // Return a '404 Not Found' if event is not from a WhatsApp API
      res.sendStatus(404);
    }
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
};

exports.getHandler = async (req, res) => {
  console.log("getHandler");
  console.log(req.query);
  /**
   * UPDATE YOUR VERIFY TOKEN
   *This will be the Verify Token value when you set up webhook
   **/
  const verify_token = process.env.VERIFY_TOKEN;
  console.log(verify_token);

  // Parse params from the webhook verification request
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === "subscribe" && token === verify_token) {
      // Respond with 200 OK and challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      return res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      return res.sendStatus(403);
    }
  }
  return res.sendStatus(403);
};

exports.patchHandler = async (req, res) => {
  console.log("patchHandler =>> ", {
    req,
  });
};
