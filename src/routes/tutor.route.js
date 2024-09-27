const express = require("express");
const router = express.Router();
const {createTutor} = require("../controller/tutor.controller");
const {protect } = require("../middleware/appAuth");

router.route("/createTutor").post(protect ,createTutor);

module.exports = router;
