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


      if (req.body.entry[0].changes[0].value.messaging_product &&
        req.body.entry[0].changes[0].value.messages) {
        let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload

        let shara = await OrderID.findOne({ from });

        if (shara == null) {
          shara = new OrderID({ from, chat: "of" });
          await shara.save();
        }

        if (shara.chat == "of") {
          if (
            req.body.entry[0].changes[0].value.messaging_product &&
            req.body.entry[0].changes[0].value.messages &&
            req.body.entry[0].changes[0].value.messages[0].type == "text"
          ) {
            let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
            let name = req.body.entry[0].changes[0].value.contacts[0].profile.name; // extract the phone number from the webhook payload
            let wa_msg_id = req.body.entry[0].changes[0].value.messages[0].id;
            let parentMsg = req.body.entry[0].changes[0].value.messages[0].context
              ? req.body.entry[0].changes[0].value.messages[0].context.id
              : null;

            shara = await OrderID.findOneAndUpdate(
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

          else if (
            req.body.entry[0].changes[0].value.messaging_product &&
            req.body.entry[0].changes[0].value.messages &&
            req.body.entry[0].changes[0].value.messages[0].type == "order"
          ) {
            console.log("order bloc");

            let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
            let wa_msg_id = req.body.entry[0].changes[0].value.messages[0].id; // extract the message ID
            let product_items =
              req.body.entry[0].changes[0].value.messages[0].order.product_items;

            let shara = await OrderID.findOne({ from });

            if (shara.status == "choose_items") {
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

              try {
                shara = await OrderID.findOneAndUpdate(
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
                console.log("✅ shara updated/created:", shara);
              } catch (err) {
                console.error("❌ Error in findOneAndUpdate:", err);
              }

              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                product_items: product_items,
                type: "test",
              };
              await sendToWhatsapp.sendToWhatsapp(wellcomeData);

              // if (shara.language === 'ar') {
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

            if (title == "إضافات لمنتج" || title == "Add-ons to a product") {
              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                type: "show_items_have_additions",
              };

              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else if (title == "حذف / إضافات" || title == "Delete / Additions") {
              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                type: "edit_option",
              };

              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else if (title == "حذف منتج" || title == "Delete a product") {
              shara.status = "delete_item";
              await shara.save();

              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                type: "show_items",
              };

              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else if (title == "إستمرار" || title == "continuation") {
              if (shara.addresses.length > 0) {
                const wellcomeData = {
                  from: "00",
                  to: from,
                  phone_number: from,
                  type: "address_option",
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
            } else if (title == "إضافة عنوان" || title == "Add address") {
              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                type: "add_address",
              };

              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else if (title == "إختيار عنوان" || title == "Choose address") {
              shara.status = "choose_address";
              await shara.save();
              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                type: "choose_address",
              };

              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else if (title == "حذف عنوان" || title == "Delete address") {
              shara.status = "delete_address";
              await shara.save();
              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                type: "choose_address",
              };

              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else if (title == "العربيه") {
              shara.language = "ar";
              await shara.save();

              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                type: "start_service",
              };

              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else if (title == "English") {
              shara.language = "en";
              await shara.save();
              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                type: "start_service",
              };

              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else if (title == "خدمة العملاء" || title == "customer service") {
              shara.chat = "on";
              await shara.save();
              if (shara.language === "ar") {
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
              title == "تسوق عبر الواتساب" ||
              title == "WhatsApp Shopping"
            ) {
              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                type: "sign_in_flow",
              };
              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else if (
              title == "تصفح الكتالوج" ||
              title == "Browse Catalog"
            ) {
              const wellcomeData2 = {
                from: "00",
                to: from,
                phone_number: from,
                content:
                  shara.language === "ar"
                    ? "يرجى الانتظار قليلا الى حين تجهيز البيانات"
                    : "Please wait a little while the data is being processed.",
                type: "text",
              };
              await sendToWhatsapp.sendToWhatsapp(wellcomeData2);

              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                type: "flow_catalog_display",
              };
              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else if (
              title == "الاسئلة الشائعة" ||
              title == "Common Questions"
            ) {
              // const wellcomeData = {
              //   from: "00",
              //   to: from,
              //   phone_number: from,
              //   type: "sign_in_flow",
              // };
              // await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else if (title == "مواقع متاجرنا" || title == "Store Locations") {
              const wellcomeData2 = {
                from: "00",
                to: from,
                phone_number: from,
                content:
                  shara.language === "ar"
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
            } else if (
              title == "المزيد عن الشرع" ||
              title == "More about Shara"
            ) {
              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                type: "more_about_shara",
              };
              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            } else if (
              title == "التسوق الإلكتروني" ||
              title == "Online shopping"
            ) {
              const content =
                shara.language === "ar"
                  ? "*يمكنك التسوق عبر متجرنا الإلكترونى من خلال الرابط التالى* \n https://alsharashoping.com"
                  : "*You can shop through our online store through the following link* \n https://alsharashoping.com";

              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                content: content,
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

            if (shara.status == "choose_items") {
              if (
                title == "عرض منتجات زيت الزيتون" ||
                title == "Display Olive Oil Products"
              ) {
                shara.category_id = "498";
                await shara.save();

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
                shara.category_id = "468";
                await shara.save();

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
                shara.category_id = "452";
                await shara.save();

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
                shara.category_id = "465";
                await shara.save();

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
                shara.category_id = "462";
                await shara.save();

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
                shara.category_id = "463";
                await shara.save();

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
                shara.category_id = "499";
                await shara.save();

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
                shara.category_id = "478";
                await shara.save();

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
                shara.category_id = "446";
                await shara.save();

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
                // shara.category_id = "498";
                // await shara.save();

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
              if (shara.language === "ar") {
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
              response_json.flow_token === "1743409142729679" ||
              response_json.flow_token === "854659986604079"
            ) {
              shara.to_verified = true;
              shara.country_code = response_json.country_code;
              shara.phone = response_json.phone;
              shara.name = response_json.name;
              await shara.save();

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
              response_json.flow_token === "1966101247184957" ||
              response_json.flow_token === "3754004011582057"
            ) {
              shara.to_verified = true;
              shara.country_code = response_json.country_code;
              shara.phone = response_json.phone;
              await shara.save();

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
                shara.chat = "on";
                await shara.save();
                if (shara.language === "ar") {
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
                    shara.language === "ar"
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
              response_json.flow_token === "536074965512119" ||
              response_json.flow_token === "1154777235632035"
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
              response_json.flow_token === "1066240944918344" ||
              response_json.flow_token === "1154420158993406"
            ) {
              let length = shara.address_counter;
              const newAddress = {
                id: `${length + 1}`,
                name: response_json.name,
                email: response_json.email,
                country: response_json.countries,
              };
              shara.choosen_address = `${length + 1}`;
              shara.addresses.push(newAddress);
              shara.address_counter++;
              await shara.save();

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
              response_json.flow_token === "1030692605325396" ||
              response_json.flow_token === "1198325044769888"
            ) {
              let country;
              for (let index = 0; index < shara.addresses.length; index++) {
                const element = shara.addresses[index];
                if (element.id == response_json.address_id) {
                  element.state = response_json.states;
                  country = element.country;
                  element.street = response_json.street
                    ? response_json.street
                    : "";
                  await shara.save();
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
              response_json.flow_token === "949185723888828" ||
              response_json.flow_token === "819689473328032"
            ) {
              let state;
              let city;

              if (shara.status == "delete_address") {
                for (let index = 0; index < shara.addresses.length; index++) {
                  const element = shara.addresses[index];
                  if (element.id == response_json.address) {
                    console.log("Document 555555555555.");
                    shara.addresses.splice(shara.addresses.indexOf(element), 1);
                    await shara.save();
                    if (shara.language === "ar") {
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

                if (!shara.addresses || shara.addresses.length === 0) {
                  shara.status = "add_address";
                  await shara.save();
                  const wellcomeData = {
                    from: "00",
                    to: from,
                    phone_number: from,
                    type: "add_address",
                  };
                  await sendToWhatsapp.sendToWhatsapp(wellcomeData);
                } else {
                  shara.status = "address";
                  await shara.save();
                  const wellcomeData = {
                    from: "00",
                    to: from,
                    phone_number: from,
                    type: "address_option",
                  };
                  await sendToWhatsapp.sendToWhatsapp(wellcomeData);
                }
              } else {
                shara.choosen_address = response_json.address;
                await shara.save();

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
              shara.subcategory_id = response_json.subcategories;
              await shara.save();

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
              response_json.flow_token === "431604453281835" ||
              response_json.flow_token === "951518313665963"
            ) {
              if (shara.status == "choose_items") {
                shara.category_id = response_json.categories;
                await shara.save();

                if (response_json.categories == "110000") {
                  const wellcomeData = {
                    from: "00",
                    to: from,
                    phone_number: from,
                    type: "show_offer_meals",
                  };
                  await sendToWhatsapp.sendToWhatsapp(wellcomeData);
                } else {
                  const wellcomeData = {
                    from: "00",
                    to: from,
                    phone_number: from,
                    category_id: response_json.categories,
                    type: "subcategories",
                  };
                  await sendToWhatsapp.sendToWhatsapp(wellcomeData);
                }
              } else {
                if (shara.language === "ar") {
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
              req.body.entry[0].changes[0].value.messages[0].text.body == "تفعيل" ||
              req.body.entry[0].changes[0].value.messages[0].text.body == "active" ||
              req.body.entry[0].changes[0].value.messages[0].text.body == "Active"
            ) {

              shara.chat = "of";
              await shara.save();
              if (shara.language === 'ar') {
                const wellcomeData2 = {
                  from: "00",
                  to: from,
                  phone_number: from,
                  content: "تم الرجوع الى الخدمة التلقائية",
                  type: "text",
                };
                await sendToWhatsapp.sendToWhatsapp(wellcomeData2);
              }
              else {
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
