const express = require("express");

const router = express.Router();

const thawaniController = require("../controller/thawaniController");

// عند نجاح عملية الدفع
router.route("/success").get(thawaniController.getSuccessPayment);

// عند الغاء عملية الدفع
router.route("/cancel").get(thawaniController.getCancelPayment);

router.route("/thawaniInvoice/:id").get(thawaniController.thawaniInvoice);

module.exports = router;
