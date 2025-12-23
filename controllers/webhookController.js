const axios = require("axios").default;
const token = process.env.WHATSAPP_TOKEN;
const User = require("../models/userModel");
const Message = require("../models/messageModel");
const Setting = require("../models/settingModel");
const BlackList = require("../models/blackListModel");
const Orders = require("../models/ordersModel");
const WHATSAPP_PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const axiosHelper = require("../helpers/axiosHelper");
const fs = require("fs");
const moment = require("moment-timezone");
const OrderID = require("../models/OrderIDModel");
sendToWhatsapp = require("../controllers/sendToWhatsapp");
const messageController = require("../controllers/messageController");
const thawaniController = require("../controllers/thawaniController");
const WebhookLogController = require("../controllers/WebhookLogController");
const BASE_URL = process.env.BASE_URL;
const path = require("path");
exports.postHandler = async (req, res) => {
  // Parse the request body from the POST
  let body = req.body;

  console.log("Test");
  // Check the Incoming webhook message
  console.log(JSON.stringify(req.body, null, 2));

  // const WebhookLog = await WebhookLogController.create(
  //   JSON.stringify(req.body, null, 2)
  // );
  // info on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages

  if (req.body.object === "whatsapp_business_account") {
    ////////////////////////////// Make Order ///////////////////////////////////

    console.log("sssssssssssssssssss");

    if (req.body.entry[0].changes[0].value.statuses) {
      const status = req.body.entry[0].changes[0].value.statuses[0].status;
      if (status == "failed") {
        console.log("failed status bloc");
        const code = req.body.entry?.[0]?.changes?.[0]?.value?.statuses?.[0]?.errors?.[0]?.code;

        if (code == 131049) {
          const from = req.body.entry?.[0]?.changes?.[0]?.value?.statuses?.[0]?.recipient_id;

          if (!from) {
            console.log("❌ لم يتم العثور على رقم المرسل");
            return;
          }

          let shara = await OrderID.findOne({ from });

          const language = shara?.language || "ar";

          const message =
            language === "ar"
              ? "عفوا لم يتم وصول القالب \n يرجى الإنتظار فترة من الزمن والمحاولة مره أخرى"
              : "Sorry, the template could not be reached \n Please wait a while and try again.";

          const wellcomeData = {
            from: "00",
            to: from,
            phone_number: from,
            content: message,
            type: "text",
          };

          await sendToWhatsapp.sendToWhatsapp(wellcomeData);
        }
      }

    }

    if (req.body.entry[0].changes[0].value) {
      console.log("gggggggggggggggggggggg");

      let from = null;
      if (req.body.entry[0].changes[0].value.statuses) {
        from = req.body.entry[0].changes[0].value.statuses[0].recipient_id;
      } else {
        from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
      }

      console.log("from", from);

      let shara = await OrderID.findOne({ from });
      // console.log("shara", shara);

      if (shara == null) {
        shara = new OrderID({ from, chat: "of" });
        await shara.save();
        console.log("new user");
      }

      if (shara.chat == "of") {
        console.log("chat of");

        if (req.body.entry[0].changes[0].value.statuses) {
          console.log({
            is_phone_number_id:
              +req.body.entry[0].changes[0].value.metadata.phone_number_id ===
              WHATSAPP_PHONE_NUMBER_ID,
            test: req.body.entry[0].changes[0].value.metadata.phone_number_id,
            en: WHATSAPP_PHONE_NUMBER_ID,
          });
          if (
            req.body.entry[0].changes[0].value.metadata.phone_number_id ===
            WHATSAPP_PHONE_NUMBER_ID
          ) {
            const WebhookLog = await WebhookLogController.create(
              JSON.stringify(req.body, null, 2)
            );
          }

          const ws_msg_id = req.body.entry[0].changes[0].value.statuses[0].id;
          if (
            req.body.entry[0].changes[0].value.statuses[0].status === "failed"
          ) {
            const errorMsg =
              req.body.entry[0].changes[0].value.statuses[0].errors[0]
                .error_data.details;

            if (
              req.body.entry[0].changes[0].value.metadata.phone_number_id ===
              WHATSAPP_PHONE_NUMBER_ID
            ) {
              const WebhookLog =
                await WebhookLogController.createWebhookFailedLog(
                  JSON.stringify(req.body, null, 2)
                );
            }

            await messageController.sendStatus(ws_msg_id, "failed", errorMsg);

            await messageController.deleteMessageByWaID(ws_msg_id);
          } else if (
            req.body.entry[0].changes[0].value.statuses[0].status === "sent"
          ) {
            await messageController.sendStatus(ws_msg_id, "sent", "sent");
          } else if (
            req.body.entry[0].changes[0].value.statuses[0].status ===
            "delivered"
          ) {
            await messageController.sendStatus(
              ws_msg_id,
              "delivered",
              "delivered"
            );
          } else if (
            req.body.entry[0].changes[0].value.statuses[0].status === "read"
          ) {
            await messageController.sendStatus(ws_msg_id, "read", "read");
          }
        }

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
              order_id: "123",
              name: "saleh",
              status: "deliverd",
              url: "admin/orders/all",
              type: "change_status",
            };

            sendToWhatsapp.sendToWhatsapp(wellcomeData);
          } else {
            const dataToDashboard = {
              phone_number: from,
              content: msg,
              type,
              name: name ? name : from,
              user_name: name ? name : from,
              platform: "whatsapp",
              wa_msg_id,
              parentMsg,
            };

            messageController.sendMessage(dataToDashboard);
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

          // const wellcomeData = {
          //   from: "00",
          //   to: from,
          //   phone_number: from,
          //   parentMsg: wa_msg_id,
          //   type: "payment_way",
          // };

          // await sendToWhatsapp.sendToWhatsapp(wellcomeData);

          // const wellcomeData = {
          //   from: "00",
          //   to: from,
          //   phone_number: from,
          //   parentMsg: wa_msg_id,
          //   type: "receipt_from_branch",
          // };

          // await sendToWhatsapp.sendToWhatsapp(wellcomeData);

          // const wellcomeData2 = {
          //   from: "00",
          //   to: from,
          //   phone_number: from,
          //   parentMsg: wa_msg_id,
          //   type: "show_card",
          // };

          // await sendToWhatsapp.sendToWhatsapp(wellcomeData2);
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
        } else {
          if (req.body.entry[0].changes[0].value.messages) {
            let msg = null;
            let type = null;
            let caption = null;
            const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
            type = message?.type;
            caption = message?.[type]?.caption || "";


            // type = req.body.entry[0].changes[0].value.messages[0].type;
            // caption = req.body.entry[0].changes[0].value.messages[0][type] && req.body.entry[0].changes[0].value.messages[0][type]["caption"]
            //   ? req.body.entry[0].changes[0].value.messages[0][type]["caption"]
            //   : "";
            let wa_msg_id = req.body.entry[0].changes[0].value.messages[0]?.id;
            let parentMsg = req.body.entry[0].changes[0].value.messages[0]
              .context
              ? req.body.entry[0].changes[0].value.messages[0]?.context?.id
              : null;
            let name =
              req.body.entry[0].changes[0].value.contacts[0].profile.name;

            const url =
              "https://graph.facebook.com/v17.0/" +
              req?.body?.entry[0]?.changes[0]?.value?.messages[0][type]?.id;
            msg = `${req.body.entry[0].changes[0].value.messages[0].type} Message`;
            //`attachments/${wa_msg_id}-${from}.${ext}`
            let config = {
              method: "get",
              maxBodyLength: Infinity,
              keepExtensions: true,
              url,
              headers: {
                "Content-Type": "application/json",
                // responseType: 'arraybuffer' ,
                Authorization: `Bearer ${token}`,
              },
            };

            try {
              // response = await axios.post(url, {data:formData} , config);
              let response = await axios.request(config);

              // fs.unlink(`${inputData.file.name}`);

              // response = await fetch(url, {method: 'POST', body: formData });
              config.url = response.data.url;
              config["responseType"] = "arraybuffer";
              response = await axios.request(config);
              console.log({
                data: response.data,
              });
              const ext = response.headers["content-type"].split("/")[1];

              // const buffer = Buffer.from(response.data, "base64");
              fs.writeFileSync(
                `attachments/${wa_msg_id}-${from}.${ext}`,
                response.data
              );

              msg = `${BASE_URL}/attachments/${wa_msg_id}-${from}.${ext}`;
              console.log({ msg, type });

              let isMsgFromAdmin = false;

              const dataToDashboard = {
                phone_number: from,
                content: msg,
                caption,
                type,
                name: name ? name : from,
                user_name: name ? name : from,
                platform: "whatsapp",
                wa_msg_id,
                parentMsg,
              };

              messageController.sendMessage(dataToDashboard, isMsgFromAdmin);

              // console.log("File written successfully\n");
              // n successfully\n");
              // console.log("The written has the following contents:");
              // console.log(fs.readFileSync(`attachments/eg.jpg`, "utf8"));
            } catch (err) {
              console.log({
                err: err,
              });
            }
          }
        }
      } else {
        console.log("333333333333333333");

        // if (
        //   req.body.entry[0].changes[0].value.messaging_product &&
        //   req.body.entry[0].changes[0].value.messages &&
        //   req.body.entry[0].changes[0].value.messages[0].type == "text"
        // ) {
        //   let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
        //   let wa_msg_id = req.body.entry[0].changes[0].value.messages[0].id;
        //   if (
        //     req.body.entry[0].changes[0].value.messages[0].text.body == "تفعيل" ||
        //     req.body.entry[0].changes[0].value.messages[0].text.body == "active" ||
        //     req.body.entry[0].changes[0].value.messages[0].text.body == "Active"
        //   ) {

        //     shara.chat = "of";
        //     await shara.save();
        //     if (shara.language === 'ar') {
        //       const wellcomeData2 = {
        //         from: "00",
        //         to: from,
        //         phone_number: from,
        //         content: "تم الرجوع الى الخدمة التلقائية",
        //         type: "text",
        //       };
        //       await sendToWhatsapp.sendToWhatsapp(wellcomeData2);
        //     }
        //     else {
        //       const wellcomeData2 = {
        //         from: "00",
        //         to: from,
        //         phone_number: from,
        //         content: "The automatic service has been returned",
        //         type: "text",
        //       };
        //       await sendToWhatsapp.sendToWhatsapp(wellcomeData2);
        //     }

        //     const wellcomeData = {
        //       from: "00",
        //       to: from,
        //       phone_number: from,
        //       parentMsg: wa_msg_id,
        //       type: "select_language_template",
        //     };
        //     await sendToWhatsapp.sendToWhatsapp(wellcomeData);

        //   }
        // }

        if (req.body.entry[0].changes[0].value.statuses) {
          console.log({
            is_phone_number_id:
              +req.body.entry[0].changes[0].value.metadata.phone_number_id ===
              WHATSAPP_PHONE_NUMBER_ID,
            test: req.body.entry[0].changes[0].value.metadata.phone_number_id,
            en: WHATSAPP_PHONE_NUMBER_ID,
          });
          if (
            req.body.entry[0].changes[0].value.metadata.phone_number_id ===
            WHATSAPP_PHONE_NUMBER_ID
          ) {
            const WebhookLog = await WebhookLogController.create(
              JSON.stringify(req.body, null, 2)
            );
          }

          const ws_msg_id = req.body.entry[0].changes[0].value.statuses[0].id;
          if (
            req.body.entry[0].changes[0].value.statuses[0].status === "failed"
          ) {
            const errorMsg =
              req.body.entry[0].changes[0].value.statuses[0].errors[0]
                .error_data.details;

            if (
              req.body.entry[0].changes[0].value.metadata.phone_number_id ===
              WHATSAPP_PHONE_NUMBER_ID
            ) {
              const WebhookLog =
                await WebhookLogController.createWebhookFailedLog(
                  JSON.stringify(req.body, null, 2)
                );
            }

            await messageController.sendStatus(ws_msg_id, "failed", errorMsg);

            await messageController.deleteMessageByWaID(ws_msg_id);
          } else if (
            req.body.entry[0].changes[0].value.statuses[0].status === "sent"
          ) {
            await messageController.sendStatus(ws_msg_id, "sent", "sent");
          } else if (
            req.body.entry[0].changes[0].value.statuses[0].status ===
            "delivered"
          ) {
            await messageController.sendStatus(
              ws_msg_id,
              "delivered",
              "delivered"
            );
          } else if (
            req.body.entry[0].changes[0].value.statuses[0].status === "read"
          ) {
            await messageController.sendStatus(ws_msg_id, "read", "read");
          }
        }

        ////////////////////////////// Make Order ///////////////////////////////////
        else if (
          req.body.entry[0].changes[0].value.messaging_product &&
          req.body.entry[0].changes[0].value.messages[0].type == "order"
        ) {
          let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
          let name =
            req.body.entry[0].changes[0].value.contacts[0].profile.name; // extract the phone number from the webhook payload
          let wa_msg_id = req.body.entry[0].changes[0].value.messages[0].id;
          let parentMsg = req.body.entry[0].changes[0].value.messages[0].context
            ? req.body.entry[0].changes[0].value.messages[0].context.id
            : null;
          let catalog_id =
            req.body.entry[0].changes[0].value.messages[0].order.catalog_id;
          let product_items =
            req.body.entry[0].changes[0].value.messages[0].order.product_items;
          let msg = "هل تريد الاستمرار في عملية الشراء هذه ؟";

          const adminId = await User.findOne({ platform: "admin" });
          const user = await User.findOne({ phone_number: from });

          // const order = await Orders.create({
          //   product_items,
          //   catalog_id,
          //   wa_msg_id,
          //   from: user,
          //   to: adminId,
          // });
          // await order.save();

          // const saveMessageOrder = {
          //   from: user,
          //   to: adminId,
          //   content: "make_order",
          //   wa_msg_id: wa_msg_id,
          //   type: "make_order",
          // };

          // messageController.saveMessage22(saveMessageOrder);

          // const wellcomeData = {
          //   from: adminId,
          //   to: user,
          //   phone_number: from,
          //   content: msg,
          //   parentMsg: wa_msg_id,
          //   orderId: order._id,
          //   type: "confirm_order",
          // };

          // messageController.sendWellcomeMessage(wellcomeData);
          shara.chat = "of";
          await shara.save();

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
        } else if (
          req.body.entry[0].changes[0].value.messaging_product &&
          req.body.entry[0].changes[0].value.messages[0].type ==
          "interactive" &&
          req.body.entry[0].changes[0].value.messages[0].interactive.type ==
          "button_reply" &&
          req.body.entry[0].changes[0].value.messages[0].interactive
            .button_reply.title == "نعم استمر في الشراء"
        ) {
          let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
          let name =
            req.body.entry[0].changes[0].value.contacts[0].profile.name; // extract the phone number from the webhook payload
          let wa_msg_id = req.body.entry[0].changes[0].value.messages[0].id;
          let parentMsg = req.body.entry[0].changes[0].value.messages[0].context
            ? req.body.entry[0].changes[0].value.messages[0].context.id
            : null;
          let orderMsg_id =
            req.body.entry[0].changes[0].value.messages[0].interactive
              .button_reply.id;
          // let msg = "رابط الدفع";

          // const adminId = await User.findOne({ platform: "admin" });
          // const user = await User.findOne({ phone_number: from });

          // const wellcomeData = {
          //   from: adminId,
          //   to: user,
          //   phone_number: from,
          //   content: msg,
          //   // parentMsg: wa_msg_id,
          //   type: "text",
          // };

          // messageController.sendWellcomeMessage(wellcomeData);

          await thawaniController.createThawaniSession(
            orderMsg_id,
            { customerName: name },
            from
          );
        }
        ////////////////////////////// Make Order ///////////////////////////////////
        else if (
          req.body.entry &&
          req.body.entry[0].changes &&
          req.body.entry[0].changes[0] &&
          req.body.entry[0].changes[0].value.messages &&
          req.body.entry[0].changes[0].value.messages[0]
        ) {
          // const response = await axios.post(
          //   "https://smarterp.top/api/v1.0/products/index?token=YjMyY2JjZjc5ZDUxOTYxMTNiNDc0MTNjYmRiZWMzMjk=&company=demo_oman",
          //   {
          //     limit: 1000000000000,
          //   }
          // );
          // const data = response["data"]["data"];
          let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
          let name =
            req.body.entry[0].changes[0].value.contacts[0].profile.name; // extract the phone number from the webhook payload
          let wa_msg_id = req.body.entry[0].changes[0].value.messages[0].id;
          let parentMsg = req.body.entry[0].changes[0].value.messages[0].context
            ? req.body.entry[0].changes[0].value.messages[0].context.id
            : null;
          let msgType = req.body.entry[0].changes[0].value.messages[0].type;

          // console.log(response);
          // console.log(response["data"]["data"][0]["name"]);
          let msg = null;
          let type = null;
          let caption = null;

          if (msgType === "button") {
            let btnType =
              req.body.entry[0].changes[0].value.messages[0].button.payload;
            if (
              btnType === "إيقاف عمليات الترويج" ||
              btnType == "برجاء عدم الإزعاج"
            ) {
              // let parentMessage = await Message.findOne({ wa_msg_id: parentMsg });
              msg = btnType;
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
            }
          } else if (
            req.body.entry[0].changes[0].value.messaging_product &&
            req.body.entry[0].changes[0].value.messages &&
            req.body.entry[0].changes[0].value.messages[0].type == "text"
          ) {
            msg = req.body.entry[0].changes[0].value.messages[0].text.body;
            type = req.body.entry[0].changes[0].value.messages[0].type;
            let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
            let wa_msg_id = req.body.entry[0].changes[0].value.messages[0].id;
            // if (
            //   req.body.entry[0].changes[0].value.messages[0].text.body == "تفعيل" ||
            //   req.body.entry[0].changes[0].value.messages[0].text.body == "active" ||
            //   req.body.entry[0].changes[0].value.messages[0].text.body == "Active"
            // ) {

            //   shara.chat = "of";
            //   await shara.save();
            //   if (shara.language === 'ar') {
            //     const wellcomeData2 = {
            //       from: "00",
            //       to: from,
            //       phone_number: from,
            //       content: "تم الرجوع الى الخدمة التلقائية",
            //       type: "text",
            //     };
            //     await sendToWhatsapp.sendToWhatsapp(wellcomeData2);
            //   }
            //   else {
            //     const wellcomeData2 = {
            //       from: "00",
            //       to: from,
            //       phone_number: from,
            //       content: "The automatic service has been returned",
            //       type: "text",
            //     };
            //     await sendToWhatsapp.sendToWhatsapp(wellcomeData2);
            //   }

            //   const wellcomeData = {
            //     from: "00",
            //     to: from,
            //     phone_number: from,
            //     parentMsg: wa_msg_id,
            //     type: "select_language",
            //   };
            //   await sendToWhatsapp.sendToWhatsapp(wellcomeData);

            // }
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
            let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
            let wa_msg_id = req.body.entry[0].changes[0].value.messages[0].id;

            if (title == "تفعيل" || title == "activate") {
              shara.chat = "of";
              await shara.save();
              const content =
                shara.language === "ar"
                  ? "تم الرجوع الى الخدمة التلقائية"
                  : "The automatic service has been returned";

              const wellcomeData2 = {
                from: "00",
                to: from,
                phone_number: from,
                content,
                type: "text",
              };

              await sendToWhatsapp.sendToWhatsapp(wellcomeData2);

              const wellcomeData = {
                from: "00",
                to: from,
                phone_number: from,
                parentMsg: wa_msg_id,
                type: "select_language",
              };
              await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            }
          } else {
            type = req.body.entry[0].changes[0].value.messages[0].type;
            caption = req.body.entry[0].changes[0].value.messages[0][type][
              "caption"
            ]
              ? req.body.entry[0].changes[0].value.messages[0][type]["caption"]
              : "";

            const url =
              "https://graph.facebook.com/v17.0/" +
              req.body.entry[0].changes[0].value.messages[0][type].id;
            msg = `${req.body.entry[0].changes[0].value.messages[0].type} Message`;
            //`attachments/${wa_msg_id}-${from}.${ext}`
            let config = {
              method: "get",
              maxBodyLength: Infinity,
              keepExtensions: true,
              url,
              headers: {
                "Content-Type": "application/json",
                // responseType: 'arraybuffer' ,
                Authorization: `Bearer ${token}`,
              },
            };

            try {
              // response = await axios.post(url, {data:formData} , config);
              let response = await axios.request(config);

              // fs.unlink(`${inputData.file.name}`);

              // response = await fetch(url, {method: 'POST', body: formData });
              config.url = response.data.url;
              config["responseType"] = "arraybuffer";
              response = await axios.request(config);
              console.log({
                data: response.data,
              });
              const ext = response.headers["content-type"].split("/")[1];

              // const buffer = Buffer.from(response.data, "base64");
              fs.writeFileSync(
                `attachments/${wa_msg_id}-${from}.${ext}`,
                response.data
              );

              msg = `${BASE_URL}/attachments/${wa_msg_id}-${from}.${ext}`;
              console.log({ msg, type });

              // console.log("File written successfully\n");
              // n successfully\n");
              // console.log("The written has the following contents:");
              // console.log(fs.readFileSync(`attachments/eg.jpg`, "utf8"));
            } catch (err) {
              console.log({
                err: err,
              });
            }
          }

          const user = await User.findOne({ phone_number: from });
          const adminId = await User.findOne({ platform: "admin" });
          let isMsgFromAdmin = false;
          if (user) {
            const userLastMsg = await Message.findOne(
              { from: adminId._id, to: user._id },
              null,
              {
                sort: { createdAt: -1 },
              }
            );

            // To set two dates to two variables
            let today = new Date();
            let msgDate = userLastMsg ? new Date(userLastMsg.createdAt) : today;
            let isUserExistInBlackList = await BlackList.findOne({
              // messageType: parentMessage.type,
              phoneNumber: from,
            });
            // To calculate the time difference of two dates
            let Difference_In_Time = today.getTime() - msgDate.getTime();

            // To calculate the no. of days between two dates
            let Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);

            console.log("##@@@@@@@@", {
              from: adminId._id,
              to: user._id,
              Difference_In_Days,
            });
            // if (!isUserExistInBlackList && Difference_In_Days >= 1 || Difference_In_Days == 0) {
            //   console.log(
            //     "<<<<<<<<<<<<<<<<<<< wellcome >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
            //   );
            //   isMsgFromAdmin = true;

            //   const wellcomeMsg = await Setting.findOne({
            //     key: "wellcome_message",
            //   });
            //   console.log({
            //     wellcomeMsg,
            //   });
            //   const wellcomeData = {
            //     from: adminId,
            //     to: user,
            //     phone_number: from,
            //     content: wellcomeMsg ? wellcomeMsg.value : "Wellcome To our application",
            //     type: "text",
            //   };

            //   messageController.sendWellcomeMessage(wellcomeData);
            // }
          }

          const dataToDashboard = {
            phone_number: from,
            content: msg,
            caption,
            type,
            name: name ? name : from,
            user_name: name ? name : from,
            platform: "whatsapp",
            wa_msg_id,
            parentMsg,
          };

          messageController.sendMessage(dataToDashboard, isMsgFromAdmin);
          // io.emit("newmsg", { msg, phone_number: from });
          //       for (let i = 0; i < 3; i++) {
          //         const element = data[i];
          //         let productName = data[i]["name"];
          //         let productPrice = data[i]["price"];
          //         const productThumbnail = data[i]["thumb"];

          //         let phone_number_id =
          //           req.body.entry[0].changes[0].value.metadata.phone_number_id;

          //         let msg_body = req.body.entry[0].changes[0].value.messages[0].text.body; // extract the message text from the webhook payload

          //         await axios({
          //           method: "POST", // Required, HTTP method, a string, e.g. POST, GET
          //           url:
          //             "https://graph.facebook.com/v12.0/" +
          //             phone_number_id +
          //             "/messages?access_token=" +
          //             token,
          //           data: {
          //             messaging_product: "whatsapp",
          //             to: from,
          //             //   text: { body: "Ack: " + msg_body  },
          //             //             text: {
          //             //               body: `القي نظرة على منتجنا:
          //             // *${products}* بسعر: ${productPrice} ريال,
          //             //   . لمزيد من المنتجات قم بزيارة الرابط التالي👇
          //             // https://www.facebook.com/MuscatApps`,
          //             //             },
          //             // type: "template",
          //             // template: {
          //             //   name: "hello_world",
          //             //   language: {
          //             //     code: "en_US",
          //             //   },
          //             // },
          //             type: "template",
          //             template: {
          //               name: "sample_test",
          //               language: {
          //                 code: "ar",
          //               },
          //               components: [
          //                 {
          //                   type: "header",
          //                   parameters: [
          //                     {
          //                       type: "image",
          //                       image: {
          //                         link: productThumbnail,
          //                       },
          //                     },
          //                   ],
          //                 },
          //                 {
          //                   type: "body",
          //                   parameters: [
          //                     {
          //                       type: "text",
          //                       text: from,
          //                     },
          //                     {
          //                       type: "text",
          //                       text: productName,
          //                     },
          //                     {
          //                       type: "text",
          //                       text: productPrice,
          //                     },
          //                     {
          //                       type: "text",
          //                       text: "ريال",
          //                     },
          //                   ],
          //                 },
          //               ],
          //             },
          //           },
          //           headers: { "Content-Type": "application/json" },
          //         });
          //       }
        }
      }
    }

    res.sendStatus(200);
  }

  // if (req.body.object === "whatsapp_business_account") {
  //   if (req.body.entry[0].changes[0].value.statuses) {
  //     console.log({
  //       is_phone_number_id: +req.body.entry[0].changes[0].value.metadata.phone_number_id ===
  //         WHATSAPP_PHONE_NUMBER_ID,
  //       test: req.body.entry[0].changes[0].value.metadata.phone_number_id,
  //       en: WHATSAPP_PHONE_NUMBER_ID
  //     })
  //     if (
  //       req.body.entry[0].changes[0].value.metadata.phone_number_id ===
  //       WHATSAPP_PHONE_NUMBER_ID
  //     ) {
  //       const WebhookLog = await WebhookLogController.create(
  //         JSON.stringify(req.body, null, 2)
  //       );
  //     }

  //     const ws_msg_id = req.body.entry[0].changes[0].value.statuses[0].id;
  //     if (req.body.entry[0].changes[0].value.statuses[0].status === "failed") {
  //       const errorMsg =
  //         req.body.entry[0].changes[0].value.statuses[0].errors[0].error_data
  //           .details;

  //       if (
  //         req.body.entry[0].changes[0].value.metadata.phone_number_id ===
  //         WHATSAPP_PHONE_NUMBER_ID
  //       ) {
  //         const WebhookLog = await WebhookLogController.createWebhookFailedLog(
  //           JSON.stringify(req.body, null, 2)
  //         );
  //       }

  //       await messageController.sendStatus(ws_msg_id, "failed", errorMsg);

  //       await messageController.deleteMessageByWaID(ws_msg_id);
  //     } else if (
  //       req.body.entry[0].changes[0].value.statuses[0].status === "sent"
  //     ) {
  //       await messageController.sendStatus(ws_msg_id, "sent", "sent");
  //     } else if (
  //       req.body.entry[0].changes[0].value.statuses[0].status === "delivered"
  //     ) {
  //       await messageController.sendStatus(ws_msg_id, "delivered", "delivered");
  //     } else if (
  //       req.body.entry[0].changes[0].value.statuses[0].status === "read"
  //     ) {
  //       await messageController.sendStatus(ws_msg_id, "read", "read");
  //     }
  //   }

  //   ////////////////////////////// Make Order ///////////////////////////////////
  //   else if (
  //     req.body.entry[0].changes[0].value.messaging_product &&
  //     req.body.entry[0].changes[0].value.messages[0].type == "order"
  //   ) {
  //     let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
  //     let name = req.body.entry[0].changes[0].value.contacts[0].profile.name; // extract the phone number from the webhook payload
  //     let wa_msg_id = req.body.entry[0].changes[0].value.messages[0].id;
  //     let parentMsg = req.body.entry[0].changes[0].value.messages[0].context
  //       ? req.body.entry[0].changes[0].value.messages[0].context.id
  //       : null;
  //     let catalog_id =
  //       req.body.entry[0].changes[0].value.messages[0].order.catalog_id;
  //     let product_items =
  //       req.body.entry[0].changes[0].value.messages[0].order.product_items;
  //     let msg = "هل تريد الاستمرار في عملية الشراء هذه ؟";

  //     const adminId = await User.findOne({ platform: "admin" });
  //     const user = await User.findOne({ phone_number: from });

  //     const order = await Orders.create({
  //       product_items,
  //       catalog_id,
  //       wa_msg_id,
  //       from: user,
  //       to: adminId,
  //     });
  //     await order.save();

  //     const saveMessageOrder = {
  //       from: user,
  //       to: adminId,
  //       content: "make_order",
  //       wa_msg_id: wa_msg_id,
  //       type: "make_order",
  //     };

  //     messageController.saveMessage22(saveMessageOrder);

  //     const wellcomeData = {
  //       from: adminId,
  //       to: user,
  //       phone_number: from,
  //       content: msg,
  //       parentMsg: wa_msg_id,
  //       orderId: order._id,
  //       type: "confirm_order",
  //     };

  //     messageController.sendWellcomeMessage(wellcomeData);
  //   } else if (
  //     req.body.entry[0].changes[0].value.messaging_product &&
  //     req.body.entry[0].changes[0].value.messages[0].type == "interactive" &&
  //     req.body.entry[0].changes[0].value.messages[0].interactive.type ==
  //     "button_reply" &&
  //     req.body.entry[0].changes[0].value.messages[0].interactive.button_reply
  //       .title == "نعم استمر في الشراء"
  //   ) {
  //     let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
  //     let name = req.body.entry[0].changes[0].value.contacts[0].profile.name; // extract the phone number from the webhook payload
  //     let wa_msg_id = req.body.entry[0].changes[0].value.messages[0].id;
  //     let parentMsg = req.body.entry[0].changes[0].value.messages[0].context
  //       ? req.body.entry[0].changes[0].value.messages[0].context.id
  //       : null;
  //     let orderMsg_id =
  //       req.body.entry[0].changes[0].value.messages[0].interactive.button_reply
  //         .id;
  //     // let msg = "رابط الدفع";

  //     // const adminId = await User.findOne({ platform: "admin" });
  //     // const user = await User.findOne({ phone_number: from });

  //     // const wellcomeData = {
  //     //   from: adminId,
  //     //   to: user,
  //     //   phone_number: from,
  //     //   content: msg,
  //     //   // parentMsg: wa_msg_id,
  //     //   type: "text",
  //     // };

  //     // messageController.sendWellcomeMessage(wellcomeData);

  //     await thawaniController.createThawaniSession(
  //       orderMsg_id,
  //       { customerName: name },
  //       from
  //     );
  //   }
  //   ////////////////////////////// Make Order ///////////////////////////////////
  //   else if (
  //     req.body.entry &&
  //     req.body.entry[0].changes &&
  //     req.body.entry[0].changes[0] &&
  //     req.body.entry[0].changes[0].value.messages &&
  //     req.body.entry[0].changes[0].value.messages[0]
  //   ) {
  //     // const response = await axios.post(
  //     //   "https://smarterp.top/api/v1.0/products/index?token=YjMyY2JjZjc5ZDUxOTYxMTNiNDc0MTNjYmRiZWMzMjk=&company=demo_oman",
  //     //   {
  //     //     limit: 1000000000000,
  //     //   }
  //     // );
  //     // const data = response["data"]["data"];
  //     let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
  //     let name = req.body.entry[0].changes[0].value.contacts[0].profile.name; // extract the phone number from the webhook payload
  //     let wa_msg_id = req.body.entry[0].changes[0].value.messages[0].id;
  //     let parentMsg = req.body.entry[0].changes[0].value.messages[0].context
  //       ? req.body.entry[0].changes[0].value.messages[0].context.id
  //       : null;
  //     let msgType = req.body.entry[0].changes[0].value.messages[0].type;

  //     // console.log(response);
  //     // console.log(response["data"]["data"][0]["name"]);
  //     let msg = null;
  //     let type = null;
  //     if (msgType === "button") {
  //       let btnType =
  //         req.body.entry[0].changes[0].value.messages[0].button.payload;
  //       if (btnType === "إيقاف عمليات الترويج") {
  //         // let parentMessage = await Message.findOne({ wa_msg_id: parentMsg });
  //         msg = "إيقاف عمليات الترويج";
  //         type = "text";
  //         let isExistInBlackList = await BlackList.findOne({
  //           // messageType: parentMessage.type,
  //           phoneNumber: from,
  //         });
  //         if (!isExistInBlackList) {
  //           let blackList = await BlackList.create({
  //             //messageType: parentMessage.type,
  //             phoneNumber: from,
  //           });
  //           console.log({
  //             blackList,
  //             //type: parentMessage ? parentMessage.type : "image_sale_template",
  //             from,
  //           });
  //         } else {
  //           console.log({
  //             isExistInBlackList,
  //           });
  //         }
  //       }
  //     } else if (
  //       req.body.entry[0].changes[0].value.messages[0].type === "text"
  //     ) {
  //       msg = req.body.entry[0].changes[0].value.messages[0].text.body;
  //       type = req.body.entry[0].changes[0].value.messages[0].type;
  //     } else {
  //       type = req.body.entry[0].changes[0].value.messages[0].type;
  //       const url =
  //         "https://graph.facebook.com/v17.0/" +
  //         req.body.entry[0].changes[0].value.messages[0][type].id;
  //       msg = `${req.body.entry[0].changes[0].value.messages[0].type} Message`;
  //       //`attachments/${wa_msg_id}-${from}.${ext}`
  //       let config = {
  //         method: "get",
  //         maxBodyLength: Infinity,
  //         keepExtensions: true,
  //         url,
  //         headers: {
  //           "Content-Type": "application/json",
  //           // responseType: 'arraybuffer' ,
  //           Authorization: `Bearer ${token}`,
  //         },
  //       };

  //       try {
  //         // response = await axios.post(url, {data:formData} , config);
  //         let response = await axios.request(config);

  //         // fs.unlink(`${inputData.file.name}`);

  //         // response = await fetch(url, {method: 'POST', body: formData });
  //         config.url = response.data.url;
  //         config["responseType"] = "arraybuffer";
  //         response = await axios.request(config);
  //         console.log({
  //           data: response.data,
  //         });
  //         const ext = response.headers["content-type"].split("/")[1];

  //         // const buffer = Buffer.from(response.data, "base64");
  //         fs.writeFileSync(
  //           `attachments/${wa_msg_id}-${from}.${ext}`,
  //           response.data
  //         );

  //         msg = `${BASE_URL}/attachments/${wa_msg_id}-${from}.${ext}`;
  //         console.log({ msg, type });

  //         // console.log("File written successfully\n");
  //         // n successfully\n");
  //         // console.log("The written has the following contents:");
  //         // console.log(fs.readFileSync(`attachments/eg.jpg`, "utf8"));
  //       } catch (err) {
  //         console.log({
  //           err: err,
  //         });
  //       }
  //     }

  //     const user = await User.findOne({ phone_number: from });
  //     const adminId = await User.findOne({ platform: "admin" });
  //     if (user) {
  //       const userLastMsg = await Message.findOne(
  //         { from: adminId._id, to: user._id },
  //         null,
  //         {
  //           sort: { createdAt: -1 },
  //         }
  //       );

  //       // To set two dates to two variables
  //       let today = new Date();
  //       let msgDate = userLastMsg ? new Date(userLastMsg.createdAt) : today;
  //       let isUserExistInBlackList = await BlackList.findOne({
  //         // messageType: parentMessage.type,
  //         phoneNumber: from,
  //       });
  //       // To calculate the time difference of two dates
  //       let Difference_In_Time = today.getTime() - msgDate.getTime();

  //       // To calculate the no. of days between two dates
  //       let Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);

  //       console.log("##@@@@@@@@", {
  //         from: adminId._id,
  //         to: user._id,
  //         Difference_In_Days
  //       });
  //       if (!isUserExistInBlackList && Difference_In_Days >= 1 || Difference_In_Days == 0) {
  //         console.log(
  //           "<<<<<<<<<<<<<<<<<<< wellcome >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
  //         );
  //         const wellcomeMsg = await Setting.findOne({
  //           key: "wellcome_message",
  //         });
  //         console.log({
  //           wellcomeMsg,
  //         });
  //         const wellcomeData = {
  //           from: adminId,
  //           to: user,
  //           phone_number: from,
  //           content: wellcomeMsg ? wellcomeMsg.value : "Wellcome To our application",
  //           type: "text",
  //         };

  //         messageController.sendWellcomeMessage(wellcomeData);
  //       }
  //     }

  //     const dataToDashboard = {
  //       phone_number: from,
  //       content: msg,
  //       type,
  //       name: name ? name : from,
  //       user_name: name ? name : from,
  //       platform: "whatsapp",
  //       wa_msg_id,
  //       parentMsg,
  //     };

  //     messageController.sendMessage(dataToDashboard);
  //     // io.emit("newmsg", { msg, phone_number: from });
  //     //       for (let i = 0; i < 3; i++) {
  //     //         const element = data[i];
  //     //         let productName = data[i]["name"];
  //     //         let productPrice = data[i]["price"];
  //     //         const productThumbnail = data[i]["thumb"];

  //     //         let phone_number_id =
  //     //           req.body.entry[0].changes[0].value.metadata.phone_number_id;

  //     //         let msg_body = req.body.entry[0].changes[0].value.messages[0].text.body; // extract the message text from the webhook payload

  //     //         await axios({
  //     //           method: "POST", // Required, HTTP method, a string, e.g. POST, GET
  //     //           url:
  //     //             "https://graph.facebook.com/v12.0/" +
  //     //             phone_number_id +
  //     //             "/messages?access_token=" +
  //     //             token,
  //     //           data: {
  //     //             messaging_product: "whatsapp",
  //     //             to: from,
  //     //             //   text: { body: "Ack: " + msg_body  },
  //     //             //             text: {
  //     //             //               body: `القي نظرة على منتجنا:
  //     //             // *${products}* بسعر: ${productPrice} ريال,
  //     //             //   . لمزيد من المنتجات قم بزيارة الرابط التالي👇
  //     //             // https://www.facebook.com/MuscatApps`,
  //     //             //             },
  //     //             // type: "template",
  //     //             // template: {
  //     //             //   name: "hello_world",
  //     //             //   language: {
  //     //             //     code: "en_US",
  //     //             //   },
  //     //             // },
  //     //             type: "template",
  //     //             template: {
  //     //               name: "sample_test",
  //     //               language: {
  //     //                 code: "ar",
  //     //               },
  //     //               components: [
  //     //                 {
  //     //                   type: "header",
  //     //                   parameters: [
  //     //                     {
  //     //                       type: "image",
  //     //                       image: {
  //     //                         link: productThumbnail,
  //     //                       },
  //     //                     },
  //     //                   ],
  //     //                 },
  //     //                 {
  //     //                   type: "body",
  //     //                   parameters: [
  //     //                     {
  //     //                       type: "text",
  //     //                       text: from,
  //     //                     },
  //     //                     {
  //     //                       type: "text",
  //     //                       text: productName,
  //     //                     },
  //     //                     {
  //     //                       type: "text",
  //     //                       text: productPrice,
  //     //                     },
  //     //                     {
  //     //                       type: "text",
  //     //                       text: "ريال",
  //     //                     },
  //     //                   ],
  //     //                 },
  //     //               ],
  //     //             },
  //     //           },
  //     //           headers: { "Content-Type": "application/json" },
  //     //         });
  //     //       }
  //   }

  //   res.sendStatus(200);
  // }
  else if (req.body.object === "instagram") {
    const page_id = process.env.PAGE_ID;
    const token = process.env.INSTAGRAM_TOKEN;

    if (req.body.entry[0].changes) {
      if (req.body.entry[0].changes[0].field === "comments") {
        const comment_id = req.body.entry[0].changes[0].value.id;
        const commentText = req.body.entry[0].changes[0].value.text;
        const from = req.body.entry[0].changes[0].value.from.id;
        const username = req.body.entry[0].changes[0].value.from.username;

        // const url =
        //   "https://graph.facebook.com/" + from + "?access_token=" + token;
        // let instaUser;
        // try {
        //   instaUser = await axiosHelper.get(url);
        //   console.log({
        //     req: req.body,
        //     instaUser,
        //   });
        // } catch (err) {
        //   console.log({ err });
        // }

        if (from !== "17841408513191477") {
          const dataToDashboard = {
            phone_number: from,
            content: `Comment event message content: ${commentText}`,
            user_name: username,
            name: username,

            platform: "instagram",
          };
          messageController.sendMessage(dataToDashboard);
        }
        const message = "Thanks for reaching out, how can I help?";

        const newUrl = `https://graph.facebook.com/${page_id}/messages?access_token=${token}`;

        const data = {
          recipient: { comment_id: comment_id },
          message: { text: message },
        };
        console.log({
          data,
          commentText,
        });
        try {
          const instaRes = await axiosHelper.post(newUrl, data);
          console.log({
            instaRes,
          });
        } catch (err) {
          console.log({ err });
        }
      }
    } else {
      if (req.body.entry[0].messaging[0].message) {
        const from = req.body.entry[0].messaging[0].sender.id;
        const content = req.body.entry[0].messaging[0].message.text;

        const url =
          "https://graph.facebook.com/" + from + "?access_token=" + token;

        const instaUser = await axiosHelper.get(url);

        console.log({
          req: req.body,
          instaUser,
        });

        if (instaUser.data.id !== "17841408513191477") {
          const dataToDashboard = {
            phone_number: from,
            content,
            user_name: instaUser.data.userName,
            name: instaUser.data.name,

            platform: "instagram",
          };
          messageController.sendMessage(dataToDashboard);
        }
      }
    }
  } else {
    // Return a '404 Not Found' if event is not from a WhatsApp API
    res.sendStatus(404);
  }
};

exports.getHandler = async (req, res) => {
  console.log("getHandler");
  /**
   * UPDATE YOUR VERIFY TOKEN
   *This will be the Verify Token value when you set up webhook
   **/
  const verify_token = process.env.VERIFY_TOKEN;

  // Parse params from the webhook verification request
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  console.log({
    verify_token,
    mode,
    token,
    challenge,
  });
  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === "subscribe" && token === verify_token) {
      // Respond with 200 OK and challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
};

exports.patchHandler = async (req, res) => {
  console.log("patchHandler =>> ", {
    req,
  });
};
