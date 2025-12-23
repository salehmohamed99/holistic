const Orders = require("../models/ordersModel");
const axios = require("axios").default;
const axiosHelper = require("../helpers/axiosHelper");
const messageController = require("./messageController"),
  sendToWhatsapp = require("./sendToWhatsapp");
const OrderID = require("../models/OrderIDModel");
var easyinvoice = require("easyinvoice");
const fs = require("fs");

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const THAWANI_SECRET_KEY = process.env.THAWANI_SECRET_KEY;
const THAWANI_PUBLISHABLE_KEY = process.env.THAWANI_PUBLISHABLE_KEY;

exports.createThawaniSession = async (
  client_reference_id,
  metadata,
  user_phone_number
) => {
  const existingOrder = await OrderID.findOne({ from: user_phone_number });
  let order = await Orders.findOne({ wa_msg_id: existingOrder.wa_msg_id });
  let products = [];
  for (let i = 0; i < order.product_items.length; i++) {
    const e = order.product_items[i];
    products.push({
      name: `Product:${e.product_retailer_id}`,
      quantity: e.quantity,
      unit_amount: e.item_price * 1000,
    });
  }

  if (parseFloat(order.delivery) !== 0) {
    products.push({
      name: "Delivery Cost",
      quantity: 1,
      unit_amount: parseFloat(order.delivery) * 1000,
    });
  }
  const options = {
    method: "POST",
    url: "https://uatcheckout.thawani.om/api/v1/checkout/session",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "thawani-api-key": THAWANI_SECRET_KEY,
    },
    data: {
      client_reference_id: client_reference_id,
      mode: "payment",
      products: products,
      success_url: `https://smart-tech-api.glitch.me/api/v1/thawani/success?client_reference_id=${client_reference_id}`,
      cancel_url: `https://smart-tech-api.glitch.me/api/v1/thawani/cancel?client_reference_id=${client_reference_id}`,
      metadata: metadata,
    },
  };

  try {
    const data = await axios.request(options);
    console.log(data, "Reeeeeeeeeeeeeeeeeeeeeeeeeeees");

    const res = data.data;
    if (res.success == true && res.code == 2004) {
      const paymentUrl = `https://uatcheckout.thawani.om/pay/${res.data.session_id}?key=${THAWANI_PUBLISHABLE_KEY}`;
      const templateUrtl = `${res.data.session_id}?key=${THAWANI_PUBLISHABLE_KEY}`;
      order.isSessionOpen = true;
      order.session_id = res.data.session_id;
      order.paymentStatus = res.data.payment_status;
      order.paymentUrl = paymentUrl;
      await order.save();

      const msg = `يرجى الدفع عن طريق بوابة ثواني من خلال الرابط التالي:
      
      ${paymentUrl}`;
      // const wellcomeData = {
      //   from: adminId,
      //   to: user,
      //   phone_number: user_phone_number,
      //   content: msg,
      //   // parentMsg: wa_msg_id,
      //   type: "text",
      // };
      // messageController.sendToWhatsapp(wellcomeData);

      const wellcomeData = {
        from: "00",
        to: user_phone_number,
        phone_number: user_phone_number,
        content: "يرجى الانتظار قليلا الى حين تجهيز رابط الدفع",
        // parentMsg: wa_msg_id,
        type: "text",
      };
      await sendToWhatsapp.sendToWhatsapp(wellcomeData);

      let allPrice = order.totalPrice + order.delivery;

      const paymentUrlTemplate = {
        from: "00",
        to: user_phone_number,
        phone_number: user_phone_number,
        content: templateUrtl,
        price: `${allPrice.toFixed(3)} ريال`,
        // parentMsg: wa_msg_id,
        type: "Tpayment_url",
      };
      sendToWhatsapp.sendToWhatsapp(paymentUrlTemplate);
    }
  } catch (error) {
    console.error(error);
  }
};

exports.getSuccessPayment = async (req, res) => {
  let response = {
    statusCode: 200,
    body: null,
  };
  const client_reference_id = req.query.client_reference_id;
  const order = await Orders.findOne({ wa_msg_id: client_reference_id });

  const options = {
    method: "GET",
    url: `https://uatcheckout.thawani.om/api/v1/checkout/reference/${client_reference_id}`,
    headers: {
      Accept: "application/json",
      "thawani-api-key": THAWANI_SECRET_KEY,
    },
  };

  try {
    const data = await axios.request(options);
    console.log(data, " Reeeeeeeeeeeeeeeeeeeeeess");
    const res = data.data;
    if (
      res.success == true &&
      res.code == 2000 &&
      // res.data.payment_status == "paid" &&
      order.isPaid == false
    ) {
      let pdfProducts = [];
      for (let i = 0; i < res.data.products.length; i++) {
        const e = res.data.products[i];
        pdfProducts.push({
          description: e.name,
          quantity: e.quantity,
          price: e.unit_amount,
          "tax-rate": 0,
        });
      }
      var creatPdf = {
        // Customize enables you to provide your own templates
        // Please review the documentation for instructions and examples
        customize: {
          //  "template": fs.readFileSync('template.html', 'base64') // Must be base64 encoded html
        },
        // images: {
        //   // The logo on top of your invoice
        //   logo: "https://public.easyinvoice.cloud/img/logo_en_original.png",
        //   // The invoice background
        //   background: "https://public.easyinvoice.cloud/img/watermark-draft.jpg",
        // },
        // Your own data
        sender: {
          company: "Taresh",
          // address: "Sample Street 123",
          // zip: "1234 AB",
          // city: "Sampletown",
          // country: "Samplecountry",
          //"custom1": "custom value 1",
          //"custom2": "custom value 2",
          //"custom3": "custom value 3"
        },
        // Your recipient
        client: {
          company: order.from,
          // address: "Clientstreet 456",
          // zip: "4567 CD",
          // city: "Clientcity",
          // country: "Clientcountry",
          // "custom1": "custom value 1",
          // "custom2": "custom value 2",
          // "custom3": "custom value 3"
        },
        information: {
          // Invoice number
          number: order.from,
          // Invoice data
          date: Date.now(),
        },
        products: pdfProducts,
        // The message you would like to display on the bottom of your invoice
        "bottom-notice": "نشكرك على تعاملك معنا",
        // Settings to customize your invoice
        settings: {
          currency: "OMR", // See documentation 'Locales and Currency' for more info. Leave empty for no currency.
        },
      };

      const result = await easyinvoice.createInvoice(creatPdf);
      // order.totalPrice = totalPrice;
      order.paymentStatus = res.data.payment_status;
      order.isPaid = true;
      order.invoicePdf = result.pdf;
      await order.save();

      // const wellcomeData = {
      //   from: adminId,
      //   to: user,
      //   phone_number: user.phone_number,
      //   content: `تم الدفع بنجاح
      //     لقد قمت بشراء ${res.data.products.length} منتجات بنجاح
      //     اجمال المبلغ المدفوع ${order.totalPrice} ريال عماني
      //     نشكرك على تعاملك مع
      //     Muscat Apps`,
      //   parentMsg: order.wa_msg_id,
      //   type: "text",
      // };

      const wellcomeData = {
        from: "00",
        to: order.from,
        phone_number: order.from,
        content: `شكرا لتعاملك معنا`,
        // parentMsg: order.wa_msg_id,
        link: `https://smart-tech-api.glitch.me/api/v1/thawani/thawaniInvoice/${order._id}`,
        filename: `Invoice ${order.from}.pdf`,
        type: "pdf",
      };
      sendToWhatsapp.sendToWhatsapp(wellcomeData);
      response.body = "تم الدفع بنجاح";
    } else {
      throw new Error("checkout/reference Failed");
    }
  } catch (error) {
    console.error(error);
    response.statusCode = 404;
    response.body = {
      status: "حدث خطأ",
      message: error,
    };
  } finally {
    res.status(response.statusCode).json(response.body);
  }
};

exports.getCancelPayment = async (req, res) => {
  let response = {
    statusCode: 200,
    body: null,
  };
  const client_reference_id = req.query.client_reference_id;
  const order = await Orders.findOne({ wa_msg_id: client_reference_id });

  const options = {
    method: "GET",
    url: `https://uatcheckout.thawani.om/api/v1/checkout/reference/${client_reference_id}`,
    headers: {
      Accept: "application/json",
      "thawani-api-key": THAWANI_SECRET_KEY,
    },
  };

  try {
    const data = await axios.request(options);
    console.log(data, " Reeeeeeeeeeeeeeeeeeeeeess");
    const res = data.data;
    if (
      res.success == true &&
      res.code == 2000 &&
      res.data.payment_status == "unpaid"
    ) {
      //   order.totalPrice = res.data.total_amount;
      //   order.paymentStatus = res.data.payment_status;
      //   order.isPaid = true;
      //   await order.save();
      //   const adminId = await User.findOne({ platform: "admin" });
      //   const user = await User.findOne({ _id: order.from });
      //   const wellcomeData = {
      //     from: adminId,
      //     to: user,
      //     phone_number: user.phone_number,
      //     content: `تم الدفع بنجاح
      //       لقد قمت بشراء ${res.data.products.length} منتجات بنجاح
      //       اجمال المبلغ المدفوع ${totalPrice} ريال عماني
      //       نشكرك على تعاملك مع
      //       Muscat Apps`,
      //     // parentMsg: wa_msg_id,
      //     type: "text",
      //   };
      //   messageController.sendToWhatsapp(wellcomeData);
      response.body = "تم الغاء عملية الدفع";
    } else {
      throw new Error("checkout/reference Failed");
    }
  } catch (error) {
    console.error(error);
    response.statusCode = 404;
    response.body = {
      status: "حدث خطأ",
      message: error,
    };
  } finally {
    res.status(response.statusCode).json(response.body);
  }
};

exports.thawaniInvoice = async (req, res) => {
  try {
    const _id = req.params.id;
    const order = await Orders.findById(_id);

    if (!order || !order.invoicePdf) {
      throw new Error("Not Found");
    }

    res.type("application/pdf");
    res.header("Content-Disposition", `attachment; filename="abdoo.pdf"`);
    res.send(Buffer.from(order.invoicePdf, "base64"));
    //res.send(order.invoicePdf);
  } catch (e) {
    res.status(404).send({ error: true, message: e.message });
  }
};
