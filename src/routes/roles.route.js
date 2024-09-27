const express = require("express");
const router = express.Router();
const {createRole,getRoles} = require("../controller/roles.controller");

router.route("/createRole").post(createRole);
router.route("/getRoles").get(getRoles);

module.exports = router;
