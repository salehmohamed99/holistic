const express = require("express");
const multer = require('multer');
const router = express.Router();
const sendToWhatsapp = require("../controller/sendToWhatsapp");
const OrderID = require("../models/OrderIDModel");


router.post("/send_otp", async (req, res) => {
    let phone_number = req.body.phone_number;
    const otp = req.body.otp;

    try {

        if (!phone_number) {
            console.log("phone_number Required");
            return res.status(400).send({ error: true, message: "phone_number Required" });
        }
        if (!otp) {
            console.log("otp Required");
            return res.status(400).send({ error: true, message: "otp Required" });
        }

        let shara = await OrderID.findOne({ from: phone_number });

        if (shara && shara.to_verified == true && shara.country_code && shara.phone) {
            const wellcomeData3 = {
                from: "00",
                to: phone_number,
                phone_number: phone_number,
                country_code: shara.country_code,
                phone: shara.phone,
                otp: otp,
                type: "confirm_otp",
            };

            await sendToWhatsapp.sendToWhatsapp(wellcomeData3);
        } else {
            const wellcomeData2 = {
                from: "00",
                to: phone_number,
                phone_number: phone_number,
                otp: otp,
                type: "otp",
            };
            await sendToWhatsapp.sendToWhatsapp(wellcomeData2);
        }






        return res.send({
            error: false,
            message: "Message sent successfully!",
        });
    } catch (error) {
        console.error("Error occurred:", error);
        return res.status(500).send({ error: true, message: "Internal server error" });
    }
});


router.post("/success/payment", async (req, res) => {
    let phone_number = req.body.phone_number;
    const booking_id = req.body.booking_id;
    let pdf = req.body.pdf;
    console.log("/success/payment");

    try {
        if (!pdf) {
            console.log("No PDF file uploaded");
            // return res.status(400).send({ error: true, message: "No PDF file uploaded" });
            pdf = "https://cdn.glitch.global/61abb0ec-32ba-4829-9ac4-c31699e487d3/test.pdf?v=1713121459295";
        } else {
            console.log("pdf", pdf);
            // pdf = "https://delipizza.online" + pdf;
        }

        if (!phone_number) {
            console.log("phone_number Required");
            return res.status(400).send({ error: true, message: "phone_number Required" });
        }

        console.log("phone_number", phone_number);
        phone_number = phone_number.replace("+", "");
        console.log("phone_number", phone_number);


        if (!booking_id) {
            console.log("booking_id Required");
            return res.status(400).send({ error: true, message: "booking_id Required" });
        }
        console.log("booking_id", booking_id);

        let shara = await OrderID.findOne({ from: { $regex: phone_number, $options: "i" } });

        if (!shara) {
            return res
                .status(404)
                .send({ error: true, message: "User not found" });
        }

        shara.order_id = booking_id;
        shara.is_ordered = true;
        await shara.save();

        const wellcomeData = {
            from: "00",
            to: shara.from,
            phone_number: shara.from,
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
    const booking_id = req.body.booking_id;
    const status = req.body.status;
    let url = req.body.url;
    console.log("/change_status");

    try {
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

        if (!status) {
            console.log("status Required");
            return res.status(400).send({ error: true, message: "status Required" });
        }
        console.log("status", status);


        if (!url) {
            console.log("url Required");
            return res.status(400).send({ error: true, message: "url Required" });
        }


        url = url.split('/').slice(3).join('/');
        console.log("url", url);

        let shara = await OrderID.findOne({ from: { $regex: phone_number, $options: "i" } });

        if (!shara) {
            return res
                .status(404)
                .send({ error: true, message: "User not found" });
        }

        if (status.status_ar == "تم التوصيل" && status.status_en == "Delivered") {
            const wellcomeData2 = {
                from: "00",
                to: shara.from,
                phone_number: shara.from,
                order_id: booking_id,
                name: shara.name,
                status: shara.language === 'ar' ? status.status_ar : status.status_en,
                url: url,
                type: "change_status_delivered",
            };
            await sendToWhatsapp.sendToWhatsapp(wellcomeData2);
        } else {
            const wellcomeData2 = {
                from: "00",
                to: shara.from,
                phone_number: shara.from,
                order_id: booking_id,
                name: shara.name,
                status: shara.language === 'ar' ? status.status_ar : status.status_en,
                url: url,
                type: shara.language === 'ar' ? "change_status" : "change_status_en",
            };
            await sendToWhatsapp.sendToWhatsapp(wellcomeData2);
        }



        return res.send({
            error: false,
            message: "Message sent successfully!",
        });
    } catch (error) {
        console.error("Error occurred:", error);
        return res.status(500).send({ error: true, message: "Internal server error" });
    }
});

// router.post("/complete_order", async (req, res) => {
//     let phone_number = req.body.phone_number;
//     const booking_id = req.body.booking_id;
//     console.log("/complete_order");

//     try {
//         if (!phone_number) {
//             console.log("phone_number Required");
//             return res.status(400).send({ error: true, message: "phone_number Required" });
//         }
//         console.log("phone_number", phone_number);

//         if (!booking_id) {
//             console.log("booking_id Required");
//             return res.status(400).send({ error: true, message: "booking_id Required" });
//         }
//         console.log("booking_id", booking_id);


//         let shara = await OrderID.findOne({ from: { $regex: phone_number, $options: "i" } });

//         if (!shara) {
//             return res
//                 .status(404)
//                 .send({ error: true, message: "User not found" });
//         }

//         if (shara.language === 'ar') {
//             const wellcomeData2 = {
//                 from: "00",
//                 to: shara.from,
//                 phone_number: shara.from,
//                 meal_id: booking_id,
//                 type: "review",
//             };
//             await sendToWhatsapp.sendToWhatsapp(wellcomeData2);
//         }
//         else {
//             const wellcomeData2 = {
//                 from: "00",
//                 to: shara.from,
//                 phone_number: shara.from,
//                 meal_id: booking_id,
//                 type: "review",
//             };
//             await sendToWhatsapp.sendToWhatsapp(wellcomeData2);
//         }


//         return res.send({
//             error: false,
//             message: "Message sent successfully!",
//         });
//     } catch (error) {
//         console.error("Error occurred:", error);
//         return res.status(500).send({ error: true, message: "Internal server error" });
//     }
// });




module.exports = router;
