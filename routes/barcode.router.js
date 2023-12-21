const express = require("express");
const router = express.Router();

const barcodeController = require("../controller/barcode.controller");

router.post("/", barcodeController.postAttendance);

module.exports = router;
