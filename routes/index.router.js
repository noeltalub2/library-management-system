const express = require("express");
const router = express.Router();

const indexController = require("../controller/index.controller");

router.get("/", indexController.getBarcode);

router.get('/unauthorized', indexController.getError403);

// should be in last
router.use('/', indexController.getError404);

module.exports = router;
