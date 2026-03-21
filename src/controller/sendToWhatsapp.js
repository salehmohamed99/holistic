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
    console.log("Payload:", JSON.stringify(data, null, 2));
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

  else if (inputData.type === "flow_pdf") {
    data.type = "template";
    data.recipient_type = "individual";
    data.to = inputData.to;

    data.template = {
      name: "hello_world",
      language: {
        code: "en_US",
      },
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
  } else if (inputData.type === "start_service") {

    data.type = "interactive";
    data.recipient_type = "individual";
    data.to = inputData.to;
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
              title: "تبرع",
            },
          },
          {
            type: "reply",
            reply: {
              id: "1",
              title: "خدمة المتبرعين",
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
  } else if (inputData.type === "show_categories") {

    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://zakatshinas.org.om/api/donations?scope=mini',
      headers: {
        'Accept': 'application/json',
      }
    };

    let dataArray;
    const categories = [];

    await axios.request(config)
      .then((response) => {
        console.log(JSON.stringify(response.data));
        dataArray = response.data.services;
      })
      .catch((error) => {
        console.log(error);
      });

    async function convertImageToBase64(imageUrl) {
      try {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const maxSizeInBytes = 50 * 1024;

        let imageBuffer = Buffer.from(response.data, 'binary');

        // If image exceeds 300 KB, resize or compress it
        if (imageBuffer.length > maxSizeInBytes) {
          // Resize the image to a maximum of 200x250 pixels
          imageBuffer = await sharp(imageBuffer)
            .resize(200, 250, { fit: 'inside' })
            .toBuffer();
        }

        // Convert to base64
        return imageBuffer.toString('base64');
      } catch (error) {
        console.error('Error converting image to base64:', error);
        throw error;
      }
    }



    for (let i = 0; i < dataArray.length; i++) {
      const item = dataArray[i];
      const base64Image = await convertImageToBase64(item.img_url);
      const newRow = {
        id: `${item.id}`,
        title: item.title,
        description: item.description ? item.description : "",
        image: base64Image
      };
      categories.push(newRow);
    }

    let config2 = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://zakatshinas.org.om/api/donations/alkfaratMa9O`,
      headers: {
        'Accept': 'application/json',
      }
    };

    let children;
    const issues = [];
    // let title;

    await axios.request(config2)
      .then((response) => {
        // console.log(JSON.stringify(response.data));
        children = response.data.service.children;
        // title = response.data.service.title;
      })
      .catch((error) => {
        console.log(error);
      });

    if (children || Array.isArray(children)) {
      for (let i = 0; i < children.length; i++) {
        const item = children[i];
        // const base64Image = await convertImageToBase64(item.thumb);
        const newRow = {
          id: `${item.id}`,
          title: item.title,
          description: `${item.description} \n القيمة : ${item.amount_total} ر.ع`,

          // image: base64Image,
        };
        issues.push(newRow);
      }
    }


    console.log("issues", issues);


    data.type = "interactive";
    data.recipient_type = "individual";
    data.to = inputData.to;

    data.interactive = {
      type: "flow",
      body: {
        text: "قم بإختيار برنامج التبرع",
      },
      action: {
        name: "flow",
        parameters: {
          // mode: "draft",
          mode: "published",
          flow_message_version: "3",
          flow_token: "1913030049295042",
          flow_id: "1913030049295042",
          flow_cta: "البرامج",
          flow_action: "navigate",
          flow_action_payload: {
            screen: "show_categories",
            data: {
              categories: categories,
              issues: issues,
            },
          },

        },
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
  } else if (inputData.type === "complete_data") {
    let shinas = await OrderID.findOne({ from: inputData.phone_number });

    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://zakatshinas.org.om/api/donations',
      headers: {
        'Accept': 'application/json',
      }
    };

    let foundItem;

    await axios.request(config)
      .then((response) => {
        // console.log(JSON.stringify(response.data));
        foundItem = response.data.services.find(item => item.id === parseInt(inputData.category_id));
      })
      .catch((error) => {
        console.log(error);
      });



    if (foundItem) {
      shinas.issue_name = foundItem.title;
      await shinas.save();
      if (foundItem.has_children === false) {
        if (foundItem.id === 28) {
          const wellcomeData2 = {
            from: "00",
            to: inputData.to,
            phone_number: inputData.to,
            name: inputData.name,
            type: "complete_data_gift",
          };
          await sendToWhatsapp.sendToWhatsapp(wellcomeData2);
        } else {
          data.type = "interactive";
          data.recipient_type = "individual";
          data.to = inputData.to;

          data.interactive = {
            type: "flow",
            body: {
              text: "قم بإكمال بيانات التبرع",
            },
            action: {
              name: "flow",
              parameters: {
                // mode: "draft",
                mode: "published",
                flow_message_version: "3",
                flow_token: "2129485467870341",
                flow_id: "2129485467870341",
                flow_cta: "تبرع",
                flow_action: "navigate",
                flow_action_payload: {
                  screen: "complete_data",
                  data: {
                    default_phone: inputData.to,
                    title: `برنامج ${foundItem.title}`
                  },
                },
              },
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
        }

      } else if (inputData.issue_id) {
        const wellcomeData2 = {
          from: "00",
          to: inputData.to,
          phone_number: inputData.to,
          slug: foundItem.slug,
          issue_id: inputData.issue_id,
          type: "issue_details",
        };
        await sendToWhatsapp.sendToWhatsapp(wellcomeData2);
      }
    }


  } else if (inputData.type === "complete_data_gift") {

    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://zakatshinas.org.om/api/donations/alhdyBN8o',
      headers: {
        'Accept': 'application/json',
      }
    };


    let gift_type = [];
    let gift_scope = [];

    let data_type;
    let data_categories;

    await axios.request(config)
      .then((response) => {
        // console.log(JSON.stringify(response.data));
        data_type = response.data.gift_types;
        data_categories = response.data.donation_categories;
      })
      .catch((error) => {
        console.log(error);
      });

    for (let i = 0; i < data_type.length; i++) {
      const item = data_type[i];
      const newRow = {
        id: `${item.id}`,
        title: item.title,
      };
      gift_type.push(newRow);
    }

    for (let i = 0; i < data_categories.length; i++) {
      const item = data_categories[i];
      const newRow = {
        id: `${item.id}`,
        title: item.title,

      };
      gift_scope.push(newRow);
    }



    data.type = "interactive";
    data.recipient_type = "individual";
    data.to = inputData.to;

    data.interactive = {
      type: "flow",
      body: {
        text: "قم بإكمال بيانات التبرع",
      },
      action: {
        name: "flow",
        parameters: {
          // mode: "draft",
          mode: "published",
          flow_message_version: "3",
          flow_token: "1207821791525394",
          flow_id: "1207821791525394",
          flow_cta: "تبرع",
          flow_action: "navigate",
          flow_action_payload: {
            screen: "complete_data",
            data: {
              phone_sender: inputData.to,
              name_sender: inputData.name,
              gift_type,
              gift_scope
            },
          },
        },
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


  } else if (inputData.type === "issue_details") {
    let shinas = await OrderID.findOne({ from: inputData.phone_number });

    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://zakatshinas.org.om/api/donations/${inputData.slug}`,
      headers: {
        'Accept': 'application/json',
      }
    };

    let foundItem;

    await axios.request(config)
      .then((response) => {
        foundItem = response.data.service.children.find(item => item.id === parseInt(inputData.issue_id));
      })
      .catch((error) => {
        console.log(error);
      });

    shinas.issue_name = foundItem.title;
    await shinas.save();

    data.type = "interactive";
    data.recipient_type = "individual";
    data.to = inputData.to;

    data.interactive = {
      type: "flow",
      body: {
        text: "قم بإكمال بيانات التبرع",
      },
      action: {
        name: "flow",
        parameters: {
          // mode: "draft",
          mode: "published",
          flow_message_version: "3",
          flow_token: "2129485467870341",
          flow_id: "2129485467870341",
          flow_cta: "تبرع",
          flow_action: "navigate",
          flow_action_payload: {
            screen: "complete_data",
            data: {
              default_phone: inputData.to,
              title: foundItem.title,
              amount: parseInt(foundItem.amount_total)
            },
          },
        },
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
  } else if (inputData.type === "checkout") {
    let shinas = await OrderID.findOne({ from: inputData.phone_number });

    let data = JSON.stringify({
      "paid_from": "whatsapp",
      "amount": inputData.amount,
      "service_id": shinas.issue_id ? shinas.issue_id : shinas.category_id,
      "phone_sender": inputData.phone.slice(-8),
    });

    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://zakatshinas.org.om/api/checkout',
      headers: {
        'Content-Type': 'application/json',
      },
      data: data
    };


    await axios.request(config)
      .then(async (response) => {
        console.log(JSON.stringify(response.data));

        let url = response.data.url;

        const livePrefix = "https://checkout.thawani.om/pay/";
        const uatPrefix = "https://uatcheckout.thawani.om/pay/";
        let type;

        if (url.startsWith(livePrefix)) {
          url = url.slice(livePrefix.length);
          type = "payment_template_live";
        } else if (url.startsWith(uatPrefix)) {
          url = url.slice(uatPrefix.length);
        }

        const wellcomeData2 = {
          from: "00",
          to: inputData.to,
          phone_number: inputData.to,
          price: inputData.amount,
          url,
          issue_name: shinas.issue_name,
          type,
        };
        await sendToWhatsapp.sendToWhatsapp(wellcomeData2);
      })
      .catch((error) => {
        console.log(error);
      });


  } else if (inputData.type === "checkout_gift") {
    let shinas = await OrderID.findOne({ from: inputData.phone_number });

    let data = JSON.stringify({
      "paid_from": "whatsapp",
      "form_type": "gift",
      "amount": inputData.amount,
      "service_id": shinas.issue_id ? shinas.issue_id : shinas.category_id,
      "phone_sender": inputData.phone_sender.slice(-8) ? inputData.phone_sender.slice(-8) : inputData.phone_number.slice(-8),
      "name_sender": inputData.name_sender ? inputData.name_sender : "defalut",
      "phone_receiver": inputData.phone_receiver.slice(-8),
      "name_receiver": inputData.name_receiver ? inputData.name_receiver : 'defalut',
      "gift_type": inputData.gift_type,
      "gift_cat": inputData.gift_scope,
    });


    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://zakatshinas.org.om/api/checkout',
      headers: {
        'Content-Type': 'application/json',
      },
      data: data
    };


    await axios.request(config)
      .then(async (response) => {
        console.log(JSON.stringify(response.data));

        let url = response.data.url;

        const livePrefix = "https://checkout.thawani.om/pay/";
        const uatPrefix = "https://uatcheckout.thawani.om/pay/";
        let type;

        if (url.startsWith(livePrefix)) {
          url = url.slice(livePrefix.length);
          type = "payment_template_live";
        } else if (url.startsWith(uatPrefix)) {
          url = url.slice(uatPrefix.length);
        }

        const wellcomeData2 = {
          from: "00",
          to: inputData.to,
          phone_number: inputData.to,
          price: inputData.amount,
          url,
          issue_name: shinas.issue_name,
          type,
        };
        await sendToWhatsapp.sendToWhatsapp(wellcomeData2);
      })
      .catch((error) => {
        console.log(error);
      });


  } else if (inputData.type === "payment_template_live") {
    let components = [];
    data.type = "template";
    data.recipient_type = "individual";
    data.to = inputData.to;

    data.template = {
      name: "flow_payment_url",
      language: {
        code: "ar",
      },
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: inputData.price,
            },
            {
              type: "text",
              text: inputData.issue_name,
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
  } else if (inputData.type === "after_payment_template") {
    let components = [];
    data.type = "template";
    data.recipient_type = "individual";
    data.to = inputData.to;

    data.template = {
      name: "flow_after_payment",
      language: {
        code: "ar",
      },
      components: [
        {
          type: "header",
          parameters: [
            {
              type: "image",
              image: {
                link: "https://cdn.glitch.global/83d0e69a-7b6a-47a5-ab94-b219e6e57d25/%D8%B4%D8%B9%D8%A7%D8%B1%20%D9%84%D8%AC%D9%86%D8%A9%20%D9%86%D8%AE%D9%84%20%D9%84%D9%84%D8%B2%D9%83%D8%A7%D8%A9%20%D9%88%D8%A7%D9%84%D8%B5%D8%AF%D9%82%D8%A7%D8%AA.png?v=1749549898147",
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
  } else if (inputData.type === "active") {

    data.type = "interactive";
    data.recipient_type = "individual";
    data.to = inputData.to;
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
  }

  // usage


  return true;


};
