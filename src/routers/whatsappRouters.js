const express = require("express");
const multer = require('multer');
const router = express.Router();
sendToWhatsapp = require("../controller/sendToWhatsapp");
const OrderID = require("../models/OrderIDModel");


router.post("/success/payment", async (req, res) => {
    let phone_number = req.body.phone_number;
    const booking_id = req.body.booking_id;
    let pdf = req.body.pdf;
    console.log("/success/payment");

    try {

        if (!pdf) {
            console.log("PDF file Required");
            return res.status(400).send({ error: true, message: "PDF file Required" });
        }

        console.log("pdf", pdf);

        if (!phone_number) {
            console.log("phone_number Required");
            return res.status(400).send({ error: true, message: "phone_number Required" });
        }

        console.log("phone_number", phone_number);

        if (!booking_id) {
            console.log("booking_id Required");
            return res.status(400).send({ error: true, message: "booking_id Required" });
        }
        console.log("booking_id", booking_id);

        let hispeed = await OrderID.findOne({ from: { $regex: phone_number, $options: "i" } });


        const wellcomeData = {
            from: "00",
            to: hispeed.from ? hispeed.from : phone_number,
            phone_number: hispeed.from ? hispeed.from : phone_number,
            booking_id: booking_id,
            filename: "Invoice.pdf",
            link: pdf,
            type: "flow_pdf",
        };
        await sendToWhatsapp.sendToWhatsapp(wellcomeData);

        return res.send({
            error: false,
            message: "Message sent successfully!",
        });
    } catch (error) {
        console.error("Error occurred:", error);
        return res.status(500).send({ error: true, message: "Internal server error" });
    }
});
router.post("/change_status", async (req, res) => {
    let phone_number = req.body.phone_number;
    let order_id = req.body.order_id;
    let name = req.body.name;
    let status = req.body.status;
    console.log("/change_status");

    try {

        if (!name) {
            console.log("Name Required");
            return res.status(400).send({ error: true, message: "Name Required" });
        }

        console.log("name", name);

        if (!phone_number) {
            console.log("phone_number Required");
            return res.status(400).send({ error: true, message: "phone_number Required" });
        }

        console.log("phone_number", phone_number);

        if (!order_id) {
            console.log("order_id Required");
            return res.status(400).send({ error: true, message: "order_id Required" });
        }
        console.log("order_id", order_id);

        if (!status) {
            console.log("status Required");
            return res.status(400).send({ error: true, message: "status Required" });
        }
        console.log("status", status);

        let hispeed = await OrderID.findOne({ from: { $regex: phone_number, $options: "i" } });


        const wellcomeData = {
            from: "00",
            to: hispeed.from ? hispeed.from : phone_number,
            phone_number: hispeed.from ? hispeed.from : phone_number,
            order_id: booking_id,
            name: name,
            status: status,
            type: "change_status",
        };
        await sendToWhatsapp.sendToWhatsapp(wellcomeData);

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
