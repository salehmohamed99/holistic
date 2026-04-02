const axiosHelper = require("../helpers/axiosHelper");
const axios = require('axios');
const OrderID = require("../models/OrderIDModel");
sendToWhatsapp = require("./sendToWhatsapp");
const sharp = require('sharp');

// const {
//   WHATSAPP_PHONE_NUMBER_ID,
//   WHATSAPP_TOKEN,
// } = require("./messageController");
const WHATSAPP_PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

const buildWhatsappDocumentPayload = (inputData) => {
  const document = {
    filename: inputData.filename || "Invoice.pdf",
  };

  if (typeof inputData.link === "string" && /^https?:\/\//i.test(inputData.link)) {
    document.link = inputData.link;
  } else {
    document.id = inputData.link;
  }

  return document;
};

exports.sendToWhatsapp = async (inputData) => {
  console.log(
    {
      inputData,
    },
    "Icoooooming Dataaa"
  );

  const url =
    "https://graph.facebook.com/v24.0/" +
    WHATSAPP_PHONE_NUMBER_ID +
    "/messages?access_token=" +
    WHATSAPP_TOKEN;
  console.log("WhatsApp API URL:", url);

  let data = {};

  data.messaging_product = "whatsapp";

  if (inputData.msgType === "media") {
    data.to = inputData.to;
    data.type = inputData.type;
    data[inputData.type] = {
      id: inputData.mediaId,
      filename: inputData.filename,
    };

    console.log("Payload:", JSON.stringify(data, null, 2));
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
  }

  // usage
  else if (inputData.type === "select_language") {

    data.type = "interactive";
    data.recipient_type = "individual";
    data.to = inputData.to;
    data.interactive = {
      type: "button",
      header: {
        type: "image",
        image: {
          // link: "https://whatsapi.alhispeedshoping.com/attachments/hispeed_logo.png",
          id: "1450347569433068"
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
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });

    data.type = "interactive";
    data.recipient_type = "individual";
    data.to = inputData.to;
    if (hispeed.language === 'ar') {
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
                id: "2",
                title: "تصفح الأقسام",
              },
            },
            {
              type: "reply",
              reply: {
                id: "1",
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
                id: "2",
                title: "Browse categories",
              },
            },
            {
              type: "reply",
              reply: {
                id: "1",
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
  } else if (inputData.type === "otp") {
    let components = [];
    data.type = "template";
    data.recipient_type = "individual";
    data.to = inputData.to;

    data.template = {
      name: "flow_otp3",
      language: {
        code: inputData.language,
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
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });
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

    if (hispeed.language === 'ar') {
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
            flow_token: hispeed.name === '' ? "2021905735035121" : "1283948373597390",
            flow_id: hispeed.name === '' ? "2021905735035121" : "1283948373597390",
            flow_cta: "تسجيل الدخول",
            flow_action: "navigate",
            flow_action_payload: {
              screen: "SIGN_IN",
              data: {
                default_code: Number(country_code),
                default_phone: Number(new_phone_without_code),
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
            flow_token: hispeed.name === '' ? "3609426695864872" : "987466146953760",
            flow_id: hispeed.name === '' ? "3609426695864872" : "987466146953760",
            flow_cta: "Sign In",
            flow_action: "navigate",
            flow_action_payload: {
              screen: "SIGN_IN",
              data: {
                default_code: Number(country_code),
                default_phone: Number(new_phone_without_code),
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
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });

    let data = JSON.stringify({
      "phone": inputData.phone_number
    });

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://hispeed.om/api/whatsapp/login',
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
          hispeed.token = response.data.token;
          await hispeed.save();

          const wellcomeData3 = {
            from: "00",
            to: inputData.to,
            phone_number: inputData.to,
            content: hispeed.language === 'ar' ? "تم تسجيل الدخول بنجاح" : "You have successfully logged in",
            type: "text",
          };

          await sendToWhatsapp.sendToWhatsapp(wellcomeData3);

          const wellcomeData2 = {
            from: "00",
            to: inputData.phone_number,
            phone_number: inputData.phone_number,
            type: hispeed.card.length > 0 ? "show_card" : "show_categories",
          };
          await sendToWhatsapp.sendToWhatsapp(wellcomeData2);

        } else {
          const wellcomeData3 = {
            from: "00",
            to: inputData.to,
            phone_number: inputData.to,
            type: "sign_up",
          };

          await sendToWhatsapp.sendToWhatsapp(wellcomeData3);

        }
      })
      .catch((error) => {
        console.log(error);
      });
  } else if (inputData.type === "sign_up") {
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });
    let country_code;
    let new_phone_without_code;
    let phone = inputData.phone_number;


    if (phone) {
      if (phone.startsWith("20")) {
        country_code = "20";
        new_phone_without_code = phone.slice(2);
      } else {
        country_code = "968";
        new_phone_without_code = phone.slice(3);
      }
    }
    let data = JSON.stringify({
      "name": hispeed.name === '' ? "Customer" : hispeed.name,
      "phone": new_phone_without_code,
      "country_code": country_code,
    });

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://hispeed.om/api/whatsapp/register',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: data
    };
    console.log("data", data);

    axios.request(config)
      .then(async (response) => {
        if (response.status === 201) {
          console.log("Response status: 201 Created");
          console.log(JSON.stringify(response.data));
          hispeed.token = response.data.token;
          await hispeed.save();

          const wellcomeData3 = {
            from: "00",
            to: inputData.to,
            phone_number: inputData.to,
            content: hispeed.language === 'ar' ? "تم تسجيل الدخول بنجاح" : "You have successfully logged in",
            type: "text",
          };

          await sendToWhatsapp.sendToWhatsapp(wellcomeData3);

          const wellcomeData2 = {
            from: "00",
            to: inputData.phone_number,
            phone_number: inputData.phone_number,
            type: hispeed.card.length > 0 ? "show_card" : "show_categories",
          };
          await sendToWhatsapp.sendToWhatsapp(wellcomeData2);

        } else {
          console.log(`Unexpected response status: ${response.status}`);
        }
      })
      .catch(async (error) => {
        const statusCode = error?.response?.status;
        const phoneErrors = error?.response?.data?.errors?.phone;
        const alreadyTaken =
          statusCode === 422 &&
          Array.isArray(phoneErrors) &&
          phoneErrors.some(
            (msg) =>
              typeof msg === "string" && msg.toLowerCase().includes("already been taken")
          );

        if (alreadyTaken) {
          const infoData = {
            from: "00",
            to: inputData.phone_number,
            phone_number: inputData.phone_number,
            content: hispeed.language === 'ar'
              ? "الرقم مسجل مسبقاً، سيتم تحويلك إلى تسجيل الدخول"
              : "This number is already registered. Redirecting you to sign in.",
            type: "text",
          };
          await sendToWhatsapp.sendToWhatsapp(infoData);

          const loginFlowData = {
            from: "00",
            to: inputData.phone_number,
            phone_number: inputData.phone_number,
            type: "sign_in_flow",
          };
          await sendToWhatsapp.sendToWhatsapp(loginFlowData);
          return;
        }

        console.log(error?.response?.data || error);
      });
  } else if (inputData.type === "show_categories") {
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });
    hispeed.status = "choose_items",
      await hispeed.save();
    let categories = [];
    let apiData = [];

    let config2 = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://hispeed.om/api/whatsapp/categories',
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


    for (let i = 0; i < apiData.length; i++) {
      const category = apiData[i];
      const base64Image = await convertImageToBase64(category.Category_Icon);
      if (hispeed.language === 'ar') {
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
      if (hispeed.language === 'ar') {
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
            flow_token: hispeed.language === 'ar' ? "941863128310437" : "1903514066957350",
            flow_id: "941863128310437",
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

    console.log({ data }, "teeeeeeeeeeeeeeest");
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }
  } else if (inputData.type === "show_category_meals") {
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });

    let branch_meals = [];
    let product_items = [];
    let category_name;


    let config2 = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://hispeed.om/api/whatsapp/products?category_id=${inputData.category_id}&per_page=999`,
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
      if (hispeed.language === 'ar') {
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


    const selectedCategoryId = parseInt(inputData.category_id || hispeed.category_id);
    category_name = hispeed.language === 'ar' ? "الفئة" : "Category";

    for (let i = 0; i < branch_meals.length; i++) {
      const meal = branch_meals[i];
      if (!meal || !meal.category || meal.category.id == null) {
        continue;
      }

      if (meal.category.id == selectedCategoryId) {
        if (hispeed.language === 'ar') {
          category_name = meal.category.fr_Category_Name || category_name;
        } else {
          category_name = meal.category.en_Category_Name || category_name;
        }

        if (category_name && category_name.length >= 24) {
          // Keep title short enough for interactive commerce section titles.
          let lastSpaceIndex = category_name.lastIndexOf(' ', 24);

          if (lastSpaceIndex !== -1) {
            category_name = category_name.substring(0, lastSpaceIndex);
          } else {
            category_name = category_name.substring(0, 24);
          }
        }
        break;
      }

    }
    // sections["title"] = category_name;
    // sections["product_items"] = product_items;



    console.log("category_name", category_name);




    if (product_items.length == 0) {
      if (hispeed.language === 'ar') {
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
        category_id: hispeed.category_id,
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
          "282"
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

      hispeed.status = "choose_items";
      await hispeed.save();

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

      const wellcomeData = {
        from: "00",
        to: inputData.phone_number,
        phone_number: inputData.phone_number,
        type: "show_categories",
      };

      await sendToWhatsapp.sendToWhatsapp(wellcomeData);
    }

  } else if (inputData.type === "call_mpm") {
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });

    data.type = "template";
    data.recipient_type = "individual";
    data.to = inputData.to;
    data.template = {
      name: "flow_products",
      language: {
        code: hispeed.language === 'ar' ? "ar" : "en",
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
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });

    for (let i = 0; i < inputData.product_items.length; i++) {
      const item = inputData.product_items[i];
      let item_id;
      if (hispeed.language === 'en' || (item.product_retailer_id.length >= 5 && item.product_retailer_id.endsWith('000'))) {
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
        is_last_item: i === inputData.product_items.length - 1,
        type: "save_item",
      };
      await sendToWhatsapp.sendToWhatsapp(wellcomeData);


    }

    hispeed = await OrderID.findOne({ from: inputData.phone_number });

    if ((hispeed.init_card_counter === 0) && (hispeed.card.length === hispeed.items_length)
      && (inputData.product_items_length === hispeed.same_card)) {
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
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });
    let apiData;

    let config2 = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://hispeed.om/api/whatsapp/products/${inputData.item_id}`,
      headers: {}
    };

    await axios.request(config2)
      .then((response) => {
        apiData = response.data;
      })
      .catch((error) => {
        console.log(error);
      });

    let mealPrice = parseFloat(apiData.Discount_Price) ? parseFloat(apiData.Discount_Price) : parseFloat(apiData.Price);


    let existingItem = hispeed.card.find(item =>
      item.meal_id === apiData.id.toString()
    );

    if (existingItem) {
      existingItem.quantity += parseInt(inputData.quantity);
      hispeed.markModified('card');
    } else {
      let cardItem = {
        id: hispeed.items_counter + 1,
        meal_id: `${apiData.id}`,
        quantity: parseInt(inputData.quantity),
        meal_name: hispeed.language === 'ar' ? `${apiData.fr_Product_Name}` : `${apiData.en_Product_Name}`,
        meal_price: parseFloat(mealPrice.toFixed(3)),
      };

      hispeed.card.push(cardItem);
      hispeed.items_counter++;
      hispeed.items_length++;
    }

    hispeed.same_card++;

    try {
      await hispeed.save();
      console.log("hispeed order saved successfully.");
    } catch (error) {
      console.error("Error saving hispeed order:", error);
    }


    if (inputData.is_last_item) {
      const wellcomeData = {
        from: "00",
        to: inputData.phone_number,
        phone_number: inputData.phone_number,
        type: "show_card",
      };
      await sendToWhatsapp.sendToWhatsapp(wellcomeData);
    }
  } else if (inputData.type === "show_card") {
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });

    if (!hispeed.token) {
      const wellcomeData = {
        from: "00",
        to: inputData.phone_number,
        phone_number: inputData.phone_number,
        type: "sign_in_flow",
      };
      await sendToWhatsapp.sendToWhatsapp(wellcomeData);

    } else {
      let card_items = [];
      for (let i = 0; i < hispeed.card.length; i++) {
        card_items.push(hispeed.card[i]);
      }

      let text = "";
      if (hispeed.language === 'ar') {
        text += "السلة 🛒    \n";
      }
      else {
        text += "Card 🛒 \n";
      }

      let item_price = 0;
      let total_price = 0;

      for (const item of card_items) {
        if (hispeed.language === 'ar') {
          text += `\nإسم المنتج : ${item.meal_name} \n السعر ${item.meal_price} ر.ع \n الكمية ${item.quantity} \n`;
        }
        else {
          text += `\nProduct name: ${item.meal_name} \n Price ${item.meal_price} OMR \n Quantity ${item.quantity} \n`;
        }

        item_price = (parseFloat(item.meal_price) * parseInt(item.quantity)) || 0;
        total_price += parseFloat(item_price);

        if (hispeed.language === 'ar') {
          text += `سعر المنتج النهائى : ${item_price.toFixed(3) || 0} ر.ع \n`;
        }
        else {
          text += `Final product price: ${item_price.toFixed(3) || 0} OMR \n`;
        }
      }


      if (hispeed.language === 'ar') {
        text += `\nالسعر الإجمالى : ${total_price.toFixed(3)} ر.ع \n`;
      }
      else {
        text += `\nTotal price: ${total_price.toFixed(3)} OMR \n`;
      }

      hispeed.total_price = total_price.toFixed(3);

      hispeed.is_offer = false;
      hispeed.is_delete = false;
      hispeed.same_card = 0;

      await hispeed.save();
      console.log("text lenght", text.length);

      const wellcomeData2 = {
        from: "00",
        to: inputData.phone_number,
        phone_number: inputData.phone_number,
        content: text,
        type: "text",
      };
      await sendToWhatsapp.sendToWhatsapp(wellcomeData2);

      if (hispeed.card.length == 0) {
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
        if (hispeed.language === 'ar') {
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
                    title: "حذف منتج",
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
                    title: "Delete a product",
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
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });

    hispeed.status = "address";
    await hispeed.save();

    data.type = "interactive";
    data.recipient_type = "individual";
    data.to = inputData.to;
    if (hispeed.language === 'ar') {
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
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });
    let countries = [];
    let apiData = [];

    hispeed.status = "add_address";
    await hispeed.save();

    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://hispeed.om/api/whatsapp/shipping-locations',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    await axios.request(config)
      .then((response) => {
        console.log(JSON.stringify(response.data));
        apiData = response.data[0].states;
      })
      .catch((error) => {
        console.log(error);
      });

    console.log(apiData);
    for (let i = 0; i < apiData.length; i++) {
      const country = apiData[i];
      if (hispeed.language === 'ar') {
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
    if (hispeed.language === 'ar') {
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
            flow_token: "1942170483357520",
            flow_id: "1942170483357520",
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
            flow_token: "919795327328123",
            flow_id: "919795327328123",
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
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });
    let states = [];
    let apiData = [];
    let countries = [];

    let config2 = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://hispeed.om/api/whatsapp/shipping-locations',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };


    await axios.request(config2)
      .then((response) => {
        console.log(JSON.stringify(response.data));
        countries = response.data[0].states;
      })
      .catch((error) => {
        console.log(error);
      });

    for (let i = 0; i < countries.length; i++) {
      const country = countries[i];
      if (parseInt(inputData.country) === country.id) {

        for (let index = 0; index < hispeed.addresses.length; index++) {
          const element = hispeed.addresses[index];
          if (element.id === inputData.address_id) {
            if (hispeed.language === 'ar') {
              element.country_name_ar = country.name_ar;
              element.country_name_en = country.name_en;
            }
            else {
              element.country_name_en = country.name_en;
            }
            await hispeed.save();
            break;
          }
        }

        for (let j = 0; j < country.cities.length; j++) {
          const key = country.cities[j];

          if (hispeed.language === 'ar') {
            const newRow = {
              id: `${key.id}`,
              title: key.name_ar,

            };
            states.push(newRow);
          }
          else {
            const newRow = {
              id: `${key.id}`,
              title: key.name_en,

            };
            states.push(newRow);
          }
        }
      }
    }


    data.type = "interactive";
    data.recipient_type = "individual";
    data.to = inputData.to;
    if (hispeed.language === 'ar') {
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
            flow_token: "2361867857628849",
            flow_id: "2361867857628849",
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
            flow_token: "1879942182678879",
            flow_id: "1879942182678879",
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
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });
    let apiData = [];


    let config2 = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://hispeed.om/api/whatsapp/shipping-locations',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };


    await axios.request(config2)
      .then((response) => {
        console.log(JSON.stringify(response.data));
        apiData = Array.isArray(response.data) ? response.data : [];
      })
      .catch((error) => {
        console.log(error);
      });

    const selectedGovernorateId = parseInt(inputData.country);
    const selectedCityId = parseInt(inputData.state || inputData.city);

    let selectedGovernorate = null;
    let selectedCity = null;

    for (let i = 0; i < apiData.length; i++) {
      const country = apiData[i];
      const states = Array.isArray(country.states) ? country.states : [];

      for (let j = 0; j < states.length; j++) {
        const state = states[j];
        if (state.id === selectedGovernorateId) {
          selectedGovernorate = state;
          const cities = Array.isArray(state.cities) ? state.cities : [];
          selectedCity = cities.find((city) => city.id === selectedCityId) || null;
          break;
        }
      }

      if (selectedGovernorate) break;
    }

    for (let index = 0; index < hispeed.addresses.length; index++) {
      const element = hispeed.addresses[index];
      if (`${element.id}` === `${inputData.address_id}`) {
        if (selectedGovernorate) {
          element.country = `${selectedGovernorate.id}`;
          element.country_name_ar = selectedGovernorate.name_ar || element.country_name_ar;
          element.country_name_en = selectedGovernorate.name || selectedGovernorate.name_en || element.country_name_en;
        }

        if (selectedCity) {
          element.state = `${selectedCity.id}`;
          if (hispeed.language === 'ar') {
            element.state_name = selectedCity.name_ar || selectedCity.name || element.state_name;
          }
          else {
            element.state_name = selectedCity.name || selectedCity.name_en || selectedCity.name_ar || element.state_name;
          }
        }

        hispeed.markModified('addresses');
        await hispeed.save();
        break;
      }
    }

    const wellcomeData = {
      from: "00",
      to: inputData.phone_number,
      phone_number: inputData.phone_number,
      type: "address_option",
    };
    await sendToWhatsapp.sendToWhatsapp(wellcomeData);

  } else if (inputData.type === "choose_address") {
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });
    let addresses = [];

    for (let i = 0; i < hispeed.addresses.length; i++) {
      const address = hispeed.addresses[i];
      if (hispeed.language === 'ar') {
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
    if (hispeed.language === 'ar') {
      data.interactive = {
        type: "flow",
        body: {
          text: hispeed.status === 'delete_address' ? "قم بإختيار العنوان المراد حذفة" : "قم بإختيار العنوان",

        },
        action: {
          name: "flow",
          parameters: {
            // mode: "draft",
            mode: "published",
            flow_message_version: "3",
            flow_token: "2115546979299893",
            flow_id: "2115546979299893",
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
          text: hispeed.status === 'delete_address' ? "Select the address you want to delete" : "Choose a address",
        },
        action: {
          name: "flow",
          parameters: {
            // mode: "draft",
            mode: "published",
            flow_message_version: "3",
            flow_token: "889744984112081",
            flow_id: "889744984112081",
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
  } else if (inputData.type === "calculate_delivery_charge") {
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });

    const address = hispeed.addresses.find(addresses => addresses.id === hispeed.choosen_address);

    if (!address) {
      const wellcomeData = {
        from: "00",
        to: inputData.phone_number,
        phone_number: inputData.phone_number,
        content: hispeed.language === 'ar' ? "عفوا لا يوجد عنوان مختار" : "No selected address found",
        type: "text",
      };
      await sendToWhatsapp.sendToWhatsapp(wellcomeData);
      return;
    }

    let config2 = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://hispeed.om/api/whatsapp/shipping-locations',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    await axios.request(config2)
      .then(async (response) => {
        const locations = Array.isArray(response.data) ? response.data : [];
        const selectedStateId = parseInt(address.country);
        const selectedCityId = parseInt(address.state);

        let selectedState = null;
        let selectedCity = null;

        for (let i = 0; i < locations.length; i++) {
          const location = locations[i];
          const states = Array.isArray(location.states) ? location.states : [];

          selectedState = states.find((state) => state.id === selectedStateId) || null;
          if (selectedState) {
            const cities = Array.isArray(selectedState.cities) ? selectedState.cities : [];
            selectedCity = cities.find((city) => city.id === selectedCityId) || null;
            break;
          }
        }

        const chargeValue = selectedCity?.delivery_charge ?? selectedState?.delivery_charge ?? 0;
        const parsedCharge = Number.parseFloat(chargeValue);

        if (Number.isNaN(parsedCharge)) {
          const wellcomeData = {
            from: "00",
            to: inputData.phone_number,
            phone_number: inputData.phone_number,
            content: hispeed.language === 'ar' ? "تعذر احتساب تكلفة الشحن" : "Unable to calculate delivery charge",
            type: "text",
          };
          await sendToWhatsapp.sendToWhatsapp(wellcomeData);
          return;
        }

        if (selectedState || selectedCity) {
          hispeed.delivery_price = parsedCharge.toFixed(3);
          await hispeed.save();
          console.log("charge saved");

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
            content: hispeed.language === 'ar' ? "تعذر العثور على منطقة التوصيل المختارة" : "Selected delivery location not found",
            type: "text",
          };
          await sendToWhatsapp.sendToWhatsapp(wellcomeData);
        }
      })
      .catch((error) => {
        console.log(error);
      });

  } else if (inputData.type === "calculate_total_price") {
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });

    let total_price = 0;
    let text = "";

    if (hispeed.language === 'ar') {
      text += "إجمالى الأسعار \n";
      text += `سعر المنتجات : ${parseFloat(hispeed.total_price).toFixed(3)} ر.ع \n`;
      total_price += parseFloat(hispeed.total_price);
      text += `تكلفة الشحن : ${parseFloat(hispeed.delivery_price).toFixed(3)} ر.ع  \n`;
      total_price += parseFloat(hispeed.delivery_price);

      text += `التكلفة الإجمالية : ${parseFloat(total_price).toFixed(3)} ر.ع  \n`;

    }
    else {
      text += "Total prices \n";
      text += `Products price : ${parseFloat(hispeed.total_price).toFixed(3)} OMR \n`;
      total_price += parseFloat(hispeed.total_price);
      text += `Shipping cost : ${parseFloat(hispeed.delivery_price).toFixed(3)} OMR \n`;
      total_price += parseFloat(hispeed.delivery_price);
      text += `Total cost : ${parseFloat(total_price).toFixed(3)} OMR \n`;
    }

    hispeed.total = total_price;
    await hispeed.save();

    // const wellcomeData = {
    //   from: "00",
    //   to: inputData.phone_number,
    //   phone_number: inputData.phone_number,
    //   content: text,
    //   type: "text",
    // };
    // await sendToWhatsapp.sendToWhatsapp(wellcomeData);

    // const wellcomeData2 = {
    //   from: "00",
    //   to: inputData.phone_number,
    //   phone_number: inputData.phone_number,
    //   type: "Payment_test",
    // };
    // await sendToWhatsapp.sendToWhatsapp(wellcomeData2);

    data.type = "interactive";
    data.recipient_type = "individual";
    data.to = inputData.to;
    if (hispeed.language === 'ar') {
      data.interactive = {
        type: "button",
        body: {
          text: text,
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: {
                id: "1",
                title: "بطاقة الائتمان",
              },
            },
            {
              type: "reply",
              reply: {
                id: "2",
                title: "دفع عند الإستلام",
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
          text: text,
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: {
                id: "1",
                title: "Credit card",
              },
            },
            {
              type: "reply",
              reply: {
                id: "2",
                title: "Payment upon receipt",
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

  } else if (inputData.type === "Payment_test") {
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });
    let products = [];
    let address;


    for (let i = 0; i < hispeed.card.length; i++) {
      const item = hispeed.card[i];

      const itemm2 = {};
      console.log("bbbbbbbbbbbbb");
      itemm2['product_id'] = parseInt(item.meal_id);
      itemm2['quantity'] = item.quantity;
      itemm2['weight_id'] = 1;

      products.push(itemm2);

    }

    address = hispeed.addresses.find(addresses => addresses.id === hispeed.choosen_address);


    let data = {
      "billing_name": hispeed.name ? hispeed.name : inputData.phone_number,
      // "billing_email": address.email ? address.email : "",
      "billing_country": "Oman",
      "billing_state": parseInt(address.country),
      "billing_city": parseInt(address.state),
      // "billing_street_address": address.street ? address.street : "",
      "billing_zipcode": "12345",
      "order_source": "whatsapp",
      "Payment_Method": hispeed.payment_method == "online" ? "Thawani" : "CashOnDelivery",
      "cart_items": products
    };

    // console.log("meals", JSON.stringify(meals));
    // console.log("total_price", total_price);
    // console.log("total_price", data);
    console.log("products", JSON.stringify(products));

    console.log("data", JSON.stringify(data));


    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://hispeed.om/api/whatsapp/checkout',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Language': hispeed.language,
        'Authorization': `Bearer ${hispeed.token}`
      },
      data: data
    };
    console.log("config", JSON.stringify(config));


    await axios.request(config)
      .then(async (response) => {
        console.log(JSON.stringify(response.data));
        if (response.data.message == "Payment session created") {

          hispeed.order_id = response.data.order_number;
          hispeed.is_ordered = true;
          await hispeed.save();

          let url = response.data.url;
          url = url.split('/pay/')[1];
          console.log("url", url);

          const wellcomeData = {
            from: "00",
            to: inputData.phone_number,
            phone_number: inputData.phone_number,
            content: hispeed.language === "ar" ? "يرجى الانتظار قليلاً لإرسال رابط الدفع" : "Please wait a moment to receive the payment link",
            type: "text",
          };
          await sendToWhatsapp.sendToWhatsapp(wellcomeData);
          const wellcomeData2 = {
            from: "00",
            to: inputData.phone_number,
            phone_number: inputData.phone_number,
            price: hispeed.total.toFixed(3),
            url: url,
            type: "Tpayment_url",
          };
          await sendToWhatsapp.sendToWhatsapp(wellcomeData2);

        } else if (response.data.message == "Order created successfully") {

          hispeed.order_id = response.data.order_number;
          hispeed.is_ordered = true;
          await hispeed.save();

          const wellcomeData = {
            from: "00",
            to: inputData.phone_number,
            phone_number: inputData.phone_number,
            filename: "invoice.pdf",
            link: response.data.invoice_pdf_url,
            content: hispeed.language === "ar" ? "تم إنشاء الطلب بنجاح \n رقم الطلب: " + response.data.order_number : "Order created successfully" + response.data.order_number,
            type: "pdf",
          };
          await sendToWhatsapp.sendToWhatsapp(wellcomeData);
        } else {
          console.log("error");
        }

      })
      .catch(async (error) => {
        console.log("error", error);
      });


  } else if (inputData.type === "Tpayment_url") {
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });
    let components = [];
    data.type = "template";
    data.recipient_type = "individual";
    data.to = inputData.to;

    data.template = {
      name: "flow_payment",
      language: {
        code: hispeed.language == "ar" ? "ar" : "en",
      },
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: `${inputData.price}`,
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
  } else if (inputData.type === "show_items") {
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });

    let myItems = [];

    for (let i = 0; i < hispeed.card.length; i++) {
      const item = hispeed.card[i];
      const newRow = {
        id: `${item.id}`,
        title: item.meal_name,
      };
      myItems.push(newRow);
    }


    console.log(myItems);

    if (myItems.length == 0) {
      if (hispeed.language === 'ar') {
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
      if (hispeed.language === 'ar') {
        data.interactive = {
          type: "flow",
          body: {
            text: hispeed.status === 'delete_item' ? "قم بإختيار المنتج الذى تريد حذفة" : "قم بإختيار المنتج"
          },
          action: {
            name: "flow",
            parameters: {
              // mode: "draft",
              mode: "published",
              flow_message_version: "3",
              flow_token: "1706657406987002",
              flow_id: "1706657406987002",
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
            text: hispeed.status === 'delete_item' ? "Select the product you want to delete" : "Select the product"
          },
          action: {
            name: "flow",
            parameters: {
              // mode: "draft",
              mode: "published",
              flow_message_version: "3",
              flow_token: "1980135359254535",
              flow_id: "1980135359254535",
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
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });
    let deleted = false;

    for (let i = 0; i < hispeed.card.length; i++) {
      const item = hispeed.card[i];
      if (item.id === parseInt(inputData.choosen_item)) {
        hispeed.card.splice(hispeed.card.indexOf(item), 1);

        deleted = true;
        hispeed.items_length--;
        await hispeed.save();
        break;
      }
    }


    if (deleted == true) {
      if (hispeed.language === 'ar') {
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

  } else if (inputData.type === "default_address") {
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });

    hispeed.status = "address";
    hispeed.choosen_address = hispeed.addresses[0].id;
    await hispeed.save();

    const address = hispeed.addresses[0];
    const address_text = hispeed.language === 'ar' ?
      `المحافظة : ${address.country_name_ar}  \n الولاية : ${address.state_name} \n ${address.street ? `شارع : ${address.street} \n` : ''}` :
      `Governorate: ${address.country_name_en} \n State: ${address.state_name} \n ${address.street ? `Street: ${address.street} \n` : ''}`;

    data.type = "interactive";
    data.recipient_type = "individual";
    data.to = inputData.to;
    if (hispeed.language === 'ar') {
      data.interactive = {
        type: "button",
        body: {
          text: "عنوان التوصيل \n" + address_text,
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: {
                id: "1",
                title: "العنوان صحيح ؟",
              },
            },
            {
              type: "reply",
              reply: {
                id: "2",
                title: "تعديل العنوان",
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
          text: "Delivery address \n" + address_text,
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: {
                id: "1",
                title: "Address is correct ?",
              },
            },
            {
              type: "reply",
              reply: {
                id: "2",
                title: "Edit address",
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
  } else if (inputData.type === "active") {
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });

    data.type = "interactive";
    data.recipient_type = "individual";
    data.to = inputData.to;
    if (hispeed.language === 'ar') {
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
  } else if (inputData.type === "upload_pdf") {

    const forwardType = inputData.forward_type || (inputData.booking_id ? "flow_pdf" : "payment_pdf_template");

    try {
      const fileResponse = await axios.get(inputData.link, {
        responseType: "stream",
        maxRedirects: 5,
        timeout: 20000,
      });

      const form = new FormData();
      form.append("file", fileResponse.data, {
        filename: "file.pdf",
        contentType: "application/pdf",
      });
      form.append("type", "application/pdf");
      form.append("messaging_product", "whatsapp");

      const upload = await axios.post(
        `https://graph.facebook.com/v24.0/${WHATSAPP_PHONE_NUMBER_ID}/media`,
        form,
        {
          headers: {
            Authorization: `Bearer ${WHATSAPP_TOKEN}`,
            ...form.getHeaders(),
          },
        }
      );

      if (!upload?.data?.id) {
        throw new Error("Failed to upload media to WhatsApp");
      }

      const wellcomeData3 = {
        from: "00",
        to: inputData.phone_number,
        phone_number: inputData.phone_number,
        filename: inputData.filename || "Invoice.pdf",
        link: upload.data.id,
        booking_id: inputData.booking_id,
        price: inputData.price,
        url: inputData.url,
        language: inputData.language,
        created_by: inputData.created_by,
        type: forwardType,
      };

      await sendToWhatsapp.sendToWhatsapp(wellcomeData3);
    } catch (err) {
      console.error(err.response?.data || err.message);

      const fallbackData = {
        from: "00",
        to: inputData.phone_number,
        phone_number: inputData.phone_number,
        filename: inputData.filename || "Invoice.pdf",
        link: inputData.link,
        booking_id: inputData.booking_id,
        price: inputData.price,
        url: inputData.url,
        language: inputData.language,
        created_by: inputData.created_by,
        type: forwardType,
      };

      await sendToWhatsapp.sendToWhatsapp(fallbackData);
    }

  } else if (inputData.type === "flow_pdf") {
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });
    let language = "ar";
    if (hispeed && hispeed.language !== 'ar') {
      language = 'en';
    }

    let components = [];
    data.type = "template";
    data.recipient_type = "individual";
    data.to = inputData.to;

    data.template = {
      name: "flow_pdf",
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
  }






  else if (inputData.type === "save_cataloge_items") {
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });
    let branch_meals;
    let added = 0;
    let quantity = 0;


    let config2 = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://hispeed.om/api/whatsapp/products?category=${hispeed.category_id}&per_page=999`,
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

        if (hispeed.language === 'en') {
          item_id = item.product_retailer_id.slice(0, -3);
        } else {
          item_id = item.product_retailer_id;
        }

        if (parseInt(item_id) === meal.id) {
          const existingItem = hispeed.card.find(cardItem => cardItem.meal_id === meal.id.toString());

          if (existingItem) {
            console.log("Item exists in card");
            console.log(existingItem);

            existingItem.quantity += parseInt(item.quantity);
            hispeed.markModified('card');
          } else {
            console.log("Item does not exist in card");
            console.log(item.quantity);
            let cardItem;
            if (hispeed.language === 'ar') {
              cardItem = {
                id: hispeed.items_counter + 1,
                meal_id: `${meal.id}`,
                quantity: parseInt(item.quantity),
                meal_name: `${meal.fr_Product_Name}`,
                meal_price: `${meal.Discount_Price}`
              };
            } else {
              cardItem = {
                id: hispeed.items_counter + 1,
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
            hispeed.card.push(cardItem);
            hispeed.items_counter++;
            hispeed.items_length++;

          }

        }
      }
    }

    try {
      await hispeed.save();
      console.log("hispeed order saved successfully.");
    } catch (error) {
      console.error("Error saving hispeed order:", error);
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





  } else if (inputData.type === "call_card") {
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });
    hispeed.status = "choose_items",
      await hispeed.save();

    data.type = "template";
    data.recipient_type = "individual";
    data.to = inputData.to;
    data.template = {
      name: hispeed.language === 'ar' ? "flow_show_categeries2" : "flow_show_categeries",
      language: {
        code: hispeed.language === 'ar' ? "ar" : "en_us",
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
  } else if (inputData.type === "show_product_options") {
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });
    let apiData = [];
    let weights = [];
    let sizes = [];

    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://hispeed.om/api/whatsapp/products/${inputData.product_id}`,
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

        if (hispeed.language === 'ar') {
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

        if (hispeed.language === 'ar') {
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
      if (hispeed.language === 'ar') {
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
      if (hispeed.language === 'ar') {
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
      if (hispeed.language === 'ar') {
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
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });

    // Fetch sizes data from API
    let apiData;
    try {
      const response = await axios.get(`https://hispeed.om/api/whatsapp/products/${inputData.product_id}`);
      apiData = response.data.data.sizes;
    } catch (error) {
      console.log(error);
      return;
    }

    // Find the selected size
    const selectedSize = apiData.find(size => size.Size_Id == parseInt(inputData.option_id));
    if (!selectedSize) return;

    // Find the corresponding item in the init_card
    const item = hispeed.init_card.find(cardItem => cardItem.meal_id === inputData.product_id);
    if (!item) return;

    // Update the meal price and add the selected size
    item.meal_price += parseFloat(selectedSize.price || 0);
    item.meal_weight += parseFloat(selectedSize.weight || 0);
    item.size.push(selectedSize);

    // Check if the item with the same size already exists in the card
    const existingItem = hispeed.card.find(cardItem => cardItem.meal_id === item.meal_id && cardItem.size[0].Size_Id == selectedSize.Size_Id);

    if (existingItem) {
      existingItem.quantity += parseInt(item.quantity);
      hispeed.markModified('card');
    } else {
      hispeed.card.push(item);
    }

    // Remove item from init_card and update counter
    hispeed.init_card = hispeed.init_card.filter(cardItem => cardItem !== item);
    hispeed.init_card_counter--;
    hispeed.same_card++;
    await hispeed.save();

    // Send appropriate response based on init_card_counter
    const wellcomeData = {
      from: "00",
      to: inputData.phone_number,
      phone_number: inputData.phone_number,
      type: hispeed.init_card_counter === 0 ? "show_card" : "text",
      content: hispeed.init_card_counter === 0 ? null : (
        hispeed.language === 'ar' ?
          "يرجى إنهاء كل الإختيارات لإستكمال الخطوة التالية" :
          "Please complete all selections to complete the next step."
      ),
    };
    await sendToWhatsapp.sendToWhatsapp(wellcomeData);
  } else if (inputData.type === "save_weight") {
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });

    // Fetch weights data from API
    let apiData;
    try {
      const response = await axios.get(`https://hispeed.om/api/whatsapp/products/${inputData.product_id}`);
      apiData = response.data.data.weights;
    } catch (error) {
      console.log(error);
      return;
    }

    // Find the selected weight
    const selectedWeight = apiData.find(weight => weight.id == parseInt(inputData.weight_id));
    if (!selectedWeight) return;

    // Find the corresponding item in the init_card
    const item = hispeed.init_card.find(cardItem => cardItem.meal_id === inputData.product_id);
    if (!item) return;

    // Update the meal price and add the selected weight
    item.meal_price = parseFloat(selectedWeight.price || 0);
    item.meal_weight = parseFloat(selectedWeight.weight || 0);
    item.weight.push(selectedWeight);

    // Check if the item with the same weight already exists in the card
    const existingItem = hispeed.card.find(cardItem => cardItem.meal_id === item.meal_id && cardItem.weight[0].id == selectedWeight.id);

    if (existingItem) {
      existingItem.quantity += parseInt(item.quantity);
      hispeed.markModified('card');
    } else {
      hispeed.card.push(item);
    }

    // Remove item from init_card and update counter
    hispeed.init_card = hispeed.init_card.filter(cardItem => cardItem !== item);
    hispeed.init_card_counter--;
    hispeed.same_card++;
    await hispeed.save();

    // Send appropriate response based on init_card_counter
    const wellcomeData = {
      from: "00",
      to: inputData.phone_number,
      phone_number: inputData.phone_number,
      type: hispeed.init_card_counter === 0 ? "show_card" : "text",
      content: hispeed.init_card_counter === 0 ? null : (
        hispeed.language === 'ar' ?
          "يرجى إنهاء كل الإختيارات لإستكمال الخطوة التالية" :
          "Please complete all selections to complete the next step."
      ),
    };
    await sendToWhatsapp.sendToWhatsapp(wellcomeData);
  } else if (inputData.type === "save_size_weight") {
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });
    let apiData;

    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://hispeed.om/api/whatsapp/products/${inputData.product_id}`,
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
      const item = hispeed.init_card.find(cardItem => cardItem.meal_id === inputData.product_id);

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
      const existingItem = hispeed.card.find(cardItem =>
        cardItem.meal_id === item.meal_id &&
        cardItem.size[0].Size_Id == selectedSize.Size_Id &&
        cardItem.weight[0].id == selectedWeight.id
      );

      if (existingItem) {
        console.log("Item exists in card");
        existingItem.quantity += parseInt(item.quantity);
        hispeed.markModified('card');
      } else {
        console.log("Item does not exist in card");
        hispeed.card.push(item);
      }

      hispeed.init_card.splice(hispeed.init_card.indexOf(item), 1);
      hispeed.init_card_counter--;
      hispeed.same_card++;
      await hispeed.save();
    }

    if (hispeed.init_card_counter == 0) {
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
        content: hispeed.language === 'ar' ?
          "يرجى إنهاء كل الإختيارات لإستكمال الخطوة التالية" :
          "Please complete all selections to complete the next step.",
        type: "text",
      };
      await sendToWhatsapp.sendToWhatsapp(wellcomeData);
    }
  } else if (inputData.type === "show_offer_meals") {
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });

    let branch_meals = [];
    let product_items = [];
    let category_name;


    let config2 = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://hispeed.om/api/whatsapp/products-with-discount?scope=mini',
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

    if (hispeed.language === 'ar') {
      category_name = "العروض";
    } else {
      category_name = "Offers";
    }

    for (let i = 0; i < branch_meals.length; i++) {
      const meal = branch_meals[i];
      if (hispeed.language === 'ar') {
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
      if (hispeed.language === 'ar') {
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

      hispeed.status = "choose_items";
      await hispeed.save();

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
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });

    const address = hispeed.addresses.find(addresses => addresses.id === hispeed.choosen_address);;

    const FormData = require('form-data');
    let data = new FormData();
    data.append('subtotal', hispeed.total_price);
    data.append('country', address.country_name_en);

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://hispeed.om/api/whatsapp/calculate-tax',
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
          hispeed.tax = response.data.tax_amount;
          await hispeed.save();
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
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });
    let subcategories = [];
    let apiData = [];

    let config2 = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://hispeed.om/api/whatsapp/subcategories/${inputData.category_id}`,
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
      if (hispeed.language === 'ar') {
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
      if (hispeed.language === 'ar') {
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
      if (hispeed.language === 'ar') {
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
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });

    data.type = "interactive";
    data.recipient_type = "individual";
    data.to = inputData.to;
    if (hispeed.language === 'ar') {
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
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });

    let myItems = [];

    for (let i = 0; i < hispeed.card.length; i++) {
      const item = hispeed.card[i];
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
      if (hispeed.language === 'ar') {
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
      if (hispeed.language === 'ar') {
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
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });
    let additions = [];
    let apiData = [];
    let item_label = "";

    let config2 = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://hispeed.om/api/whatsapp/products/${inputData.choosen_item}`,
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

    const item = hispeed.card.find(cardItem => cardItem.meal_id === inputData.choosen_item && cardItem.additions.length == 0);


    if (hispeed.language === 'ar') {
      item_label = apiData.fr_Product_Name;
    }
    else {
      item_label = apiData.en_Product_Name;
    }
    for (let i = 0; i < apiData.additions.length; i++) {
      const addition = apiData.additions[i];
      if (hispeed.language === 'ar') {
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
      if (hispeed.language === 'ar') {
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
      if (hispeed.language === 'ar') {
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
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });

    const item = hispeed.card.find(cardItem => cardItem.id === parseInt(inputData.choosen_item));
    if (!item) return;

    let apiData;
    let dataPush = [];
    let item_price = 0;

    try {
      const response = await axios.get(`https://hispeed.om/api/whatsapp/products/${parseInt(item.meal_id)}`);
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
            addition_name: hispeed.language === 'ar' ? apiData[m].name_ar : apiData[m].name || apiData[m].name_ar,
            addition_price: apiData[m].price,
          };
          dataPush.push(newRow);
        }
      }
    }

    item.meal_price += parseFloat(item_price || 0);
    item.additions_price += parseFloat(item_price || 0);
    item.additions = dataPush;
    hispeed.markModified('card');

    try {
      await hispeed.save();
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
        content: hispeed.language === 'ar' ?
          "حدث خطأ أثناء حفظ البيانات. يرجى المحاولة مرة أخرى." :
          "An error occurred while saving your data. Please try again.",
      };
      await sendToWhatsapp.sendToWhatsapp(errorData);
    }
  } else if (inputData.type === "start_service_template") {
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });
    let components = [];

    data.type = "template";
    data.recipient_type = "individual";
    data.to = inputData.to;

    if (hispeed.language === 'ar') {
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
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });

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


    if (hispeed.language === 'ar') {
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
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });

    let components = [];
    data.type = "template";
    data.recipient_type = "individual";
    data.to = inputData.to;

    data.template = {
      name: "flow_change_status_delivered2",
      language: {
        code: hispeed.language === 'ar' ? "ar" : "en",
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
  } else if (inputData.type === "payment_pdf_template") {
    // let hispeed = await OrderID.findOne({ from: inputData.phone_number });

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
              document: buildWhatsappDocumentPayload(inputData)

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
    let hispeed = await OrderID.findOne({ from: inputData.phone_number });
    let language = "ar";
    if (hispeed && hispeed.language !== 'ar') {
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


  return true;


};
