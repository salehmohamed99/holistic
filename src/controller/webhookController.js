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
const e = require("express");
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

        let hispeed = await OrderID.findOne({ from });

        if (hispeed == null) {
          hispeed = new OrderID({ from, chat: "of" });
          await hispeed.save();
        }

        if (hispeed.chat == "of") {
          if (
            req.body.entry[0].changes[0].value.messaging_product &&
            req.body.entry[0].changes[0].value.messages &&
            req.body.entry[0].changes[0].value.messages[0].type == "text"
          ) {
            let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
            let name =
              req.body.entry[0].changes[0].value.contacts[0].profile.name; // extract the phone number from the webhook payload
            let wa_msg_id = req.body.entry[0].changes[0].value.messages[0].id;
            let parentMsg = req.body.entry[0].changes[0].value.messages[0].context
              ? req.body.entry[0].changes[0].value.messages[0].context.id
              : null;
            console.log("text bloc");
            let msg = req.body.entry[0].changes[0].value.messages[0].text.body;
            let type = req.body.entry[0].changes[0].value.messages[0].type;

            if (
              req.body.entry[0].changes[0].value.messages[0].text.body == "تقييم"
            ) {
              // const wellcomeData = {
              //   from: "00",
              //   to: from,
              //   phone_number: from,
              //   type: "Payment_test",
              // };

              // sendToWhatsapp.sendToWhatsapp(wellcomeData);

              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                type: "show_categories",
              };

              sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else {
              // const dataToDashboard = {
              //   phone_number: from,
              //   content: msg,
              //   type,
              //   name: name ? name : from,
              //   user_name: name ? name : from,
              //   platform: "whatsapp",
              //   wa_msg_id,
              //   parentMsg,
              // };

              // messageController.sendMessage(dataToDashboard);
              hispeed = await OrderID.findOneAndUpdate(
                { from: from },
                {
                  $set: {
                    wa_msg_id: wa_msg_id,
                    order_date: "",
                    order_time: "",
                    card: [],
                    choosen_address: "",
                    isGift: false,
                    is_delivery: false,
                    delivery_price: "",
                    is_now: false,
                    total_price: "",
                    order_id: "",
                    address: "",
                    branch_id: "",
                    offers: [],
                    offers_counter: 0,
                    to_verified: false,
                    country_code: "",
                    phone: "",
                    items_counter: 0,
                    status: "",
                    init_card_counter: 0,
                    init_card: [],
                    items_length: 0,
                    tax: 0,
                    total: 0,
                    same_card: 0,
                  },
                },
                { new: true, upsert: true }
              );

              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                parentMsg: wa_msg_id,
                type: "select_language",
              };

              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            }

          } else if (
            req.body.entry[0].changes[0].value.messaging_product &&
            req.body.entry[0].changes[0].value.messages &&
            req.body.entry[0].changes[0].value.messages[0].type == "order"
          ) {
            console.log("order bloc");

            let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
            let wa_msg_id = req.body.entry[0].changes[0].value.messages[0].id; // extract the message ID
            let product_items =
              req.body.entry[0].changes[0].value.messages[0].order.product_items;

            let hispeed = await OrderID.findOne({ from });

            if (hispeed.status == "choose_items") {
              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                product_items: product_items,
                type: "test",
              };
              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else {
              console.log("no token bloc");

              if (hispeed.card.length == 0) {
                try {
                  hispeed = await OrderID.findOneAndUpdate(
                    { from: from },
                    {
                      $set: {
                        wa_msg_id: wa_msg_id,
                        order_date: "",
                        order_time: "",
                        card: [],
                        choosen_address: "",
                        isGift: false,
                        is_delivery: false,
                        delivery_price: "",
                        is_now: false,
                        total_price: "",
                        order_id: "",
                        address: "",
                        branch_id: "",
                        offers: [],
                        offers_counter: 0,
                        to_verified: false,
                        country_code: "",
                        phone: "",
                        items_counter: 0,
                        status: "",
                        init_card_counter: 0,
                        init_card: [],
                        items_length: 0,
                        tax: 0,
                        total: 0,
                        same_card: 0,
                      },
                    },
                    { new: true, upsert: true }
                  );
                  console.log("✅ hispeed updated/created:", hispeed);
                } catch (err) {
                  console.error("❌ Error in findOneAndUpdate:", err);
                }
              }

              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                product_items: product_items,
                type: "test",
              };
              await sendToWhatsapp.sendToWhatsapp(wellcomeData);

              // if (hispeed.language === 'ar') {
              //   const wellcomeData = {
              //     from: "00",
              //     to: from,
              //     phone_number: from,
              //     content: "هذه الخطوة ليست فى الخطوة الحاليه \n يرجي الطلب من البداية",
              //     type: "text",
              //   };
              //   await sendToWhatsapp.sendToWhatsapp(wellcomeData);
              // }
              // else {
              //   const wellcomeData = {
              //     from: "00",
              //     to: from,
              //     phone_number: from,
              //     content: "This step is not in the current step \n Please request from the beginning",
              //     type: "text",
              //   };
              //   await sendToWhatsapp.sendToWhatsapp(wellcomeData);
              // }
            }
          } else if (
            req.body.entry[0].changes[0].value.messaging_product &&
            req.body.entry[0].changes[0].value.messages &&
            req.body.entry[0].changes[0].value.messages[0].type ==
            "interactive" &&
            req.body.entry[0].changes[0].value.messages[0].interactive.type ==
            "button_reply"
          ) {
            console.log("button_reply bloc");

            let title =
              req.body.entry[0].changes[0].value.messages[0].interactive
                .button_reply.title;

            if (title == "حذف منتج" || title == "Delete a product") {
              hispeed.status = "delete_item";
              await hispeed.save();

              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                type: "show_items",
              };

              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else if (title == "إستمرار" || title == "continuation") {
              if (parseFloat(hispeed.total_price).toFixed(3) < 3.99) {
                const wellcomeData = {
                  from: "00",
                  to: from,
                  phone_number: from,
                  content: hispeed.language === "ar" ? "أقل سعر للطلب 3.99 ر.ع \n يمكنك إضافة منتجات أخري" : "The minimum order price is 3.99 OMR \n You can add other products",
                  type: "text",
                };
                await sendToWhatsapp.sendToWhatsapp(wellcomeData);
              } else {

                if (hispeed.addresses.length > 0) {
                  const wellcomeData = {
                    from: "00",
                    to: from,
                    phone_number: from,
                    type: "default_address",
                  };

                  await sendToWhatsapp.sendToWhatsapp(wellcomeData);
                } else {
                  const wellcomeData = {
                    from: "00",
                    to: from,
                    phone_number: from,
                    type: "add_address",
                  };

                  await sendToWhatsapp.sendToWhatsapp(wellcomeData);
                }
              }
            } else if (title == "العنوان صحيح ؟" || title == "Address is correct ?") {
              hispeed.choosen_address = hispeed.addresses[0].id;
              await hispeed.save();
              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                type: "calculate_delivery_charge",
              };

              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else if (title == "تعديل العنوان" || title == "Edit address") {
              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                type: "address_option",
              };

              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else if (
              title == "إضافة منتجات أخري" ||
              title == "Add other products"
            ) {
              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                type: "show_categories",
              };

              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else if (title == "بطاقة الائتمان" || title == "Credit card") {
              if (hispeed.is_ordered && hispeed.order_id) {
                const wellcomeData = {
                  from: "00",
                  to: from,
                  phone_number: from,
                  content: hispeed.language === "ar" ? "يوجد لديك طلب مسبق \n يرجى الطلب من البداية" : "You have a previous order \n Please request from the beginning",
                  type: "text",
                };
                await sendToWhatsapp.sendToWhatsapp(wellcomeData);
              } else {

                hispeed.payment_method = "online";
                await hispeed.save();
                const wellcomeData = {
                  from: "00",
                  to: from,
                  phone_number: from,
                  type: "Payment_test",
                };
                await sendToWhatsapp.sendToWhatsapp(wellcomeData);
              }
            } else if (title == "دفع عند الإستلام" || title == "Payment upon receipt") {
              if (hispeed.is_ordered && hispeed.order_id) {
                const wellcomeData = {
                  from: "00",
                  to: from,
                  phone_number: from,

                  content: hispeed.language === "ar" ? "يوجد لديك طلب مسبق \n يرجى الطلب من البداية" : "You have a previous order \n Please request from the beginning",
                  type: "text",
                };
                await sendToWhatsapp.sendToWhatsapp(wellcomeData);
              } else {
                hispeed.payment_method = "cash";
                await hispeed.save();
                const wellcomeData = {
                  from: "00",
                  to: from,
                  phone_number: from,
                  type: "Payment_test",
                };
                await sendToWhatsapp.sendToWhatsapp(wellcomeData);
              }
            } else if (title == "إضافة عنوان" || title == "Add address") {
              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                type: "add_address",
              };

              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else if (title == "إختيار عنوان" || title == "Choose address") {
              hispeed.status = "choose_address";
              await hispeed.save();
              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                type: "choose_address",
              };

              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else if (title == "حذف عنوان" || title == "Delete address") {
              hispeed.status = "delete_address";
              await hispeed.save();
              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                type: "choose_address",
              };

              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else if (title == "العربيه") {

              hispeed.language = "ar";
              await hispeed.save();

              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                type: "start_service",
              };

              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else if (title == "English") {
              hispeed.language = "en";
              await hispeed.save();
              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                type: "start_service",
              };

              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else if (title == "خدمة العملاء" || title == "customer service") {
              hispeed.chat = "on";
              await hispeed.save();
              if (hispeed.language === "ar") {
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
                  // content: "لكى تتمكن من الرجوع الى الخدمة التلقائية \n يرجى كتابة تفعيل",
                  type: "active",
                };
                await sendToWhatsapp.sendToWhatsapp(wellcomeData2);
              } else {
                const wellcomeData = {
                  from: "00",
                  to: from,
                  phone_number: from,
                  content:
                    "Normal chat has been activated \n You can now continue the chat",
                  type: "text",
                };
                await sendToWhatsapp.sendToWhatsapp(wellcomeData);
                const wellcomeData2 = {
                  from: "00",
                  to: from,
                  phone_number: from,
                  // content: "In order to be able to return to the automatic service \n please write activ",
                  type: "active",
                };
                await sendToWhatsapp.sendToWhatsapp(wellcomeData2);
              }
            } else if (
              title == "الطلب عبر الواتساب" ||
              title == "Order via WhatsApp"
            ) {
              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                type: "sign_in_flow",
              };
              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else if (
              title == "المزيد من الخدمات" ||
              title == "More services"
            ) {
              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                type: "more_service",
              };
              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            }
            else if (
              title == "الطلب عبر الموقع" ||
              title == "Order via Website"
            ) {
              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                content: hispeed.language === "ar"
                  ? "يمكنك الطلب من خلال الموقع \n https://hispeed.om \n هل تريد فتح الموقع الأن ؟"
                  : "You can order through the website \n https://hispeed.om \n Do you want to open the website now ?",
                type: "text",
              };
              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else if (
              title == "حساب الانستغرام" ||
              title == "Instagram account"
            ) {
              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                content: hispeed.language === "ar" ?
                  "يمكنك متابعة حسابنا على الانستغرام \n https://www.instagram.com/hispeed.om "
                  : "You can follow our Instagram account \n https://www.instagram.com/hispeed.om ",
                type: "text",
              };
              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            }
          } else if (
            req.body.entry[0].changes[0].value.messaging_product &&
            req.body.entry[0].changes[0].value.messages &&
            req.body.entry[0].changes[0].value.messages[0].type == "button" &&
            req.body.entry[0].changes[0].value.messages[0].type == "button"
          ) {
            console.log("button bloc");

            let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
            let title =
              req.body.entry[0].changes[0].value.messages[0].button.text;

            if (hispeed.status == "choose_items") {
              if (
                title == "عرض منتجات زيت الزيتون" ||
                title == "Display Olive Oil Products"
              ) {
                hispeed.category_id = "498";
                await hispeed.save();

                const wellcomeData = {
                  from: "00",
                  to: from,
                  phone_number: from,
                  category_id: "498",
                  type: "subcategories",
                };
                await sendToWhatsapp.sendToWhatsapp(wellcomeData);
              } else if (
                title == "عرض منتجات المكسرات" ||
                title == "Display Nuts Products"
              ) {
                hispeed.category_id = "468";
                await hispeed.save();

                const wellcomeData = {
                  from: "00",
                  to: from,
                  phone_number: from,
                  category_id: "468",
                  type: "subcategories",
                };
                await sendToWhatsapp.sendToWhatsapp(wellcomeData);
              } else if (
                title == "عرض منتجات القهوة" ||
                title == "Display Coffee Products"
              ) {
                hispeed.category_id = "452";
                await hispeed.save();

                const wellcomeData = {
                  from: "00",
                  to: from,
                  phone_number: from,
                  category_id: "452",
                  type: "subcategories",
                };
                await sendToWhatsapp.sendToWhatsapp(wellcomeData);
              } else if (
                title == "عرض منتجات الطحينة" ||
                title == "Display Tahini Products"
              ) {
                hispeed.category_id = "465";
                await hispeed.save();

                const wellcomeData = {
                  from: "00",
                  to: from,
                  phone_number: from,
                  category_id: "465",
                  type: "subcategories",
                };
                await sendToWhatsapp.sendToWhatsapp(wellcomeData);
              } else if (
                title == "عرض الزيوت العلاجية" ||
                title == "Display Therapeutic Oils"
              ) {
                hispeed.category_id = "462";
                await hispeed.save();

                const wellcomeData = {
                  from: "00",
                  to: from,
                  phone_number: from,
                  category_id: "462",
                  type: "subcategories",
                };
                await sendToWhatsapp.sendToWhatsapp(wellcomeData);
              } else if (
                title == "عرض منتجات البهارات" ||
                title == "Display Spices Products"
              ) {
                hispeed.category_id = "463";
                await hispeed.save();

                const wellcomeData = {
                  from: "00",
                  to: from,
                  phone_number: from,
                  category_id: "463",
                  type: "subcategories",
                };
                await sendToWhatsapp.sendToWhatsapp(wellcomeData);
              } else if (
                title == "عرض منتجات الطحين بأنواعه" ||
                title == "Display Flour Products"
              ) {
                hispeed.category_id = "499";
                await hispeed.save();

                const wellcomeData = {
                  from: "00",
                  to: from,
                  phone_number: from,
                  category_id: "499",
                  type: "subcategories",
                };
                await sendToWhatsapp.sendToWhatsapp(wellcomeData);
              } else if (
                title == "عرض منتجات التمور والدبس" ||
                title == "Display of Dates and Molasses Products"
              ) {
                hispeed.category_id = "478";
                await hispeed.save();

                const wellcomeData = {
                  from: "00",
                  to: from,
                  phone_number: from,
                  category_id: "478",
                  type: "subcategories",
                };
                await sendToWhatsapp.sendToWhatsapp(wellcomeData);
              } else if (
                title == "عرض المنتجات الزراعية" ||
                title == "Display Agricultural Products"
              ) {
                hispeed.category_id = "446";
                await hispeed.save();

                const wellcomeData = {
                  from: "00",
                  to: from,
                  phone_number: from,
                  category_id: "446",
                  type: "subcategories",
                };
                await sendToWhatsapp.sendToWhatsapp(wellcomeData);
              } else if (
                title == "عرض منتجات العروض" ||
                title == "Show Offers Products"
              ) {
                // hispeed.category_id = "498";
                // await hispeed.save();

                const wellcomeData = {
                  from: "00",
                  to: from,
                  phone_number: from,
                  type: "show_offer_meals",
                };
                await sendToWhatsapp.sendToWhatsapp(wellcomeData);
              }
            } else if (
              title === "إيقاف عمليات الترويج" ||
              title === "برجاء عدم الإزعاج"
            ) {
              // let parentMessage = await Message.findOne({ wa_msg_id: parentMsg });
              msg = title; //"إيقاف عمليات الترويج";
              type = "text";
              let isExistInBlackList = await BlackList.findOne({
                // messageType: parentMessage.type,
                phoneNumber: from,
              });
              if (!isExistInBlackList) {
                let blackList = await BlackList.create({
                  //messageType: parentMessage.type,
                  phoneNumber: from,
                });
                console.log({
                  blackList,
                  //type: parentMessage ? parentMessage.type : "image_sale_template",
                  from,
                });
              } else {
                console.log({
                  isExistInBlackList,
                });
              }
            } else {
              if (hispeed.language === "ar") {
                const wellcomeData = {
                  from: "00",
                  to: from,
                  phone_number: from,
                  content:
                    "هذه الخطوة ليست فى الخطوة الحاليه \n يرجي الطلب من البداية",
                  type: "text",
                };
                await sendToWhatsapp.sendToWhatsapp(wellcomeData);
              } else {
                const wellcomeData = {
                  from: "00",
                  to: from,
                  phone_number: from,
                  content:
                    "This step is not in the current step \n Please request from the beginning",
                  type: "text",
                };
                await sendToWhatsapp.sendToWhatsapp(wellcomeData);
              }
            }
          } else if (
            req.body.entry[0].changes[0].value.messaging_product === "whatsapp" &&
            req.body.entry[0].changes[0].value.messages &&
            req.body.entry[0].changes[0].value.messages[0].type ===
            "interactive" &&
            req.body.entry[0].changes[0].value.messages[0].interactive
              .nfm_reply &&
            req.body.entry[0].changes[0].value.messages[0].interactive.nfm_reply
              .name === "flow"
          ) {
            console.log("flow bloc");

            let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload

            let response_json = JSON.parse(
              req.body.entry[0].changes[0].value.messages[0].interactive.nfm_reply
                .response_json
            );

            if (
              response_json.flow_token === "1283948373597390" ||
              response_json.flow_token === "3609426695864872"
            ) {
              hispeed.country_code = response_json.country_code;
              hispeed.phone = response_json.phone;
              await hispeed.save();

              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                country_code: response_json.country_code,
                phone: response_json.phone,
                type: "after_sign_in_flow",
              };
              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else if (
              response_json.flow_token === "2021905735035121" ||
              response_json.flow_token === "987466146953760"
            ) {
              hispeed.country_code = response_json.country_code;
              hispeed.phone = response_json.phone;
              hispeed.name = response_json.name;
              await hispeed.save();

              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                country_code: response_json.country_code,
                phone: response_json.phone,
                type: "after_sign_in_flow",
              };
              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else if (
              response_json.flow_token === "539606255304015" ||
              response_json.flow_token === "1196425284911424"
            ) {
              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                option_id: response_json.option,
                product_id: response_json.product_id,
                type: "save_option",
              };
              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else if (
              response_json.flow_token === "1949975815446699" ||
              response_json.flow_token === "1177618739973984"
            ) {
              const id = response_json.categories;
              if (id == "1") {
                hispeed.chat = "on";
                await hispeed.save();
                if (hispeed.language === "ar") {
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
                    content:
                      "لكى تتمكن من الرجوع الى الخدمة التلقائية \n يرجى كتابة تفعيل",
                    type: "text",
                  };
                  await sendToWhatsapp.sendToWhatsapp(wellcomeData2);
                } else {
                  const wellcomeData = {
                    from: "00",
                    to: from,
                    phone_number: from,
                    content:
                      "Normal chat has been activated \n You can now continue the chat",
                    type: "text",
                  };
                  await sendToWhatsapp.sendToWhatsapp(wellcomeData);
                  const wellcomeData2 = {
                    from: "00",
                    to: from,
                    phone_number: from,
                    content:
                      "In order to be able to return to the automatic service \n please write activ",
                    type: "text",
                  };
                  await sendToWhatsapp.sendToWhatsapp(wellcomeData2);
                }
              } else if (id == "2") {
                const wellcomeData = {
                  from: "00",
                  to: from,
                  phone_number: from,
                  type: "sign_in_flow",
                };
                await sendToWhatsapp.sendToWhatsapp(wellcomeData);
              } else if (id == "3") {
              } else if (id == "4") {
                const wellcomeData2 = {
                  from: "00",
                  to: from,
                  phone_number: from,
                  content:
                    hispeed.language === "ar"
                      ? "يرجى الانتظار قليلا الى حين تجهيز بيانات المحل"
                      : "Please wait a moment while the store data is being processed.",
                  type: "text",
                };
                await sendToWhatsapp.sendToWhatsapp(wellcomeData2);

                const wellcomeData = {
                  from: "00",
                  to: from,
                  phone_number: from,
                  type: "shop_details_template",
                };
                await sendToWhatsapp.sendToWhatsapp(wellcomeData);
              }
            } else if (
              response_json.flow_token === "8927485103933655" ||
              response_json.flow_token === "540320101762028"
            ) {
              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                weight_id: response_json.weights,
                product_id: response_json.product_id,
                type: "save_weight",
              };
              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else if (
              response_json.flow_token === "1223778322396717" ||
              response_json.flow_token === "463597586508167"
            ) {
              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                weight_id: response_json.weights,
                size_id: response_json.option,
                product_id: response_json.product_id,
                type: "save_size_weight",
              };
              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else if (
              response_json.flow_token === "1706657406987002" ||
              response_json.flow_token === "1980135359254535"
            ) {
              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                choosen_item: response_json.choosen_item,
                type: "delete_meal",
              };
              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else if (
              response_json.flow_token === "1942170483357520" ||
              response_json.flow_token === "919795327328123"
            ) {
              let length = hispeed.address_counter;
              const newAddress = {
                id: `${length + 1}`,
                name: response_json.name,
                email: response_json.email,
                country: response_json.countries,
              };
              hispeed.choosen_address = `${length + 1}`;
              hispeed.addresses.push(newAddress);
              hispeed.address_counter++;
              await hispeed.save();

              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                country: response_json.countries,
                address_id: `${length + 1}`,
                type: "states",
              };
              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else if (
              response_json.flow_token === "2361867857628849" ||
              response_json.flow_token === "1879942182678879"
            ) {
              let country;
              for (let index = 0; index < hispeed.addresses.length; index++) {
                const element = hispeed.addresses[index];
                if (element.id == response_json.address_id) {
                  element.state = response_json.states;
                  country = element.country;
                  element.street = response_json.street
                    ? response_json.street
                    : "";
                  await hispeed.save();
                  break;
                }
              }

              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                state: response_json.states,
                country: country,
                address_id: response_json.address_id,
                type: "save_state",
              };
              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else if (
              response_json.flow_token === "1441148217709414" ||
              response_json.flow_token === "2311447926052133"
            ) {
              let country = "";
              let state = "";
              for (let index = 0; index < hispeed.addresses.length; index++) {
                const element = hispeed.addresses[index];
                if (`${element.id}` === `${response_json.address_id}`) {
                  country = element.country;
                  state = element.state;
                  break;
                }
              }

              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                country,
                state,
                region: response_json.regions || response_json.region || response_json.states,
                address_id: response_json.address_id,
                type: "save_region",
              };
              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else if (
              response_json.flow_token === "2115546979299893" ||
              response_json.flow_token === "889744984112081"
            ) {
              let state;
              let city;

              if (hispeed.status == "delete_address") {
                for (let index = 0; index < hispeed.addresses.length; index++) {
                  const element = hispeed.addresses[index];
                  if (element.id == response_json.address) {
                    console.log("Document 555555555555.");
                    hispeed.addresses.splice(hispeed.addresses.indexOf(element), 1);
                    await hispeed.save();
                    if (hispeed.language === "ar") {
                      const wellcomeData = {
                        from: "00",
                        to: from,
                        phone_number: from,
                        content: "تم حذف العنوان بنجاح",
                        type: "text",
                      };
                      await sendToWhatsapp.sendToWhatsapp(wellcomeData);
                    } else {
                      const wellcomeData = {
                        from: "00",
                        to: from,
                        phone_number: from,
                        content: "Address deleted successfully",
                        type: "text",
                      };
                      await sendToWhatsapp.sendToWhatsapp(wellcomeData);
                    }

                    break;
                  }
                }

                if (!hispeed.addresses || hispeed.addresses.length === 0) {
                  hispeed.status = "add_address";
                  await hispeed.save();
                  const wellcomeData = {
                    from: "00",
                    to: from,
                    phone_number: from,
                    type: "add_address",
                  };
                  await sendToWhatsapp.sendToWhatsapp(wellcomeData);
                } else {
                  hispeed.status = "address";
                  await hispeed.save();
                  const wellcomeData = {
                    from: "00",
                    to: from,
                    phone_number: from,
                    type: "address_option",
                  };
                  await sendToWhatsapp.sendToWhatsapp(wellcomeData);
                }
              } else {
                hispeed.choosen_address = response_json.address;
                await hispeed.save();

                const wellcomeData = {
                  from: "00",
                  to: from,
                  phone_number: from,
                  type: "calculate_delivery_charge",
                };
                await sendToWhatsapp.sendToWhatsapp(wellcomeData);
              }
            } else if (
              response_json.flow_token === "453393884363277" ||
              response_json.flow_token === "1020093872759925"
            ) {
              hispeed.subcategory_id = response_json.subcategories;
              await hispeed.save();

              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                subcategory_id: response_json.subcategories,
                type: "show_category_meals",
              };
              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else if (
              response_json.flow_token === "1914155952420892" ||
              response_json.flow_token === "528146699653128"
            ) {
              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                choosen_item: response_json.choosen_item,
                type: "show_addition_of_product",
              };
              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else if (
              response_json.flow_token === "1028277695433728" ||
              response_json.flow_token === "475853465360020"
            ) {
              let additions = response_json.additions;
              if (additions.length > 0) {
                const wellcomeData = {
                  from: "00",
                  to: from,
                  phone_number: from,
                  additions: additions,
                  choosen_item: response_json.choosen_item,
                  type: "save_additions",
                };
                await sendToWhatsapp.sendToWhatsapp(wellcomeData);
              } else {
                const wellcomeData = {
                  from: "00",
                  to: from,
                  phone_number: from,
                  type: "show_card",
                };
                await sendToWhatsapp.sendToWhatsapp(wellcomeData);
              }
            } else if (
              response_json.flow_token === "941863128310437" ||
              response_json.flow_token === "1903514066957350"
            ) {
              if (hispeed.status == "choose_items") {
                hispeed.category_id = response_json.categories;
                await hispeed.save();

                const wellcomeData = {
                  from: "00",
                  to: from,
                  phone_number: from,
                  category_id: response_json.categories,
                  type: "show_category_meals",
                };
                await sendToWhatsapp.sendToWhatsapp(wellcomeData);
              } else {
                if (hispeed.language === "ar") {
                  const wellcomeData = {
                    from: "00",
                    to: from,
                    phone_number: from,
                    content:
                      "هذه الخطوة ليست فى الخطوة الحاليه \n يرجي الطلب من البداية",
                    type: "text",
                  };
                  await sendToWhatsapp.sendToWhatsapp(wellcomeData);
                } else {
                  const wellcomeData = {
                    from: "00",
                    to: from,
                    phone_number: from,
                    content:
                      "This step is not in the current step \n Please request from the beginning",
                    type: "text",
                  };
                  await sendToWhatsapp.sendToWhatsapp(wellcomeData);
                }
              }
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
              hispeed.chat = "of";
              await hispeed.save();
              if (hispeed.language === "ar") {
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
