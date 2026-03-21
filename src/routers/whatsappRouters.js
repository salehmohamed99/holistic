const express = require("express");
const multer = require('multer');
const router = express.Router();
sendToWhatsapp = require("../controllers/sendToWhatsapp");
const OrderID = require("../models/OrderIDModel");


router.post("/success/payment", async (req, res) => {
    let phone_number = req.body.phone_number;
    console.log("/success/payment");

    try {

        if (!phone_number) {
            console.log("phone_number Required");
            return res.status(400).send({ error: true, message: "phone_number Required" });
        }

        console.log("phone_number", phone_number);

        let wadi_zaka = await OrderID.findOne({ from: { $regex: phone_number, $options: "i" } });

        if (!wadi_zaka) {
            return res
                .status(404)
                .send({ error: true, message: "User not found" });
        }


        const wellcomeData = {
            from: "00",
            to: wadi_zaka.from,
            phone_number: wadi_zaka.from,
            type: "after_payment_template",
        };
        await sendToWhatsapp.sendToWhatsapp(wellcomeData);

        await new Promise(resolve => setTimeout(resolve, 8000));


        const wellcomeData2 = {
            from: "00",
            to: wadi_zaka.from,
            phone_number: wadi_zaka.from,
            content: "إذا أعجبتك خدمة التبرع بالواتساب ، شارك بها الآخرين \n http://wa.me/+96899313169",
            type: "text",
        };
        await sendToWhatsapp.sendToWhatsapp(wellcomeData2);

        return res.send({
            error: false,
            message: "Message sent successfully!",
        });
    } catch (error) {
        console.error("Error occurred:", error);
        return res.status(500).send({ error: true, message: "Internal server error" });
    }
});


module.exports = router;
