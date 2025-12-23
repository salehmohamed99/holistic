const axiosHelper = require("../helpers/axiosHelper");
const axios = require('axios');
const OrderID = require("../models/OrderIDModel");
sendToWhatsapp = require("./sendToWhatsapp");
// const {
//   WHATSAPP_PHONE_NUMBER_ID,
//   WHATSAPP_TOKEN,
// } = require("./messageController");
const WHATSAPP_PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

exports.sendToWhatsapp = async (inputData) => {
  console.log(
    {
      inputData,
    },
    "Icoooooming Dataaa"
  );

  const url =
    "https://graph.facebook.com/v12.0/" +
    WHATSAPP_PHONE_NUMBER_ID +
    "/messages?access_token=" +
    WHATSAPP_TOKEN;

  let data = {};

  data.messaging_product = "whatsapp";

  if (inputData.msgType === "media") {
    data.to = inputData.to;
    data.type = inputData.type;
    data[inputData.type] = {
      id: inputData.mediaId,
      filename: inputData.filename,
    };

    const wa_res = await axiosHelper.post(url, data);
  } else if (inputData.type === "text") {
    data.to = inputData.to.toString();
    data.recipient_type = "individual";

    data.type = "text";

    data.text = {
      preview_url: false,
      body: inputData.content,
    };

    if (inputData.parentMsg) {
      data.context = {
        message_id: inputData.parentMsg,
      };
    }
    console.log({ data }, "teeeeeeeeeeeeeeest");
    const wa_res = await axiosHelper.post(url, data);
  } else if (inputData.type === "pdf") {
    data.to = inputData.to.toString();
    data.recipient_type = "individual";

    data.type = "document";

    data.document = {
      link: inputData.link,
      caption: inputData.content,
      filename: inputData.filename,
    };

    if (inputData.parentMsg) {
      data.context = {
        message_id: inputData.parentMsg,
      };
    }
    console.log({ data }, "teeeeeeeeeeeeeeest");
    const wa_res = await axiosHelper.post(url, data);
  } else if (inputData.type === "shop_details_template") {
    let components = [];
    data.type = "template";
    data.to = inputData.to;
    components = [
      {
        type: "header",
        parameters: [
          {
            type: "location",
            location: {
              longitude: 57.28812046256725,
              latitude: 22.95623698303524,
              name: "Shop Location",
              address: "مطاحن وتمور الشرع ",
            },
          },
        ],
      }
    ];

    data.template = {
      name: "flow_store_locations2",
      language: {
        code: "ar",
      },
      components,
    };

    console.log({
      data,
    });
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }
    // });
    // });
  }

  // usage

  else if (inputData.type === "otp") {
    let components = [];
    data.type = "template";
    data.recipient_type = "individual";
    data.to = inputData.to;

    data.template = {
      name: "flow_otp",
      language: {
        code: "ar",
      },
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: inputData.otp,
            },
          ],
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [
            {
              "type": "text",
              "text": inputData.otp
            }

          ],
        },
      ],
    };

    console.log({
      data,
    });
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }

    // });
  } else if (inputData.type === "sign_in_flow") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });
    let phone = inputData.phone_number;
    let country_code;
    let new_phone_without_code;


    if (phone) {
      if (phone.startsWith("20")) {
        country_code = "20";
        new_phone_without_code = phone.slice(2);
      } else {
        country_code = "968";
        new_phone_without_code = phone.slice(3);
      }
    }
    data.type = "interactive";
    data.recipient_type = "individual";
    data.to = inputData.to;

    if (shara.language === 'ar') {
      data.interactive = {
        type: "flow",
        body: {
          text: "إضغط لتسجيل الدخول",
        },
        action: {
          name: "flow",
          parameters: {
            // mode: "draft",
            mode: "published",
            flow_message_version: "3",
            flow_token: shara.name === '' ? "1743409142729679" : "1966101247184957",
            flow_id: shara.name === '' ? "1743409142729679" : "1966101247184957",
            flow_cta: "تسجيل الدخول",
            flow_action: "navigate",
            flow_action_payload: {
              screen: "SIGN_IN",
              data: {
                default_code: country_code,
                default_phone: new_phone_without_code,
              },
            },
          },
        },
      };
    }
    else {
      data.interactive = {
        type: "flow",
        body: {
          text: "Sign In",
        },
        action: {
          name: "flow",
          parameters: {
            // mode: "draft",
            mode: "published",
            flow_message_version: "3",
            flow_token: shara.name === '' ? "854659986604079" : "3754004011582057",
            flow_id: shara.name === '' ? "854659986604079" : "3754004011582057",
            flow_cta: "Sign In",
            flow_action: "navigate",
            flow_action_payload: {
              screen: "SIGN_IN",
              data: {
                default_code: country_code,
                default_phone: new_phone_without_code,
              },
            },
          },
        },
      };
    }



    console.log({ data }, "teeeeeeeeeeeeeeest");
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }
  } else if (inputData.type === "after_sign_in_flow") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });


    let data = JSON.stringify({
      "code": "+" + inputData.country_code,
      "phone_number": inputData.phone,
      "name": shara.name,
    });

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://alsharashoping.com/api/otp-signin',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: data
    };
    console.log("data", data);

    axios.request(config)
      .then(async (response) => {
        if (response.status === 200) {
          console.log("Response status: 200 OK");
          console.log(JSON.stringify(response.data));
          // const wellcomeData3 = {
          //   from: "00",
          //   to: inputData.to,
          //   phone_number: inputData.to,
          //   type: "otp_flow",
          // };

          // await sendToWhatsapp.sendToWhatsapp(wellcomeData3);
        } else {
          console.log(`Unexpected response status: ${response.status}`);
        }
      })
      .catch((error) => {
        console.log(error);
      });

    console.log({ data }, "teeeeeeeeeeeeeeest");
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }
  } else if (inputData.type === "confirm_otp") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });


    let data = JSON.stringify({
      "code": "+" + inputData.country_code,
      "phone_number": inputData.phone,
      "otp": inputData.otp,
      "name": shara.name,
    });

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://alsharashoping.com/api/otp-verify',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: data
    };
    console.log("data", data);

    axios.request(config)
      .then(async (response) => {
        if (response.status === 200) {
          console.log("Response status: 200 OK");
          console.log(JSON.stringify(response.data));

          shara.token = response.data.token;
          shara.to_verified = false;
          shara.country_code = "";
          shara.phone = "";
          await shara.save();

          if (shara.language === 'ar') {
            const wellcomeData3 = {
              from: "00",
              to: inputData.to,
              phone_number: inputData.to,
              content: "تم تسجيل الدخول بنجاح",
              type: "text",
            };

            await sendToWhatsapp.sendToWhatsapp(wellcomeData3);
          }
          else {
            const wellcomeData3 = {
              from: "00",
              to: inputData.to,
              phone_number: inputData.to,
              content: "You have successfully logged in",
              type: "text",
            };

            await sendToWhatsapp.sendToWhatsapp(wellcomeData3);
          }

          if (shara.card.length > 0) {
            const wellcomeData2 = {
              from: "00",
              to: inputData.phone_number,
              phone_number: inputData.phone_number,
              type: "show_card",
            };
            await sendToWhatsapp.sendToWhatsapp(wellcomeData2);
          } else {
            const wellcomeData2 = {
              from: "00",
              to: inputData.phone_number,
              phone_number: inputData.phone_number,
              type: "show_categories",
            };
            await sendToWhatsapp.sendToWhatsapp(wellcomeData2);

          }

        } else {
          console.log(`Unexpected response status: ${response.status}`);
        }
      })
      .catch((error) => {
        console.log(error);
      });

    console.log({ data }, "teeeeeeeeeeeeeeest");
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }
  } else if (inputData.type === "select_language") {

    data.type = "interactive";
    data.recipient_type = "individual";
    data.to = inputData.to;
    data.interactive = {
      type: "button",
      header: {
        type: "image",
        image: {
          link: "https://cdn.glitch.global/e74a8780-9870-4414-a0db-bbe188920678/alshare%20Logo.jpg?v=1721478975899",
        },
      },
      body: {
        text: "قم بإختيار اللغة \n Choose the language",
      },
      action: {
        buttons: [
          {
            type: "reply",
            reply: {
              id: "1",
              title: "العربيه",
            },
          },
          {
            type: "reply",
            reply: {
              id: "2",
              title: "English",
            },
          },
        ],
      },
    };


    console.log({ data }, "teeeeeeeeeeeeeeest");
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }
    // });
    // });
  } else if (inputData.type === "start_service") {
    let pizza = await OrderID.findOne({ from: inputData.phone_number });

    data.type = "interactive";
    data.recipient_type = "individual";
    data.to = inputData.to;
    if (pizza.language === 'ar') {
      data.interactive = {
        type: "button",
        body: {
          text: "قم بإختيار الخدمة التى تريدها",
        },
        action: {
          buttons: [
            // {
            //   type: "reply",
            //   reply: {
            //     id: "1",
            //     title: "تسوق عبر الواتساب",
            //   },
            // },
            {
              type: "reply",
              reply: {
                id: "1",
                title: "تصفح الكتالوج",
              },
            },
            {
              type: "reply",
              reply: {
                id: "2",
                title: "التسوق الإلكتروني",
              },
            },
            {
              type: "reply",
              reply: {
                id: "3",
                title: "المزيد عن الشرع",
              },
            },
          ],
        },
      };
    }
    else {
      data.interactive = {
        type: "button",
        body: {
          text: "Choose the service you want",
        },
        action: {
          buttons: [
            // {
            //   type: "reply",
            //   reply: {
            //     id: "1",
            //     title: "WhatsApp Shopping",
            //   },
            // },
            {
              type: "reply",
              reply: {
                id: "1",
                title: "Browse Catalog",
              },
            },
            {
              type: "reply",
              reply: {
                id: "2",
                title: "Online shopping",
              },
            },
            {
              type: "reply",
              reply: {
                id: "3",
                title: "More about Shara",
              },
            },
          ],
        },
      };
    }


    console.log({ data }, "teeeeeeeeeeeeeeest");
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }
    // });
    // });
  } else if (inputData.type === "more_about_shara") {
    let pizza = await OrderID.findOne({ from: inputData.phone_number });

    data.type = "interactive";
    data.recipient_type = "individual";
    data.to = inputData.to;
    if (pizza.language === 'ar') {
      data.interactive = {
        type: "button",
        body: {
          text: "قم بإختيار الخدمة التى تريدها",
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: {
                id: "1",
                title: "الاسئلة الشائعة",
              },
            },
            {
              type: "reply",
              reply: {
                id: "2",
                title: "مواقع متاجرنا",
              },
            },
            {
              type: "reply",
              reply: {
                id: "3",
                title: "خدمة العملاء",
              },
            },
          ],
        },
      };
    }
    else {
      data.interactive = {
        type: "button",
        body: {
          text: "Choose the service you want",
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: {
                id: "1",
                title: "Common Questions",
              },
            },
            {
              type: "reply",
              reply: {
                id: "2",
                title: "Store Locations",
              },
            },
            {
              type: "reply",
              reply: {
                id: "3",
                title: "customer service",
              },
            },
          ],
        },
      };
    }


    console.log({ data }, "teeeeeeeeeeeeeeest");
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }
    // });
    // });
  } else if (inputData.type === "show_category_meals") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });

    let branch_meals = [];
    let product_items = [];
    let category_name;


    let config2 = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://alsharashoping.com/api/products?sub_category=${inputData.subcategory_id}&per_page=999`,
      headers: {}
    };

    await axios.request(config2)
      .then((response) => {
        //console.log(JSON.stringify(response.data.data.message.data));
        branch_meals = response.data.data;

      })
      .catch((error) => {
        console.log(error);
      });

    for (let i = 0; i < branch_meals.length; i++) {
      const meal = branch_meals[i];
      if (shara.language === 'ar') {
        const newRow = {
          "product_retailer_id": `${meal.id}`,
        };
        product_items.push(newRow);
      }
      else {
        const newRow = {
          "product_retailer_id": `${meal.id}000`,
        };
        product_items.push(newRow);
      }
    }


    for (let i = 0; i < branch_meals.length; i++) {
      const meal = branch_meals[i];
      if (meal.category.id == parseInt(shara.category_id)) {
        if (shara.language === 'ar') {
          category_name = meal.category.fr_Category_Name;
        } else {
          category_name = meal.category.en_Category_Name;
        }

        if (category_name.length >= 24) {
          // Find the last space within the first 24 characters
          let lastSpaceIndex = category_name.lastIndexOf(' ', 24);

          if (lastSpaceIndex !== -1) {
            // Keep the string up to the last space
            category_name = category_name.substring(0, lastSpaceIndex);
          }
        }
        break;
      }

    }
    // sections["title"] = category_name;
    // sections["product_items"] = product_items;



    console.log("category_name", category_name);




    if (product_items.length == 0) {
      if (shara.language === 'ar') {
        const wellcomeData = {
          from: "00",
          to: inputData.phone_number,
          phone_number: inputData.phone_number,
          content: "عفوا هذه الفئة لا تحتوى على منتجات",
          type: "text",
        };
        await sendToWhatsapp.sendToWhatsapp(wellcomeData);
      }
      else {
        const wellcomeData = {
          from: "00",
          to: inputData.phone_number,
          phone_number: inputData.phone_number,
          content: "Sorry, this category does not contain products",
          type: "text",
        };
        await sendToWhatsapp.sendToWhatsapp(wellcomeData);
      }

      const wellcomeData2 = {
        from: "00",
        to: inputData.phone_number,
        phone_number: inputData.phone_number,
        category_id: shara.category_id,
        type: "subcategories",
      };
      await sendToWhatsapp.sendToWhatsapp(wellcomeData2);
    } else {
      let breaks = 0;
      let section = [];
      let sections = [];

      for (let i = 0; i < product_items.length; i++) {
        const element = product_items[i];

        if ([
          "5362", "5451", "5461", "5462", "5492000", "5496000"
        ].includes(element.product_retailer_id)) {
          breaks++;
          console.log("count of breaks", breaks);
          console.log("count of breaks", element);
          continue;
        }


        // [
        //   "5472", "5461", "5462", "5451", "5362", "5427000", "5428000",
        //   "5433000", "5445000", "5453000", "5492000", "5496000", "5472000"
        // ]
        section.push(element);

        if (section.length === 30) {
          sections.push(section);
          section = [];
        }
      }

      if (section.length > 0) {
        sections.push(section);
      }

      console.log("count of breaks", breaks);
      console.log(sections.length);
      console.log(JSON.stringify(sections));

      shara.status = "choose_items";
      await shara.save();

      for (let i = 0; i < sections.length; i++) {
        const element = sections[i];
        const newRow = {
          "title": `${category_name}`,
          "product_items": element,
        };

        console.log("newRow", newRow);

        const wellcomeData2 = {
          from: "00",
          to: inputData.phone_number,
          phone_number: inputData.phone_number,
          sections: [newRow],
          type: "call_mpm",
        };
        await sendToWhatsapp.sendToWhatsapp(wellcomeData2);
      }
    }





    console.log({ data }, "teeeeeeeeeeeeeeest");
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }
    // });
    // });
  } else if (inputData.type === "call_mpm") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });

    data.type = "template";
    data.recipient_type = "individual";
    data.to = inputData.to;
    if (shara.language === 'ar') {
      data.template = {
        name: "flow_products",
        language: {
          code: "ar",
        },
        components: [
          {
            "type": "button",
            "sub_type": "mpm",
            "index": 0,
            "parameters": [
              {
                "type": "action",
                "action": {
                  "thumbnail_product_retailer_id": "",
                  "sections": inputData.sections
                }
              }
            ]
          }
        ],
      };
    }
    else {
      data.template = {
        name: "flow_products",
        language: {
          code: "en",
        },
        components: [
          {
            "type": "button",
            "sub_type": "mpm",
            "index": 0,
            "parameters": [
              {
                "type": "action",
                "action": {
                  "thumbnail_product_retailer_id": "",
                  "sections": inputData.sections
                }
              }
            ]
          }
        ],
      };
    }








    console.log({ data }, "teeeeeeeeeeeeeeest");
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }
    // });
    // });
  } else if (inputData.type === "save_cataloge_items") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });
    let branch_meals;
    let added = 0;
    let quantity = 0;


    let config2 = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://alsharashoping.com/api/products?category=${shara.category_id}&per_page=999`,
      headers: {}
    };

    await axios.request(config2)
      .then((response) => {
        //console.log(JSON.stringify(response.data.data.message.data));
        branch_meals = response.data.data;

      })
      .catch((error) => {
        console.log(error);
      });

    for (let i = 0; i < inputData.product_items.length; i++) {
      const item = inputData.product_items[i];
      for (let m = 0; m < branch_meals.length; m++) {
        const meal = branch_meals[m];
        let item_id;

        if (shara.language === 'en') {
          item_id = item.product_retailer_id.slice(0, -3);
        } else {
          item_id = item.product_retailer_id;
        }

        if (parseInt(item_id) === meal.id) {
          const existingItem = shara.card.find(cardItem => cardItem.meal_id === meal.id.toString());

          if (existingItem) {
            console.log("Item exists in card");
            console.log(existingItem);

            existingItem.quantity += parseInt(item.quantity);
            shara.markModified('card');
          } else {
            console.log("Item does not exist in card");
            console.log(item.quantity);
            let cardItem;
            if (shara.language === 'ar') {
              cardItem = {
                id: shara.items_counter + 1,
                meal_id: `${meal.id}`,
                quantity: parseInt(item.quantity),
                meal_name: `${meal.fr_Product_Name}`,
                meal_price: `${meal.Discount_Price}`
              };
            } else {
              cardItem = {
                id: shara.items_counter + 1,
                meal_id: `${meal.id}`,
                quantity: parseInt(item.quantity),
                meal_name: `${meal.en_Product_Name}`,
                meal_price: `${meal.Discount_Price}`
              };
            }

            // if (meal.additions.length > 0) {
            //   cardItem.price_of_additions = "";
            //   cardItem.additions = [];
            // }

            console.log(cardItem);
            shara.card.push(cardItem);
            shara.items_counter++;
            shara.items_length++;

          }

        }
      }
    }

    try {
      await shara.save();
      console.log("shara order saved successfully.");
    } catch (error) {
      console.error("Error saving shara order:", error);
    }
    console.log("2222222222222222222222");

    const wellcomeData = {
      from: "00",
      to: inputData.phone_number,
      phone_number: inputData.phone_number,
      // text: "تم إضافة المنتجات بنجاج \n هل تريد الإستمرار أو إضافة إضافات للمنتج",
      type: "show_card",
    };
    await sendToWhatsapp.sendToWhatsapp(wellcomeData);





  } else if (inputData.type === "show_card") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });

    if (!shara.token) {
      const wellcomeData = {
        from: "00",
        to: inputData.phone_number,
        phone_number: inputData.phone_number,
        type: "sign_in_flow",
      };
      await sendToWhatsapp.sendToWhatsapp(wellcomeData);

    } else {
      let card_items = [];
      for (let i = 0; i < shara.card.length; i++) {
        card_items.push(shara.card[i]);
      }

      let text = "";
      if (shara.language === 'ar') {
        text += "السلة 🛒    \n";
      }
      else {
        text += "Card 🛒 \n";
      }

      let item_price = 0;
      let total_price = 0;
      let total_weight = 0;

      for (const item of card_items) {
        if (shara.language === 'ar') {
          text += `\nإسم المنتج : ${item.meal_name} \n السعر ${item.meal_price} ر.ع \n الكمية ${item.quantity} \n`;
        }
        else {
          text += `\nProduct name: ${item.meal_name} \n Price ${item.meal_price} OMR \n Quantity ${item.quantity} \n`;
        }

        item_price = (parseFloat(item.meal_price) * parseInt(item.quantity)) || 0;
        total_price += parseFloat(item_price);


        if (item.weight) {
          if (shara.language === 'ar') {
            text += `الوزن : ${parseFloat(item.weight[0].weight).toFixed(3)} جرام \n`;
            // text += `السعر : ${parseFloat(item.weight[0].price).toFixed(3)} ر.ع \n`;
          }
          else {
            text += `Weight: ${parseFloat(item.weight[0].weight).toFixed(3)} grams \n`;
            // text += `Price: ${parseFloat(item.weight[0].price).toFixed(3)} OMR \n`;
          }
        }

        if (item.size) {
          if (shara.language === 'ar') {
            text += `الإختيار : ${item.size[0].Size_ar} \n`;
            text += `الوزن : ${parseFloat(item.size[0].weight).toFixed(3)} جرام \n`;
            // text += `السعر : ${parseFloat(item.size[0].price).toFixed(3)} ر.ع \n`;
          }
          else {
            text += `Choise : ${item.size[0].Size} \n`;
            text += `Weight: ${parseFloat(item.size[0].weight).toFixed(3)} grams \n`;
            // text += `Price: ${parseFloat(item.size[0].price).toFixed(3)} OMR \n`;
          }
        }

        if (item.additions) {
          if (item.additions.length > 0) {
            for (let i = 0; i < item.additions.length; i++) {
              const element = item.additions[i];
              if (shara.language === 'ar') {
                text += `إضافة ${element.addition_name} : ${element.addition_price} ر.ع \n`
              }
              else {
                text += `Addition ${element.addition_name} : ${element.addition_price} OMR \n`
              }
            }
            if (shara.language === 'ar') {
              text += `سعر الإضافات : ${parseFloat(item.additions_price).toFixed(3)} ر.ع \n`
            }
            else {
              text += `Additions price: ${parseFloat(item.additions_price).toFixed(3)} OMR \n`
            }
          }
        }

        total_weight += parseFloat(item.meal_weight) * parseInt(item.quantity);

        if (shara.language === 'ar') {
          text += `سعر المنتج النهائى : ${item_price.toFixed(3) || 0} ر.ع \n`;
        }
        else {
          text += `Final product price: ${item_price.toFixed(3) || 0} OMR \n`;
        }
      }


      if (shara.language === 'ar') {
        text += `\nالسعر الإجمالى : ${total_price.toFixed(3)} ر.ع \n`;
      }
      else {
        text += `\nTotal price: ${total_price.toFixed(3)} OMR \n`;
      }

      shara.total_price = total_price.toFixed(3);
      shara.total_weight = parseFloat(total_weight).toFixed(3);

      shara.is_offer = false;
      shara.is_delete = false;
      shara.same_card = 0;

      await shara.save();
      console.log("text lenght", text.length);

      const wellcomeData2 = {
        from: "00",
        to: inputData.phone_number,
        phone_number: inputData.phone_number,
        content: text,
        type: "text",
      };
      await sendToWhatsapp.sendToWhatsapp(wellcomeData2);

      if (shara.card.length == 0) {
        const wellcomeData = {
          from: "00",
          to: inputData.phone_number,
          phone_number: inputData.phone_number,
          type: "show_categories",
        };
        await sendToWhatsapp.sendToWhatsapp(wellcomeData);

      } else {
        data.type = "interactive";
        data.recipient_type = "individual";
        data.to = inputData.to;
        if (inputData.parentMsg) {
          data.context = {
            message_id: inputData.parentMsg,
          };
        }
        if (shara.language === 'ar') {
          data.interactive = {
            type: "button",
            body: {
              text: "إختار الخطوة التالية",
            },
            action: {
              buttons: [
                {
                  type: "reply",
                  reply: {
                    id: "2",
                    title: "إستمرار",
                  },
                }, {
                  type: "reply",
                  reply: {
                    id: "1",
                    title: "حذف / إضافات",
                  },
                }, {
                  type: "reply",
                  reply: {
                    id: "3",
                    title: "إضافة منتجات أخري",
                  },
                },
              ],
            },
          };
        }
        else {
          data.interactive = {
            type: "button",
            body: {
              text: "Choose the next step",
            },
            action: {
              buttons: [
                {
                  type: "reply",
                  reply: {
                    id: "2",
                    title: "continuation",
                  },
                }, {
                  type: "reply",
                  reply: {
                    id: "1",
                    title: "Delete / Additions",
                  },
                }, {
                  type: "reply",
                  reply: {
                    id: "3",
                    title: "Add other products",
                  },
                },
              ],
            },
          };
        }
      }

      console.log({ data }, "teeeeeeeeeeeeeeest");
      try {
        const wa_res = await axiosHelper.post(url, data);
        console.log("000000", {
          wa_res: wa_res.data.messages[0],
        });
      } catch (err) {
        console.log({ err });
      }
    }


  } else if (inputData.type === "address_option") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });

    shara.status = "address";
    await shara.save();

    data.type = "interactive";
    data.recipient_type = "individual";
    data.to = inputData.to;
    if (shara.language === 'ar') {
      data.interactive = {
        type: "button",
        body: {
          text: "عنوايين التوصيل",
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: {
                id: "1",
                title: "إضافة عنوان",
              },
            },
            {
              type: "reply",
              reply: {
                id: "2",
                title: "إختيار عنوان",
              },
            }, {
              type: "reply",
              reply: {
                id: "3",
                title: "حذف عنوان",
              },
            },
          ],
        },
      };
    }
    else {
      data.interactive = {
        type: "button",
        body: {
          text: "Delivery addresses",
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: {
                id: "1",
                title: "Add address",
              },
            },
            {
              type: "reply",
              reply: {
                id: "2",
                title: "Choose address",
              },
            }, {
              type: "reply",
              reply: {
                id: "3",
                title: "Delete address",
              },
            },
          ],
        },
      };
    }


    console.log({ data }, "teeeeeeeeeeeeeeest");
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }
    // });
    // });
  } else if (inputData.type === "add_address") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });
    let countries = [];
    let apiData = [];

    shara.status = "add_address";
    await shara.save();

    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://alsharashoping.com/api/countries/1/states',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    await axios.request(config)
      .then((response) => {
        console.log(JSON.stringify(response.data));
        apiData = response.data.data;
      })
      .catch((error) => {
        console.log(error);
      });

    console.log(apiData);
    for (let i = 0; i < apiData.length; i++) {
      const country = apiData[i];
      if (shara.language === 'ar') {
        const newRow = {
          id: `${country.id}`,
          title: country.name_ar,

        };
        countries.push(newRow);
      }
      else {
        const newRow = {
          id: `${country.id}`,
          title: country.name_en,

        };
        countries.push(newRow);
      }

    }
    console.log(countries);

    data.type = "interactive";
    data.recipient_type = "individual";
    data.to = inputData.to;
    if (shara.language === 'ar') {
      data.interactive = {
        type: "flow",
        body: {
          text: "قم بإدخال بيانات العنوان",
        },
        action: {
          name: "flow",
          parameters: {
            // mode: "draft",
            mode: "published",
            flow_message_version: "3",
            flow_token: "1066240944918344",
            flow_id: "1066240944918344",
            flow_cta: "إضافة عنوان",
            flow_action: "navigate",
            flow_action_payload: {
              screen: "add_address",
              data: {
                countries: countries,
              },
            },
          },
        },
      };
    }
    else {
      data.interactive = {
        type: "flow",
        body: {
          text: "Enter address information",
        },
        action: {
          name: "flow",
          parameters: {
            // mode: "draft",
            mode: "published",
            flow_message_version: "3",
            flow_token: "1154420158993406",
            flow_id: "1154420158993406",
            flow_cta: "Add address",
            flow_action: "navigate",
            flow_action_payload: {
              screen: "add_address",
              data: {
                countries: countries,
              },
            },
          },
        },
      };
    }


    console.log({ data }, "teeeeeeeeeeeeeeest");
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }
  } else if (inputData.type === "states") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });
    let states = [];
    let apiData = [];
    let countries = [];

    let config2 = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://alsharashoping.com/api/countries/1/states',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };


    await axios.request(config2)
      .then((response) => {
        console.log(JSON.stringify(response.data));
        countries = response.data.data;
      })
      .catch((error) => {
        console.log(error);
      });

    for (let i = 0; i < countries.length; i++) {
      const country = countries[i];
      if (parseInt(inputData.country) === country.id) {

        for (let index = 0; index < shara.addresses.length; index++) {
          const element = shara.addresses[index];
          if (element.id === inputData.address_id) {
            if (shara.language === 'ar') {
              element.country_name_ar = country.name_ar;
              element.country_name_en = country.name_en;
            }
            else {
              element.country_name_en = country.name_en;
            }
            await shara.save();
            break;
          }
        }


      }
    }


    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://alsharashoping.com/api/countries/1/states/${inputData.country}/cities`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    await axios.request(config)
      .then((response) => {
        apiData = response.data.data;
      })
      .catch((error) => {
        console.log(error);
      });

    for (let i = 0; i < apiData.length; i++) {
      const state = apiData[i];
      if (shara.language === 'ar') {
        const newRow = {
          id: `${state.id}`,
          title: state.name_ar,

        };
        states.push(newRow);
      }
      else {
        const newRow = {
          id: `${state.id}`,
          title: state.name_en,

        };
        states.push(newRow);
      }

    }

    data.type = "interactive";
    data.recipient_type = "individual";
    data.to = inputData.to;
    if (shara.language === 'ar') {
      data.interactive = {
        type: "flow",
        body: {
          text: "قم بإختيار الولاية",
        },
        action: {
          name: "flow",
          parameters: {
            // mode: "draft",
            mode: "published",
            flow_message_version: "3",
            flow_token: "1030692605325396",
            flow_id: "1030692605325396",
            flow_cta: "الولايات",
            flow_action: "navigate",
            flow_action_payload: {
              screen: "states",
              data: {
                states: states,
                address_id: inputData.address_id ? inputData.address_id : "55555",

              },
            },
          },
        },
      };
    }
    else {
      data.interactive = {
        type: "flow",
        body: {
          text: "Select the state",
        },
        action: {
          name: "flow",
          parameters: {
            // mode: "draft",
            mode: "published",
            flow_message_version: "3",
            flow_token: "1198325044769888",
            flow_id: "1198325044769888",
            flow_cta: "States",
            flow_action: "navigate",
            flow_action_payload: {
              screen: "states",
              data: {
                states: states,
                address_id: inputData.address_id ? inputData.address_id : "55555",

              },
            },
          },
        },
      };
    }


    console.log({ data }, "teeeeeeeeeeeeeeest");
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }
  } else if (inputData.type === "save_state") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });
    let apiData = [];


    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://alsharashoping.com/api/countries/1/states/${inputData.country}/cities`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    await axios.request(config)
      .then((response) => {
        apiData = response.data.data;
      })
      .catch((error) => {
        console.log(error);
      });

    for (let i = 0; i < apiData.length; i++) {
      const state = apiData[i];
      if (parseInt(inputData.state) === state.id) {
        for (let index = 0; index < shara.addresses.length; index++) {
          const element = shara.addresses[index];
          if (element.id === inputData.address_id) {
            if (shara.language === 'ar') {
              element.state_name = state.name_ar;
            }
            else {
              element.state_name = state.name_en;
            }
            await shara.save();
            break;
          }
        }

      }
    }

    const wellcomeData = {
      from: "00",
      to: inputData.phone_number,
      phone_number: inputData.phone_number,
      type: "address_option",
    };
    await sendToWhatsapp.sendToWhatsapp(wellcomeData);


    console.log({ data }, "teeeeeeeeeeeeeeest");
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }
  } else if (inputData.type === "choose_address") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });
    let addresses = [];

    for (let i = 0; i < shara.addresses.length; i++) {
      const address = shara.addresses[i];
      if (shara.language === 'ar') {
        const newRow = {
          id: address.id,
          title: address.name,
          description: `المحافظة : ${address.country_name_ar}  \n الولاية : ${address.state_name} \n ${address.street ? `شارع : ${address.street} \n` : ''}`
        };
        addresses.push(newRow);
      }
      else {
        const newRow = {
          id: address.id,
          title: address.name,
          description: `Governorate: ${address.country_name_en} \n State: ${address.state_name} \n ${address.street ? `Street: ${address.street} \n` : ''}`
        };
        addresses.push(newRow);
      }

    }

    data.type = "interactive";
    data.recipient_type = "individual";
    data.to = inputData.to;
    if (shara.language === 'ar') {
      data.interactive = {
        type: "flow",
        body: {
          text: shara.status === 'delete_address' ? "قم بإختيار العنوان المراد حذفة" : "قم بإختيار العنوان",

        },
        action: {
          name: "flow",
          parameters: {
            // mode: "draft",
            mode: "published",
            flow_message_version: "3",
            flow_token: "949185723888828",
            flow_id: "949185723888828",
            flow_cta: "العناويين",
            flow_action: "navigate",
            flow_action_payload: {
              screen: "choose_address",
              data: {
                addresses: addresses,
              },
            },
          },
        },
      };
    }
    else {
      data.interactive = {
        type: "flow",
        body: {
          text: shara.status === 'delete_address' ? "Select the address you want to delete" : "Choose a address",
        },
        action: {
          name: "flow",
          parameters: {
            // mode: "draft",
            mode: "published",
            flow_message_version: "3",
            flow_token: "819689473328032",
            flow_id: "819689473328032",
            flow_cta: "addresses",
            flow_action: "navigate",
            flow_action_payload: {
              screen: "choose_address",
              data: {
                addresses: addresses,
              },
            },
          },
        },
      };
    }


    console.log({ data }, "teeeeeeeeeeeeeeest");
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }
  } else if (inputData.type === "call_card") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });
    shara.status = "choose_items",
      await shara.save();

    data.type = "template";
    data.recipient_type = "individual";
    data.to = inputData.to;
    data.template = {
      name: shara.language === 'ar' ? "flow_show_categeries2" : "flow_show_categeries",
      language: {
        code: shara.language === 'ar' ? "ar" : "en_us",
      },
      components: [
        {
          "type": "CAROUSEL",
          "cards": [
            {
              "card_index": 0,
              "components": [
                {
                  "type": "HEADER",
                  "parameters": [
                    {
                      "type": "IMAGE",
                      "image": {
                        "id": "1219630035751491"
                      }
                    }
                  ]
                }
              ]
            },
            {
              "card_index": 1,
              "components": [
                {
                  "type": "HEADER",
                  "parameters": [
                    {
                      "type": "IMAGE",
                      "image": {
                        "id": "442344952154983"
                      }
                    }
                  ]
                }
              ]
            },
            {
              "card_index": 2,
              "components": [
                {
                  "type": "HEADER",
                  "parameters": [
                    {
                      "type": "IMAGE",
                      "image": {
                        "id": "917431373559068"
                      }
                    }
                  ]
                }
              ]
            },
            {
              "card_index": 3,
              "components": [
                {
                  "type": "HEADER",
                  "parameters": [
                    {
                      "type": "IMAGE",
                      "image": {
                        "id": "887927726206355"
                      }
                    }
                  ]
                }
              ]
            },
            {
              "card_index": 4,
              "components": [
                {
                  "type": "HEADER",
                  "parameters": [
                    {
                      "type": "IMAGE",
                      "image": {
                        "id": "506979071967318"
                      }
                    }
                  ]
                }
              ]
            },
            {
              "card_index": 5,
              "components": [
                {
                  "type": "HEADER",
                  "parameters": [
                    {
                      "type": "IMAGE",
                      "image": {
                        "id": "879532997452442"
                      }
                    }
                  ]
                }
              ]
            },
            {
              "card_index": 6,
              "components": [
                {
                  "type": "HEADER",
                  "parameters": [
                    {
                      "type": "IMAGE",
                      "image": {
                        "id": "1070153098035142"
                      }
                    }
                  ]
                }
              ]
            },
            {
              "card_index": 7,
              "components": [
                {
                  "type": "HEADER",
                  "parameters": [
                    {
                      "type": "IMAGE",
                      "image": {
                        "id": "885725092930822"
                      }
                    }
                  ]
                }
              ]
            },
            {
              "card_index": 8,
              "components": [
                {
                  "type": "HEADER",
                  "parameters": [
                    {
                      "type": "IMAGE",
                      "image": {
                        "id": "1234979481263318"
                      }
                    }
                  ]
                }
              ]
            },
            {
              "card_index": 9,
              "components": [
                {
                  "type": "HEADER",
                  "parameters": [
                    {
                      "type": "IMAGE",
                      "image": {
                        "id": "1490942071614788"
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };

    console.log({ data }, "teeeeeeeeeeeeeeest");
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }
    // });
    // });
  } else if (inputData.type === "show_items") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });

    let myItems = [];

    for (let i = 0; i < shara.card.length; i++) {
      const item = shara.card[i];
      const newRow = {
        id: `${item.id}`,
        title: item.meal_name,
      };
      myItems.push(newRow);
    }


    console.log(myItems);

    if (myItems.length == 0) {
      if (shara.language === 'ar') {
        const wellcomeData = {
          from: "00",
          to: inputData.phone_number,
          phone_number: inputData.phone_number,
          content: "عفوا لا يوجد لديك منتجات فى السلة",
          type: "text",
        };
        await sendToWhatsapp.sendToWhatsapp(wellcomeData);
      }
      else {
        const wellcomeData = {
          from: "00",
          to: inputData.phone_number,
          phone_number: inputData.phone_number,
          content: "Sorry, you have no products in your cart.",
          type: "text",
        };
        await sendToWhatsapp.sendToWhatsapp(wellcomeData);
      }

      const wellcomeData2 = {
        from: "00",
        to: inputData.phone_number,
        phone_number: inputData.phone_number,
        type: "show_card",
      };
      await sendToWhatsapp.sendToWhatsapp(wellcomeData2);
    } else {
      data.type = "interactive";
      data.recipient_type = "individual";
      data.to = inputData.to;
      if (shara.language === 'ar') {
        data.interactive = {
          type: "flow",
          body: {
            text: shara.status === 'delete_item' ? "قم بإختيار المنتج الذى تريد حذفة" : "قم بإختيار المنتج"
          },
          action: {
            name: "flow",
            parameters: {
              // mode: "draft",
              mode: "published",
              flow_message_version: "3",
              flow_token: "536074965512119",
              flow_id: "536074965512119",
              flow_cta: "إختيار",
              flow_action: "navigate",
              flow_action_payload: {
                screen: "choose_items",
                data: {
                  category: myItems,
                },
              },
            },
          },
        };
      }
      else {
        data.interactive = {
          type: "flow",
          body: {
            text: shara.status === 'delete_item' ? "Select the product you want to delete" : "Select the product"
          },
          action: {
            name: "flow",
            parameters: {
              // mode: "draft",
              mode: "published",
              flow_message_version: "3",
              flow_token: "1154777235632035",
              flow_id: "1154777235632035",
              flow_cta: "Choose",
              flow_action: "navigate",
              flow_action_payload: {
                screen: "choose_items",
                data: {
                  category: myItems,
                },
              },
            },
          },
        };
      }
    }

    console.log({ data }, "teeeeeeeeeeeeeeest");
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }
  } else if (inputData.type === "delete_meal") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });
    let deleted = false;

    for (let i = 0; i < shara.card.length; i++) {
      const item = shara.card[i];
      if (item.id === parseInt(inputData.choosen_item)) {
        shara.card.splice(shara.card.indexOf(item), 1);

        deleted = true;
        shara.items_length--;
        await shara.save();
        break;
      }
    }


    if (deleted == true) {
      if (shara.language === 'ar') {
        const wellcomeData2 = {
          from: "00",
          to: inputData.phone_number,
          phone_number: inputData.phone_number,
          content: "تم حذف المنتج بنجاح",
          type: "text",
        };
        await sendToWhatsapp.sendToWhatsapp(wellcomeData2);
      }
      else {
        const wellcomeData2 = {
          from: "00",
          to: inputData.phone_number,
          phone_number: inputData.phone_number,
          content: "The product has been successfully removed.",
          type: "text",
        };
        await sendToWhatsapp.sendToWhatsapp(wellcomeData2);
      }

      const wellcomeData = {
        from: "00",
        to: inputData.phone_number,
        phone_number: inputData.phone_number,
        type: "show_card",
      };
      await sendToWhatsapp.sendToWhatsapp(wellcomeData);
    }


    console.log({ data }, "teeeeeeeeeeeeeeest");
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }
  } else if (inputData.type === "test") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });

    for (let i = 0; i < inputData.product_items.length; i++) {
      const item = inputData.product_items[i];
      let item_id;
      if (shara.language === 'en' || (item.product_retailer_id.length === 7 && item.product_retailer_id.endsWith('000'))) {
        item_id = item.product_retailer_id.slice(0, -3);
      } else {
        item_id = item.product_retailer_id;
      }

      const wellcomeData = {
        from: "00",
        to: inputData.phone_number,
        phone_number: inputData.phone_number,
        item_id: item_id,
        quantity: item.quantity,
        product_items_length: inputData.product_items.length,
        type: "save_item",
      };
      await sendToWhatsapp.sendToWhatsapp(wellcomeData);

    }

    if ((shara.init_card_counter === 0) && (shara.card.length === shara.items_length)
      && (inputData.product_items_length === shara.same_card)) {
      console.log("0000000000000000000000000000");

      const wellcomeData = {
        from: "00",
        to: inputData.phone_number,
        phone_number: inputData.phone_number,
        type: "show_card",
      };
      await sendToWhatsapp.sendToWhatsapp(wellcomeData);
    }


  } else if (inputData.type === "save_item") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });
    let apiData;

    let config2 = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://alsharashoping.com/api/products/${inputData.item_id}`,
      headers: {}
    };

    await axios.request(config2)
      .then((response) => {
        apiData = response.data.data;

        apiData.weights = Array.isArray(apiData.weights) ? apiData.weights : [];
        apiData.sizes = Array.isArray(apiData.sizes) ? apiData.sizes : [];
        apiData.additions = Array.isArray(apiData.additions) ? apiData.additions : [];
        apiData.images = Array.isArray(apiData.images) ? apiData.images : [];

        apiData.category = apiData.category || {};
        apiData.price = apiData.price || 0;
      })
      .catch((error) => {
        console.log(error);
      });

    function createCardItem(weights, sizes = null) {
      let mealPrice = parseFloat(apiData.Price);
      let total_weight = 0;

      if (weights && weights.length === 1) {
        mealPrice = parseFloat(weights[0].price);
        total_weight = parseFloat(weights[0].weight);
      }

      if (parseInt(apiData.Discount) > 0) {
        let discountPercentage = parseInt(apiData.Discount) / 100;
        mealPrice = mealPrice - (mealPrice * parseFloat(discountPercentage));
      }

      if (sizes && sizes.length === 1) {
        mealPrice += parseFloat(sizes[0].price);
        total_weight += parseFloat(sizes[0].weight);
      }

      let cardItem = {
        id: shara.items_counter + 1,
        meal_id: `${apiData.id}`,
        quantity: parseInt(inputData.quantity),
        meal_name: shara.language === 'ar' ? `${apiData.fr_Product_Name}` : `${apiData.en_Product_Name}`,
        meal_price: parseFloat(mealPrice.toFixed(3)),
        meal_weight: parseFloat(total_weight),
      };

      if (weights !== null) cardItem.weight = weights;
      if (sizes !== null) cardItem.size = sizes;
      if (apiData.additions && apiData.additions.length > 0) {
        cardItem.additions_price = 0;
        cardItem.additions = [];
      }

      return cardItem;
    }

    function isSameItem(existingItem, weights, sizes) {
      const sameWeights = weights === null || JSON.stringify(existingItem.weight) === JSON.stringify(weights);
      const sameSizes = sizes === null || JSON.stringify(existingItem.size) === JSON.stringify(sizes);
      return sameWeights && sameSizes;
    }

    let isNewItem = false;

    if (apiData.weights.length > 1 && apiData.sizes.length === 1) {
      shara.init_card.push(createCardItem([], apiData.sizes));
      isNewItem = true;
    } else if (apiData.weights.length > 1 && apiData.sizes.length > 1) {
      shara.init_card.push(createCardItem([], []));
      isNewItem = true;
    } else if (apiData.weights.length > 1 && apiData.sizes.length === 0) {
      shara.init_card.push(createCardItem([], null));
      isNewItem = true;
    } else if (apiData.weights.length === 1 && apiData.sizes.length === 1) {
      let existingItem = shara.card.find(item =>
        item.meal_id === apiData.id.toString() &&
        isSameItem(item, apiData.weights, apiData.sizes)
      );

      if (existingItem) {
        existingItem.quantity += parseInt(inputData.quantity);
        shara.markModified('card');
      } else {
        let newCardItem = createCardItem(apiData.weights, apiData.sizes);
        shara.card.push(newCardItem);
        isNewItem = true;
      }
      shara.same_card++;
      // shara.card.push(createCardItem(apiData.weights, apiData.sizes));
    } else if (apiData.weights.length === 1 && apiData.sizes.length > 1) {
      shara.init_card.push(createCardItem(apiData.weights, []));
      isNewItem = true;
    } else if (apiData.weights.length === 1 && apiData.sizes.length === 0) {
      let existingItem = shara.card.find(item =>
        item.meal_id === apiData.id.toString() &&
        isSameItem(item, apiData.weights, null)
      );

      if (existingItem) {
        existingItem.quantity += parseInt(inputData.quantity);
        shara.markModified('card');
      } else {
        let newCardItem = createCardItem(apiData.weights, null);
        shara.card.push(newCardItem);
        isNewItem = true;
      }
      shara.same_card++;
      // shara.card.push(createCardItem(apiData.weights, null));
    } else if (apiData.weights.length === 0 && apiData.sizes.length === 1) {
      let existingItem = shara.card.find(item =>
        item.meal_id === apiData.id.toString() &&
        isSameItem(item, null, apiData.sizes)
      );

      if (existingItem) {
        existingItem.quantity += parseInt(inputData.quantity);
        shara.markModified('card');
      } else {
        let newCardItem = createCardItem(null, apiData.sizes);
        shara.card.push(newCardItem);
        isNewItem = true;
      }
      shara.same_card++;
      // shara.card.push(createCardItem(null, apiData.sizes));
    } else if (apiData.weights.length === 0 && apiData.sizes.length > 1) {
      shara.init_card.push(createCardItem(null, []));
    } else if (apiData.weights.length === 0 && apiData.sizes.length === 0) {
      let existingItem = shara.card.find(item =>
        item.meal_id === apiData.id.toString() &&
        isSameItem(item, null, null)
      );

      if (existingItem) {
        existingItem.quantity += parseInt(inputData.quantity);
        shara.markModified('card');
      } else {
        let newCardItem = createCardItem(null, null);
        shara.card.push(newCardItem);
        isNewItem = true;
      }

      shara.same_card++;
      // shara.card.push(createCardItem(null, null));
    }


    if (isNewItem) {
      shara.items_counter++;
      shara.items_length++;
    }

    try {
      await shara.save();
      console.log("shara order saved successfully.");
    } catch (error) {
      console.error("Error saving shara order:", error);
    }

    if (shara.init_card.length > shara.init_card_counter) {
      const item = shara.init_card[shara.init_card_counter];

      const wellcomeData = {
        from: "00",
        to: inputData.phone_number,
        phone_number: inputData.phone_number,
        product_label: item.meal_name,
        product_id: item.meal_id,
        type: "show_product_options",
      };
      await sendToWhatsapp.sendToWhatsapp(wellcomeData);
      shara.init_card_counter++;
      await shara.save();

    } else if ((shara.init_card_counter === 0) && (shara.card.length === shara.items_length)
      && (inputData.product_items_length === shara.same_card)) {
      console.log("0000000000000000000000000000");

      const wellcomeData = {
        from: "00",
        to: inputData.phone_number,
        phone_number: inputData.phone_number,
        type: "show_card",
      };
      await sendToWhatsapp.sendToWhatsapp(wellcomeData);
    }
  } else if (inputData.type === "show_product_options") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });
    let apiData = [];
    let weights = [];
    let sizes = [];

    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://alsharashoping.com/api/products/${inputData.product_id}`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    await axios.request(config)
      .then((response) => {
        apiData = response.data.data;
      })
      .catch((error) => {
        console.log(error);
      });



    if (apiData.sizes.length > 1) {
      for (let i = 0; i < apiData.sizes.length; i++) {
        const item = apiData.sizes[i];
        let newRow;

        if (shara.language === 'ar') {
          newRow = {
            id: `${item.Size_Id}`,
            title: item.Size_ar,
            description: `السعر : ${item.price}`
          };
        }
        else {
          newRow = {
            id: `${item.Size_Id}`,
            title: item.Size,
            description: `Price : ${item.price}`
          };
        }

        sizes.push(newRow);

      }

    }

    if (apiData.weights.length > 1) {
      for (let i = 0; i < apiData.weights.length; i++) {
        const item = apiData.weights[i];
        let newRow;

        if (shara.language === 'ar') {
          newRow = {
            id: `${item.id}`,
            title: `${item.weight} جرام`,
            description: `السعر : ${item.price} ر.ع`
          };
        }
        else {
          newRow = {
            id: `${item.id}`,
            title: `${item.weight} gram`,
            description: `Price : ${item.price} OMR`
          };
        }
        weights.push(newRow);

      }

    }



    if (sizes.length > 0 && weights.length == 0) {
      data.type = "interactive";
      data.recipient_type = "individual";
      data.to = inputData.to;
      if (shara.language === 'ar') {
        data.interactive = {
          type: "flow",
          body: {
            text: "قم بإختيار الإختيار المناسب",
          },
          action: {
            name: "flow",
            parameters: {
              // mode: "draft",
              mode: "published",
              flow_message_version: "3",
              flow_token: "539606255304015",
              flow_id: "539606255304015",
              flow_cta: "الإختيارات",
              flow_action: "navigate",
              flow_action_payload: {
                screen: "show_product_options",
                data: {
                  options: sizes,
                  product_label: inputData.product_label,
                  product_id: `${inputData.product_id}`,

                },
              },
            },
          },
        };
      }
      else {
        data.interactive = {
          type: "flow",
          body: {
            text: "Choose the right option",
          },
          action: {
            name: "flow",
            parameters: {
              // mode: "draft",
              mode: "published",
              flow_message_version: "3",
              flow_token: "1196425284911424",
              flow_id: "1196425284911424",
              flow_cta: "Options",
              flow_action: "navigate",
              flow_action_payload: {
                screen: "show_product_options",
                data: {
                  options: sizes,
                  product_label: inputData.product_label,
                  product_id: `${inputData.product_id}`,

                },
              },
            },
          },
        };
      }
    }

    if (sizes.length == 0 && weights.length > 1) {
      data.type = "interactive";
      data.recipient_type = "individual";
      data.to = inputData.to;
      if (shara.language === 'ar') {
        data.interactive = {
          type: "flow",
          body: {
            text: "قم بإختيار الوزن المناسب",
          },
          action: {
            name: "flow",
            parameters: {
              // mode: "draft",
              mode: "published",
              flow_message_version: "3",
              flow_token: "8927485103933655",
              flow_id: "8927485103933655",
              flow_cta: "الأوزان",
              flow_action: "navigate",
              flow_action_payload: {
                screen: "show_product_weights",
                data: {
                  weights: weights,
                  product_label: inputData.product_label,
                  product_id: `${inputData.product_id}`,
                },
              },
            },
          },
        };
      }
      else {
        data.interactive = {
          type: "flow",
          body: {
            text: "Choose the appropriate weight",
          },
          action: {
            name: "flow",
            parameters: {
              // mode: "draft",
              mode: "published",
              flow_message_version: "3",
              flow_token: "540320101762028",
              flow_id: "540320101762028",
              flow_cta: "Weights",
              flow_action: "navigate",
              flow_action_payload: {
                screen: "show_product_weights",
                data: {
                  weights: weights,
                  product_label: inputData.product_label,
                  product_id: `${inputData.product_id}`,
                },
              },
            },
          },
        };
      }
    }

    if (sizes.length > 1 && weights.length > 1) {
      data.type = "interactive";
      data.recipient_type = "individual";
      data.to = inputData.to;
      if (shara.language === 'ar') {
        data.interactive = {
          type: "flow",
          body: {
            text: "إختيارات المنتج",
          },
          action: {
            name: "flow",
            parameters: {
              // mode: "draft",
              mode: "published",
              flow_message_version: "3",
              flow_token: "1223778322396717",
              flow_id: "1223778322396717",
              flow_cta: "الإختيارات",
              flow_action: "navigate",
              flow_action_payload: {
                screen: "show_product_weights_options",
                data: {
                  weights: weights,
                  option: sizes,
                  product_label: inputData.product_label,
                  product_id: `${inputData.product_id}`,
                },
              },
            },
          },
        };
      }
      else {
        data.interactive = {
          type: "flow",
          body: {
            text: "Product Choices",
          },
          action: {
            name: "flow",
            parameters: {
              // mode: "draft",
              mode: "published",
              flow_message_version: "3",
              flow_token: "463597586508167",
              flow_id: "463597586508167",
              flow_cta: "Options",
              flow_action: "navigate",
              flow_action_payload: {
                screen: "show_product_weights_options",
                data: {
                  weights: weights,
                  option: sizes,
                  product_label: inputData.product_label,
                  product_id: `${inputData.product_id}`,
                },
              },
            },
          },
        };
      }
    }

    console.log({ data }, "teeeeeeeeeeeeeeest");
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }
  } else if (inputData.type === "save_option") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });

    // Fetch sizes data from API
    let apiData;
    try {
      const response = await axios.get(`https://alsharashoping.com/api/products/${inputData.product_id}`);
      apiData = response.data.data.sizes;
    } catch (error) {
      console.log(error);
      return;
    }

    // Find the selected size
    const selectedSize = apiData.find(size => size.Size_Id == parseInt(inputData.option_id));
    if (!selectedSize) return;

    // Find the corresponding item in the init_card
    const item = shara.init_card.find(cardItem => cardItem.meal_id === inputData.product_id);
    if (!item) return;

    // Update the meal price and add the selected size
    item.meal_price += parseFloat(selectedSize.price || 0);
    item.meal_weight += parseFloat(selectedSize.weight || 0);
    item.size.push(selectedSize);

    // Check if the item with the same size already exists in the card
    const existingItem = shara.card.find(cardItem => cardItem.meal_id === item.meal_id && cardItem.size[0].Size_Id == selectedSize.Size_Id);

    if (existingItem) {
      existingItem.quantity += parseInt(item.quantity);
      shara.markModified('card');
    } else {
      shara.card.push(item);
    }

    // Remove item from init_card and update counter
    shara.init_card = shara.init_card.filter(cardItem => cardItem !== item);
    shara.init_card_counter--;
    shara.same_card++;
    await shara.save();

    // Send appropriate response based on init_card_counter
    const wellcomeData = {
      from: "00",
      to: inputData.phone_number,
      phone_number: inputData.phone_number,
      type: shara.init_card_counter === 0 ? "show_card" : "text",
      content: shara.init_card_counter === 0 ? null : (
        shara.language === 'ar' ?
          "يرجى إنهاء كل الإختيارات لإستكمال الخطوة التالية" :
          "Please complete all selections to complete the next step."
      ),
    };
    await sendToWhatsapp.sendToWhatsapp(wellcomeData);
  } else if (inputData.type === "save_weight") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });

    // Fetch weights data from API
    let apiData;
    try {
      const response = await axios.get(`https://alsharashoping.com/api/products/${inputData.product_id}`);
      apiData = response.data.data.weights;
    } catch (error) {
      console.log(error);
      return;
    }

    // Find the selected weight
    const selectedWeight = apiData.find(weight => weight.id == parseInt(inputData.weight_id));
    if (!selectedWeight) return;

    // Find the corresponding item in the init_card
    const item = shara.init_card.find(cardItem => cardItem.meal_id === inputData.product_id);
    if (!item) return;

    // Update the meal price and add the selected weight
    item.meal_price = parseFloat(selectedWeight.price || 0);
    item.meal_weight = parseFloat(selectedWeight.weight || 0);
    item.weight.push(selectedWeight);

    // Check if the item with the same weight already exists in the card
    const existingItem = shara.card.find(cardItem => cardItem.meal_id === item.meal_id && cardItem.weight[0].id == selectedWeight.id);

    if (existingItem) {
      existingItem.quantity += parseInt(item.quantity);
      shara.markModified('card');
    } else {
      shara.card.push(item);
    }

    // Remove item from init_card and update counter
    shara.init_card = shara.init_card.filter(cardItem => cardItem !== item);
    shara.init_card_counter--;
    shara.same_card++;
    await shara.save();

    // Send appropriate response based on init_card_counter
    const wellcomeData = {
      from: "00",
      to: inputData.phone_number,
      phone_number: inputData.phone_number,
      type: shara.init_card_counter === 0 ? "show_card" : "text",
      content: shara.init_card_counter === 0 ? null : (
        shara.language === 'ar' ?
          "يرجى إنهاء كل الإختيارات لإستكمال الخطوة التالية" :
          "Please complete all selections to complete the next step."
      ),
    };
    await sendToWhatsapp.sendToWhatsapp(wellcomeData);
  } else if (inputData.type === "save_size_weight") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });
    let apiData;

    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://alsharashoping.com/api/products/${inputData.product_id}`,
      headers: {}
    };

    await axios.request(config)
      .then((response) => {
        apiData = response.data.data;
      })
      .catch((error) => {
        console.log(error);
      });

    let selectedSize = apiData.sizes.find(size => size.Size_Id == parseInt(inputData.size_id));
    let selectedWeight = apiData.weights.find(weight => weight.id == parseInt(inputData.weight_id));

    if (selectedSize && selectedWeight) {
      const item = shara.init_card.find(cardItem => cardItem.meal_id === inputData.product_id);

      // Update meal price with both size and weight prices
      if (parseFloat(selectedWeight.price) > 0) {
        item.meal_price = parseFloat(selectedWeight.price);
        item.meal_weight = parseFloat(selectedWeight.weight);
      }

      if (parseFloat(selectedSize.price) > 0) {
        item.meal_price += parseFloat(selectedSize.price);
        item.meal_weight += parseFloat(selectedSize.weight);
      }


      item.size.push(selectedSize);
      item.weight.push(selectedWeight);

      // Check if the item with the same size and weight already exists in the card
      const existingItem = shara.card.find(cardItem =>
        cardItem.meal_id === item.meal_id &&
        cardItem.size[0].Size_Id == selectedSize.Size_Id &&
        cardItem.weight[0].id == selectedWeight.id
      );

      if (existingItem) {
        console.log("Item exists in card");
        existingItem.quantity += parseInt(item.quantity);
        shara.markModified('card');
      } else {
        console.log("Item does not exist in card");
        shara.card.push(item);
      }

      shara.init_card.splice(shara.init_card.indexOf(item), 1);
      shara.init_card_counter--;
      shara.same_card++;
      await shara.save();
    }

    if (shara.init_card_counter == 0) {
      console.log("All items selected, showing card.");

      const wellcomeData = {
        from: "00",
        to: inputData.phone_number,
        phone_number: inputData.phone_number,
        type: "show_card",
      };
      await sendToWhatsapp.sendToWhatsapp(wellcomeData);
    } else {
      const wellcomeData = {
        from: "00",
        to: inputData.phone_number,
        phone_number: inputData.phone_number,
        content: shara.language === 'ar' ?
          "يرجى إنهاء كل الإختيارات لإستكمال الخطوة التالية" :
          "Please complete all selections to complete the next step.",
        type: "text",
      };
      await sendToWhatsapp.sendToWhatsapp(wellcomeData);
    }
  } else if (inputData.type === "calculate_delivery_charge") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });

    const address = shara.addresses.find(addresses => addresses.id === shara.choosen_address);

    const FormData = require('form-data');
    let data = new FormData();
    data.append('city_id', address.state);

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://alsharashoping.com/api/calculate-delivery-charge',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...data.getHeaders()
      },
      data: data
    };

    await axios.request(config)
      .then(async (response) => {
        console.log(JSON.stringify(response.data.data));
        if (response.data.data) {
          shara.delivery_price = response.data.data.charge;
          await shara.save();
          console.log("charge saved");

          const wellcomeData = {
            from: "00",
            to: inputData.phone_number,
            phone_number: inputData.phone_number,
            type: "calculate_tax",
          };
          await sendToWhatsapp.sendToWhatsapp(wellcomeData);
        } else {
          const wellcomeData = {
            from: "00",
            to: inputData.phone_number,
            phone_number: inputData.phone_number,
            content: response.data.message,
            type: "text",
          };
          await sendToWhatsapp.sendToWhatsapp(wellcomeData);
        }
      })
      .catch((error) => {
        console.log(error);
      });


  } else if (inputData.type === "show_offer_meals") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });

    let branch_meals = [];
    let product_items = [];
    let category_name;


    let config2 = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://alsharashoping.com/api/products-with-discount?scope=mini',
      headers: {}
    };

    await axios.request(config2)
      .then((response) => {
        //console.log(JSON.stringify(response.data.data.message.data));
        branch_meals = response.data.data;

      })
      .catch((error) => {
        console.log(error);
      });

    if (shara.language === 'ar') {
      category_name = "العروض";
    } else {
      category_name = "Offers";
    }

    for (let i = 0; i < branch_meals.length; i++) {
      const meal = branch_meals[i];
      if (shara.language === 'ar') {
        const newRow = {
          "product_retailer_id": `${meal.id}`,
        };
        product_items.push(newRow);
      }
      else {
        const newRow = {
          "product_retailer_id": `${meal.id}000`,
        };
        product_items.push(newRow);
      }
    }

    // sections["title"] = category_name;
    // sections["product_items"] = product_items;



    // console.log(sections);




    if (product_items.length == 0) {
      if (shara.language === 'ar') {
        const wellcomeData = {
          from: "00",
          to: inputData.phone_number,
          phone_number: inputData.phone_number,
          content: "عفوا هذه الفئة لا تحتوى على منتجات",
          type: "text",
        };
        await sendToWhatsapp.sendToWhatsapp(wellcomeData);
      }
      else {
        const wellcomeData = {
          from: "00",
          to: inputData.phone_number,
          phone_number: inputData.phone_number,
          content: "Sorry, this category does not contain products",
          type: "text",
        };
        await sendToWhatsapp.sendToWhatsapp(wellcomeData);
      }

      const wellcomeData2 = {
        from: "00",
        to: inputData.phone_number,
        phone_number: inputData.phone_number,
        type: "show_categories",
      };
      await sendToWhatsapp.sendToWhatsapp(wellcomeData2);
    } else {
      let breaks = 0;
      let section = [];
      let sections = [];

      for (let i = 0; i < product_items.length; i++) {
        const element = product_items[i];

        if ([
          "5472", "5461", "5462", "5451", "5362", "5427000", "5428000",
          "5433000", "5445000", "5453000", "5492000", "5496000"
        ].includes(element.product_retailer_id)) {
          breaks++;
          console.log("count of breaks", breaks);
          console.log("count of breaks", element);
          continue;
        }


        // [
        //   "5426", "5429", "5433", "5440", "5446", "5448",
        //   "5451", "5453", "5459", "5461", "5462", "5472",
        //   "5362000", "5381000", "5427000", "5440000", "5448000",
        //   "5451000", "5465000", "5472000", "5496000"
        // ]
        section.push(element);

        if (section.length === 30) {
          sections.push(section);
          section = [];
        }
      }

      if (section.length > 0) {
        sections.push(section);
      }

      console.log("count of breaks", breaks);
      console.log(sections.length);
      console.log(JSON.stringify(sections));

      shara.status = "choose_items";
      await shara.save();

      for (let i = 0; i < sections.length; i++) {
        const element = sections[i];
        const newRow = {
          "title": `${category_name}`,
          "product_items": element,
        };

        console.log("newRow", newRow);

        const wellcomeData2 = {
          from: "00",
          to: inputData.phone_number,
          phone_number: inputData.phone_number,
          sections: [newRow],
          type: "call_mpm",
        };
        await sendToWhatsapp.sendToWhatsapp(wellcomeData2);
      }
    }





    console.log({ data }, "teeeeeeeeeeeeeeest");
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }
    // });
    // });
  } else if (inputData.type === "calculate_tax") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });

    const address = shara.addresses.find(addresses => addresses.id === shara.choosen_address);;

    const FormData = require('form-data');
    let data = new FormData();
    data.append('subtotal', shara.total_price);
    data.append('country', address.country_name_en);

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://alsharashoping.com/api/calculate-tax',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...data.getHeaders()
      },
      data: data
    };

    await axios.request(config)
      .then(async (response) => {
        console.log(JSON.stringify(response.data));
        if (response.data.success == true) {
          shara.tax = response.data.tax_amount;
          await shara.save();
          console.log("tax saved");

          const wellcomeData = {
            from: "00",
            to: inputData.phone_number,
            phone_number: inputData.phone_number,
            type: "calculate_total_price",
          };
          await sendToWhatsapp.sendToWhatsapp(wellcomeData);
        } else {
          const wellcomeData = {
            from: "00",
            to: inputData.phone_number,
            phone_number: inputData.phone_number,
            content: response.data.message,
            type: "text",
          };
          await sendToWhatsapp.sendToWhatsapp(wellcomeData);
        }
      })
      .catch((error) => {
        console.log(error);
      });


  } else if (inputData.type === "calculate_total_price") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });

    let total_price = 0;
    let weight_extra_charge = 0.0;
    let text = "";
    if (shara.total_weight > 0 && shara.total_weight > 10000) {
      weight_extra_charge = ((shara.total_weight / 1000) - 10) * .1;
    }
    if (shara.language === 'ar') {
      text += "إجمالى الأسعار \n";
      text += `سعر المنتجات : ${parseFloat(shara.total_price).toFixed(3)} ر.ع \n`;
      total_price += parseFloat(shara.total_price);
      text += `تكلفة الشحن : ${parseFloat(shara.delivery_price).toFixed(3)} ر.ع  \n`;
      total_price += parseFloat(shara.delivery_price);
      text += `ضريبة القيمة المضافة : ${parseFloat(shara.tax).toFixed(3)} ر.ع  \n`;
      total_price += parseFloat(shara.tax);
      if (weight_extra_charge > 0) {
        text += `تكلفة الوزن الزائد : ${parseFloat(weight_extra_charge).toFixed(3)} ر.ع \n`;
        total_price += parseFloat(weight_extra_charge);
      }
      text += `التكلفة الإجمالية : ${parseFloat(total_price).toFixed(3)} ر.ع  \n`;

    }
    else {
      text += "Total prices \n";
      text += `Products price : ${parseFloat(shara.total_price).toFixed(3)} OMR \n`;
      total_price += parseFloat(shara.total_price);
      text += `Shipping cost : ${parseFloat(shara.delivery_price).toFixed(3)} OMR \n`;
      total_price += parseFloat(shara.delivery_price);
      text += `VAT : ${parseFloat(shara.tax).toFixed(3)} OMR \n`;
      total_price += parseFloat(shara.tax);
      if (weight_extra_charge > 0) {
        text += `Extra weight charge: ${parseFloat(weight_extra_charge).toFixed(3)} OMR \n`;
        total_price += parseFloat(weight_extra_charge);
      }
      text += `Total cost : ${parseFloat(total_price).toFixed(3)} OMR \n`;
    }

    shara.total = total_price;
    await shara.save();

    const wellcomeData = {
      from: "00",
      to: inputData.phone_number,
      phone_number: inputData.phone_number,
      content: text,
      type: "text",
    };
    await sendToWhatsapp.sendToWhatsapp(wellcomeData);

    const wellcomeData2 = {
      from: "00",
      to: inputData.phone_number,
      phone_number: inputData.phone_number,
      type: "Payment_test",
    };
    await sendToWhatsapp.sendToWhatsapp(wellcomeData2);

  } else if (inputData.type === "Payment_test") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });
    let products = [];
    let size = 1;
    let address;


    for (let i = 0; i < shara.card.length; i++) {
      const item = shara.card[i];

      const itemm2 = {};

      console.log("bbbbbbbbbbbbb");

      itemm2['product_id'] = parseInt(item.meal_id);
      itemm2['quantity'] = item.quantity;
      if (item.size) {
        itemm2['size_id'] = item.size[0].Size_Id;
      }

      if (item.weight) {
        itemm2['weight_id'] = item.weight[0].id;
      }

      if (item.additions) {
        if (item.additions.length > 0) {
          itemm2['addition_ids'] = [];
          for (let i = 0; i < item.additions.length; i++) {
            const element = item.additions[i];
            itemm2['addition_ids'].push(element.addition_id);
          }
        }
      }

      products.push(itemm2);

    }

    address = shara.addresses.find(addresses => addresses.id === shara.choosen_address);


    let data = {
      "billing_name": shara.name ? shara.name : inputData.phone_number,
      "billing_email": address.email ? address.email : "",
      "billing_street_address": address.street ? address.street : "",
      "billing_zipcode": "12345",
      "billing_country": address.country_name_en,
      "billing_state": parseInt(address.country),
      "billing_city": parseInt(address.state),
      "Payment_Method": "Thawani",
      "order_source": "whatsapp",
      "cart_items": products
    };

    // console.log("offers", JSON.stringify(offers));
    // console.log("meals", JSON.stringify(meals));
    // console.log("total_price", total_price);
    // console.log("total_price", data);
    console.log("products", JSON.stringify(products));

    console.log("data", JSON.stringify(data));


    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://alsharashoping.com/api/checkout',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Language': shara.language,
        'Authorization': `Bearer ${shara.token}`
      },
      data: data
    };
    console.log("config", JSON.stringify(config));


    await axios.request(config)
      .then(async (response) => {
        console.log(JSON.stringify(response.data));
        if (response.data.url) {

          let url = response.data.url;
          url = url.split('/pay/')[1];
          console.log("url", url);
          if (shara.language === 'ar') {
            const wellcomeData = {
              from: "00",
              to: inputData.phone_number,
              phone_number: inputData.phone_number,
              content: "يرجى الانتظار قليلاً لإرسال رابط الدفع",
              type: "text",
            };
            await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            const wellcomeData2 = {
              from: "00",
              to: inputData.phone_number,
              phone_number: inputData.phone_number,
              price: shara.total.toFixed(3),
              url: url,
              type: "Tpayment_url",
              // type: "Tpayment_url_test",
            };
            await sendToWhatsapp.sendToWhatsapp(wellcomeData2);
          }
          else {
            const wellcomeData = {
              from: "00",
              to: inputData.phone_number,
              phone_number: inputData.phone_number,
              content: "Please wait a moment for the payment link to be sent",
              type: "text",
            };
            await sendToWhatsapp.sendToWhatsapp(wellcomeData);
            const wellcomeData2 = {
              from: "00",
              to: inputData.phone_number,
              phone_number: inputData.phone_number,
              price: shara.total.toFixed(3),
              url: url,
              type: "Tpayment_url_en",
              // type: "Tpayment_url_test_en",
            };
            await sendToWhatsapp.sendToWhatsapp(wellcomeData2);
          }


        } else {
          console.log("error");
        }

      })
      .catch(async (error) => {
        console.log("error", error);
      });


  } else if (inputData.type === "Tpayment_url") {
    let components = [];
    data.type = "template";
    data.recipient_type = "individual";
    data.to = inputData.to;

    data.template = {
      name: "flow_payment2",
      language: {
        code: "ar",
      },
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: `${inputData.price} ر.ع`,
            },
          ],
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [
            {
              type: "payload",
              payload: inputData.url,
            },
          ],
        },
      ],
    };

    console.log({
      data,
    });
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }

    // });
  } else if (inputData.type === "Tpayment_url_en") {
    let components = [];
    data.type = "template";
    data.recipient_type = "individual";
    data.to = inputData.to;

    data.template = {
      name: "flow_payment2",
      language: {
        code: "en_US",
      },
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: `${inputData.price} OMR`,
            },
          ],
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [
            {
              type: "payload",
              payload: inputData.url,
            },
          ],
        },
      ],
    };

    console.log({
      data,
    });
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }

    // });
  } else if (inputData.type === "Tpayment_url_test") {
    let components = [];
    data.type = "template";
    data.recipient_type = "individual";
    data.to = inputData.to;

    data.template = {
      name: "flow_payment_test",
      language: {
        code: "ar",
      },
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: `${inputData.price} ر.ع`,
            },
          ],
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [
            {
              type: "payload",
              payload: inputData.url,
            },
          ],
        },
      ],
    };

    console.log({
      data,
    });
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }

    // });
  } else if (inputData.type === "Tpayment_url_test_en") {
    let components = [];
    data.type = "template";
    data.recipient_type = "individual";
    data.to = inputData.to;

    data.template = {
      name: "flow_payment_test",
      language: {
        code: "en_US",
      },
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: `${inputData.price} OMR`,
            },
          ],
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [
            {
              type: "payload",
              payload: inputData.url,
            },
          ],
        },
      ],
    };

    console.log({
      data,
    });
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }

    // });
  } else if (inputData.type === "subcategories") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });
    let subcategories = [];
    let apiData = [];

    let config2 = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://alsharashoping.com/api/subcategories/${inputData.category_id}`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };


    await axios.request(config2)
      .then((response) => {
        console.log(JSON.stringify(response.data));
        apiData = response.data.data;
      })
      .catch((error) => {
        console.log(error);
      });


    for (let i = 0; i < apiData.length; i++) {
      const subcategory = apiData[i];
      if (shara.language === 'ar') {
        const newRow = {
          id: `${subcategory.id}`,
          title: subcategory.name_ar,

        };
        subcategories.push(newRow);
      }
      else {
        const newRow = {
          id: `${subcategory.id}`,
          title: subcategory.name,

        };
        subcategories.push(newRow);
      }

    }

    if (subcategories.length == 0) {
      if (shara.language === 'ar') {
        const wellcomeData = {
          from: "00",
          to: inputData.phone_number,
          phone_number: inputData.phone_number,
          content: "عفوا هذا القسم لا يحتوى على فئات فرعية",
          type: "text",
        };
        await sendToWhatsapp.sendToWhatsapp(wellcomeData);
      }
      else {
        const wellcomeData = {
          from: "00",
          to: inputData.phone_number,
          phone_number: inputData.phone_number,
          content: "Sorry, this section does not contain subcategories.",
          type: "text",
        };
        await sendToWhatsapp.sendToWhatsapp(wellcomeData);
      }

      const wellcomeData2 = {
        from: "00",
        to: inputData.phone_number,
        phone_number: inputData.phone_number,
        type: "show_categories",
      };
      await sendToWhatsapp.sendToWhatsapp(wellcomeData2);
    } else {
      data.type = "interactive";
      data.recipient_type = "individual";
      data.to = inputData.to;
      if (shara.language === 'ar') {
        data.interactive = {
          type: "flow",
          body: {
            text: "قم بإختيار الفئة الفرعية",
          },
          action: {
            name: "flow",
            parameters: {
              // mode: "draft",
              mode: "published",
              flow_message_version: "3",
              flow_token: "453393884363277",
              flow_id: "453393884363277",
              flow_cta: "الفئات الفرعية",
              flow_action: "navigate",
              flow_action_payload: {
                screen: "subcategories",
                data: {
                  subcategories: subcategories,
                },
              },
            },
          },
        };
      }
      else {
        data.interactive = {
          type: "flow",
          body: {
            text: "Select Subcategory",
          },
          action: {
            name: "flow",
            parameters: {
              // mode: "draft",
              mode: "published",
              flow_message_version: "3",
              flow_token: "1020093872759925",
              flow_id: "1020093872759925",
              flow_cta: "Subcategories",
              flow_action: "navigate",
              flow_action_payload: {
                screen: "subcategories",
                data: {
                  subcategories: subcategories,
                },
              },
            },
          },
        };
      }
    }




    console.log({ data }, "teeeeeeeeeeeeeeest");
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }
  } else if (inputData.type === "edit_option") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });

    data.type = "interactive";
    data.recipient_type = "individual";
    data.to = inputData.to;
    if (shara.language === 'ar') {
      data.interactive = {
        type: "button",
        body: {
          text: "إختر نوع التعديل",
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: {
                id: "1",
                title: "إضافات لمنتج",
              },
            },
            {
              type: "reply",
              reply: {
                id: "2",
                title: "حذف منتج",
              },
            }
          ],
        },
      };
    }
    else {
      data.interactive = {
        type: "button",
        body: {
          text: "Choose the edit type",
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: {
                id: "1",
                title: "Add-ons to a product",
              },
            },
            {
              type: "reply",
              reply: {
                id: "2",
                title: "Delete a product",
              },
            }
          ],
        },
      };
    }


    console.log({ data }, "teeeeeeeeeeeeeeest");
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }
    // });
    // });
  } else if (inputData.type === "show_items_have_additions") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });

    let myItems = [];

    for (let i = 0; i < shara.card.length; i++) {
      const item = shara.card[i];
      if (item.additions && item.additions.length === 0) {
        const newRow = {
          id: `${item.meal_id}`,
          title: item.meal_name,
        };
        myItems.push(newRow);
      }
    }


    console.log(myItems);

    if (myItems.length == 0) {
      if (shara.language === 'ar') {
        const wellcomeData = {
          from: "00",
          to: inputData.phone_number,
          phone_number: inputData.phone_number,
          content: "عفوا لا يوجد لديك منتجات يمكن إضافة إضافات لها",
          type: "text",
        };
        await sendToWhatsapp.sendToWhatsapp(wellcomeData);
      }
      else {
        const wellcomeData = {
          from: "00",
          to: inputData.phone_number,
          phone_number: inputData.phone_number,
          content: "Sorry, you do not have any products that can be added to",
          type: "text",
        };
        await sendToWhatsapp.sendToWhatsapp(wellcomeData);
      }

      const wellcomeData2 = {
        from: "00",
        to: inputData.phone_number,
        phone_number: inputData.phone_number,
        type: "show_card",
      };
      await sendToWhatsapp.sendToWhatsapp(wellcomeData2);
    } else {
      data.type = "interactive";
      data.recipient_type = "individual";
      data.to = inputData.to;
      if (shara.language === 'ar') {
        data.interactive = {
          type: "flow",
          body: {
            text: "قم بإختيار المنتج الذى تريد إضافة له إضافات",
          },
          action: {
            name: "flow",
            parameters: {
              // mode: "draft",
              mode: "published",
              flow_message_version: "3",
              flow_token: "1914155952420892",
              flow_id: "1914155952420892",
              flow_cta: "إختيار",
              flow_action: "navigate",
              flow_action_payload: {
                screen: "choose_items",
                data: {
                  myItems: myItems,
                },
              },
            },
          },
        };
      }
      else {
        data.interactive = {
          type: "flow",
          body: {
            text: "Choose the product to which you want to add additives.",
          },
          action: {
            name: "flow",
            parameters: {
              // mode: "draft",
              mode: "published",
              flow_message_version: "3",
              flow_token: "528146699653128",
              flow_id: "528146699653128",
              flow_cta: "Choose",
              flow_action: "navigate",
              flow_action_payload: {
                screen: "choose_items",
                data: {
                  myItems: myItems,
                },
              },
            },
          },
        };
      }
    }

    console.log({ data }, "teeeeeeeeeeeeeeest");
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }
  } else if (inputData.type === "show_addition_of_product") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });
    let additions = [];
    let apiData = [];
    let item_label = "";

    let config2 = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://alsharashoping.com/api/products/${inputData.choosen_item}`,
      headers: {}
    };

    await axios.request(config2)
      .then((response) => {
        console.log(JSON.stringify(response.data));
        apiData = response.data.data;
      })
      .catch((error) => {
        console.log(error);
      });

    const item = shara.card.find(cardItem => cardItem.meal_id === inputData.choosen_item && cardItem.additions.length == 0);


    if (shara.language === 'ar') {
      item_label = apiData.fr_Product_Name;
    }
    else {
      item_label = apiData.en_Product_Name;
    }
    for (let i = 0; i < apiData.additions.length; i++) {
      const addition = apiData.additions[i];
      if (shara.language === 'ar') {
        const newRow = {
          id: `${addition.id}`,
          title: addition.name_ar,

        };
        additions.push(newRow);
      }
      else {
        const newRow = {
          id: `${addition.id}`,
          title: addition.name ? addition.name : addition.name_ar,

        };
        additions.push(newRow);
      }

    }

    if (additions.length == 0) {
      if (shara.language === 'ar') {
        const wellcomeData = {
          from: "00",
          to: inputData.phone_number,
          phone_number: inputData.phone_number,
          content: "عفوا هذا المنتج لا يحتوى على إضافات",
          type: "text",
        };
        await sendToWhatsapp.sendToWhatsapp(wellcomeData);
      }
      else {
        const wellcomeData = {
          from: "00",
          to: inputData.phone_number,
          phone_number: inputData.phone_number,
          content: "Sorry, this product does not contain additives",
          type: "text",
        };
        await sendToWhatsapp.sendToWhatsapp(wellcomeData);
      }

      const wellcomeData2 = {
        from: "00",
        to: inputData.phone_number,
        phone_number: inputData.phone_number,
        type: "show_categories",
      };
      await sendToWhatsapp.sendToWhatsapp(wellcomeData2);
    } else {
      data.type = "interactive";
      data.recipient_type = "individual";
      data.to = inputData.to;
      if (shara.language === 'ar') {
        data.interactive = {
          type: "flow",
          body: {
            text: "قم بإختيار الاضافات",
          },
          action: {
            name: "flow",
            parameters: {
              // mode: "draft",
              mode: "published",
              flow_message_version: "3",
              flow_token: "1028277695433728",
              flow_id: "1028277695433728",
              flow_cta: "إضافة",
              flow_action: "navigate",
              flow_action_payload: {
                screen: "add_additions",
                data: {
                  additions: additions,
                  item_label: item_label,
                  choosen_item: `${item.id}`,
                },
              },
            },
          },
        };
      }
      else {
        data.interactive = {
          type: "flow",
          body: {
            text: "Choose add-ons",
          },
          action: {
            name: "flow",
            parameters: {
              // mode: "draft",
              mode: "published",
              flow_message_version: "3",
              flow_token: "1659799611462553",
              flow_id: "1659799611462553",
              flow_cta: "add",
              flow_action: "navigate",
              flow_action_payload: {
                screen: "add_additions",
                data: {
                  additions: additions,
                  item_label: item_label,
                  choosen_item: `${item.id}`,
                },
              },
            },
          },
        };
      }
    }




    console.log({ data }, "teeeeeeeeeeeeeeest");
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }
  } else if (inputData.type === "save_additions") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });

    const item = shara.card.find(cardItem => cardItem.id === parseInt(inputData.choosen_item));
    if (!item) return;

    let apiData;
    let dataPush = [];
    let item_price = 0;

    try {
      const response = await axios.get(`https://alsharashoping.com/api/products/${parseInt(item.meal_id)}`);
      apiData = response.data.data.additions;
    } catch (error) {
      console.log("Error fetching data from API:", error);
      return;
    }

    for (let m = 0; m < apiData.length; m++) {
      for (let a = 0; a < inputData.additions.length; a++) {
        if (apiData[m].id == parseInt(inputData.additions[a])) {
          item_price += parseFloat(apiData[m].price);
          const newRow = {
            addition_id: apiData[m].id,
            addition_name: shara.language === 'ar' ? apiData[m].name_ar : apiData[m].name || apiData[m].name_ar,
            addition_price: apiData[m].price,
          };
          dataPush.push(newRow);
        }
      }
    }

    item.meal_price += parseFloat(item_price || 0);
    item.additions_price += parseFloat(item_price || 0);
    item.additions = dataPush;
    shara.markModified('card');

    try {
      await shara.save();
      console.log("Data saved successfully");

      const wellcomeData = {
        from: "00",
        to: inputData.phone_number,
        phone_number: inputData.phone_number,
        type: "show_card",
      };
      await sendToWhatsapp.sendToWhatsapp(wellcomeData);

    } catch (error) {
      console.log("Error saving data:", error);
      const errorData = {
        from: "00",
        to: inputData.phone_number,
        phone_number: inputData.phone_number,
        type: "text",
        content: shara.language === 'ar' ?
          "حدث خطأ أثناء حفظ البيانات. يرجى المحاولة مرة أخرى." :
          "An error occurred while saving your data. Please try again.",
      };
      await sendToWhatsapp.sendToWhatsapp(errorData);
    }
  } else if (inputData.type === "start_service_template") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });
    let components = [];

    data.type = "template";
    data.recipient_type = "individual";
    data.to = inputData.to;

    if (shara.language === 'ar') {
      data.template = {
        name: "flow_start_service",
        language: {
          code: "ar",
        },
        components,
      };
    }
    else {
      data.template = {
        name: "flow_start_service",
        language: {
          code: "en_US",
        },
        components,
      };
    }



    console.log({ data }, "teeeeeeeeeeeeeeest");
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }
    // });
    // });
  } else if (inputData.type === "start_service_flow") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });

    const categories = [
      {
        id: "1",
        title: "التحدث مع خدمة العملاء",
      },
      {
        id: "2",
        title: "التسوق عبر الواتساب",
      },
      {
        id: "3",
        title: "الاسئلة الشائعة",
      },
      {
        id: "4",
        title: "مواقع متاجرنا",
      },
    ];
    const categories_en = [
      {
        id: "1",
        title: "Speak to customer service",
      },
      {
        id: "2",
        title: "Shopping via WhatsApp",
      },
      {
        id: "3",
        title: "Frequently Asked Question",
      },
      {
        id: "4",
        title: "Our Store Locations",
      },
    ];


    data.type = "interactive";
    data.recipient_type = "individual";
    data.to = inputData.to;


    if (shara.language === 'ar') {
      data.interactive = {
        type: "flow",
        body: {
          text: "قم بإختيار الخدمة",
        },
        action: {
          name: "flow",
          parameters: {
            // mode: "draft",
            mode: "published",
            flow_message_version: "3",
            flow_token: "1949975815446699",
            flow_id: "1949975815446699",
            flow_cta: "الخدمات",
            flow_action: "navigate",
            flow_action_payload: {
              screen: "flow_start_service",
              data: {
                categories: categories,
              },
            },
          },
        },
      };
    }
    else {
      data.interactive = {
        type: "flow",
        body: {
          text: "Choose the service",
        },
        action: {
          name: "flow",
          parameters: {
            // mode: "draft",
            mode: "published",
            flow_message_version: "3",
            flow_token: "1177618739973984",
            flow_id: "1177618739973984",
            flow_cta: "services",
            flow_action: "navigate",
            flow_action_payload: {
              screen: "flow_start_service",
              data: {
                categories: categories_en,
              },
            },
          },
        },
      };
    }



    console.log({ data }, "teeeeeeeeeeeeeeest");
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }
  } else if (inputData.type === "change_status") {
    let components = [];
    data.type = "template";
    data.recipient_type = "individual";
    data.to = inputData.to;

    data.template = {
      name: "flow_change_status2",
      language: {
        code: "ar",
      },
      components: [
        {
          type: "header",
          parameters: [
            {
              type: "text",
              text: inputData.order_id,
            },
          ],
        },
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: inputData.name,
            },
            {
              type: "text",
              text: inputData.status,
            },
          ],
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [
            {
              type: "payload",
              payload: inputData.url,
            },
          ],
        },
      ],
    };

    console.log({
      data,
    });
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }

    // });
  } else if (inputData.type === "change_status_en") {
    let components = [];
    data.type = "template";
    data.recipient_type = "individual";
    data.to = inputData.to;

    data.template = {
      name: "flow_change_status2",
      language: {
        code: "en",
      },
      components: [
        {
          type: "header",
          parameters: [
            {
              type: "text",
              text: inputData.order_id,
            },
          ],
        },
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: inputData.name,
            },
            {
              type: "text",
              text: inputData.status,
            },
          ],
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [
            {
              type: "payload",
              payload: inputData.url,
            },
          ],
        },
      ],
    };

    console.log({
      data,
    });
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }

    // });
  } else if (inputData.type === "change_status_delivered") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });

    let components = [];
    data.type = "template";
    data.recipient_type = "individual";
    data.to = inputData.to;

    data.template = {
      name: "flow_change_status_delivered2",
      language: {
        code: shara.language === 'ar' ? "ar" : "en",
      },
      components: [
        {
          type: "header",
          parameters: [
            {
              type: "text",
              text: inputData.order_id,
            },
          ],
        },
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: inputData.name,
            },
            {
              type: "text",
              text: inputData.status,
            },
          ],
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [
            {
              type: "payload",
              payload: inputData.url,
            },
          ],
        },
      ],
    };

    console.log({
      data,
    });
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }

    // });
  } else if (inputData.type === "flow_pdf") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });
    let language = "ar";
    if (shara && shara.language !== 'ar') {
      language = 'en';
    }

    let components = [];
    data.type = "template";
    data.recipient_type = "individual";
    data.to = inputData.to;

    data.template = {
      name: "flow_pdf2",
      language: {
        code: language,
      },
      components: [
        {
          type: "header",
          parameters: [
            {
              type: "document",
              document: {
                filename: inputData.filename,
                link: inputData.link
              }

            },
          ],
        },
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: inputData.booking_id,
            },
          ],
        }
      ],
    };

    console.log({
      data,
    });
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }

    // });
  } else if (inputData.type === "show_categories") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });
    shara.status = "choose_items",
      await shara.save();
    let categories = [];
    let apiData = [];

    let config2 = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://alsharashoping.com/api/categories',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };


    await axios.request(config2)
      .then((response) => {
        console.log(JSON.stringify(response.data));
        apiData = response.data.data;
      })
      .catch((error) => {
        console.log(error);
      });

    async function convertImageToBase64(imageUrl) {
      try {
        const response = await axios.get(imageUrl, {
          responseType: 'arraybuffer' // Get raw binary data
        });

        const maxSizeInBytes = 100 * 1024;

        let imageBuffer = Buffer.from(response.data, 'binary'); // Image data as buffer

        while (imageBuffer.length > maxSizeInBytes) {
          imageBuffer = await sharp(imageBuffer)
            .resize({ width: 200, height: 250, fit: 'fill' }) // Resize to exact dimensions
            .jpeg({ quality: 70 }) // Adjust quality to reduce size
            .toBuffer();

          console.log(`Image resized and compressed to reduce size`);
        }

        const base64Image = imageBuffer.toString('base64');

        return `${base64Image}`; // Specify the correct data type
      } catch (error) {
        console.error(`Error fetching or processing image: ${error.message}`);
        throw error;
      }
    }
    const offer = {
      "id": 110000,
      "en_Category_Name": "Offers",
      "fr_Category_Name": "العروض",
      "Category_Icon": "https://cdn.glitch.global/e74a8780-9870-4414-a0db-bbe188920678/alshare%20Logo.jpg?v=1721478975899"
    }

    apiData.push(offer);


    for (let i = 0; i < apiData.length; i++) {
      const category = apiData[i];
      const base64Image = await convertImageToBase64(category.Category_Icon);
      if (shara.language === 'ar') {
        const newRow = {
          id: `${category.id}`,
          title: category.fr_Category_Name,
          image: base64Image

        };
        categories.push(newRow);
      }
      else {
        const newRow = {
          id: `${category.id}`,
          title: category.en_Category_Name,
          image: base64Image
        };
        categories.push(newRow);
      }
    }

    if (categories.length == 0) {
      if (shara.language === 'ar') {
        const wellcomeData = {
          from: "00",
          to: inputData.phone_number,
          phone_number: inputData.phone_number,
          content: "عفوا لا يوجد فئات",
          type: "text",
        };
        await sendToWhatsapp.sendToWhatsapp(wellcomeData);
      }
      else {
        const wellcomeData = {
          from: "00",
          to: inputData.phone_number,
          phone_number: inputData.phone_number,
          content: "Sorry, there are no categories.",
          type: "text",
        };
        await sendToWhatsapp.sendToWhatsapp(wellcomeData);
      }

    } else {
      data.type = "interactive";
      data.recipient_type = "individual";
      data.to = inputData.to;
      if (shara.language === 'ar') {
        data.interactive = {
          type: "flow",
          body: {
            text: "قم بإختيار الفئة ",
          },
          action: {
            name: "flow",
            parameters: {
              // mode: "draft",
              mode: "published",
              flow_message_version: "3",
              flow_token: "431604453281835",
              flow_id: "431604453281835",
              flow_cta: "الفئات",
              flow_action: "navigate",
              flow_action_payload: {
                screen: "categories",
                data: {
                  categories: categories,
                },
              },
            },
          },
        };
      }
      else {
        data.interactive = {
          type: "flow",
          body: {
            text: "Select category",
          },
          action: {
            name: "flow",
            parameters: {
              // mode: "draft",
              mode: "published",
              flow_message_version: "3",
              flow_token: "951518313665963",
              flow_id: "951518313665963",
              flow_cta: "categories",
              flow_action: "navigate",
              flow_action_payload: {
                screen: "categories",
                data: {
                  categories: categories,
                },
              },
            },
          },
        };
      }
    }




    console.log({ data }, "teeeeeeeeeeeeeeest");
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }
  } else if (inputData.type === "active") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });

    data.type = "interactive";
    data.recipient_type = "individual";
    data.to = inputData.to;
    if (shara.language === 'ar') {
      data.interactive = {
        type: "button",
        body: {
          text: "لكى تتمكن من الرجوع الى الخدمة التلقائية \n برجاء الضغط على تفعيل",
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: {
                id: "1",
                title: "تفعيل",
              },
            }
          ],
        },
      };
    }
    else {
      data.interactive = {
        type: "button",
        body: {
          text: "In order to be able to return to the automatic service \n please click on activate",
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: {
                id: "1",
                title: "activate",
              },
            }
          ],
        },
      };
    }


    console.log({ data }, "teeeeeeeeeeeeeeest");
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }
    // });
    // });
  } else if (inputData.type === "payment_pdf_template") {
    // let shara = await OrderID.findOne({ from: inputData.phone_number });

    let components = [];
    data.type = "template";
    data.recipient_type = "individual";
    data.to = inputData.to;

    data.template = {
      name: inputData.created_by === 'user' ? "flow_payment_ur_pdf" : "flow_payment_exist_order",
      language: {
        code: inputData.language,
      },
      components: [
        {
          type: "header",
          parameters: [
            {
              type: "document",
              document: {
                filename: inputData.filename,
                link: inputData.link
              }

            },
          ],
        },
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: inputData.language === 'ar' ? `${inputData.price} ر.ع` : `${inputData.price} OMR`,
            },
          ],
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [
            {
              type: "payload",
              payload: inputData.url,
            },
          ],
        },
      ],
    };

    console.log({
      data,
    });
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }

    // });
  } else if (inputData.type === "flow_catalog_display") {
    let shara = await OrderID.findOne({ from: inputData.phone_number });
    let language = "ar";
    if (shara && shara.language !== 'ar') {
      language = 'en';
    }

    let components = [];
    data.type = "template";
    data.recipient_type = "individual";
    data.to = inputData.to;

    data.template = {
      name: "flow_catalog_display2",
      language: {
        code: language,
      },
      components: [
        {
          type: "button",
          sub_type: "CATALOG",
          index: 0,
          parameters: [
            {
              type: "action",
              action: {
                thumbnail_product_retailer_id: "",
              },
            },
          ],
        },
      ],
    };

    console.log({
      data,
    });
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }

    // });
  }


  else if (inputData.type === "test2") {

    let Items = 0;


    let config2 = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://alsharashoping.com/api/products?per_page=9999',
      headers: {}
    };

    await axios.request(config2)
      .then((response) => {
        //console.log(JSON.stringify(response.data.data.message.data));
        branch_meals = response.data.data;

      })
      .catch((error) => {
        console.log(error);
      });

    for (let i = 0; i < branch_meals.length; i++) {
      const meal = branch_meals[i];
      // if (meal.weights.length > 0) {
      //   Items++;

      // } else {
      //   console.log("not contain", meal.id);
      // }

      if (meal.weights.length == 0) {
        Items++;
        console.log("meal.sizes", meal.id);
        // const wellcomeData = {
        //   from: "00",
        //   to: inputData.phone_number,
        //   phone_number: inputData.phone_number,
        //   content: `*Saleh*`,
        //   type: "text",
        // };
        // await sendToWhatsapp.sendToWhatsapp(wellcomeData);
        break;
      }
    }

    console.log("number of items", Items);

  }

  // usage


  return true;


};
