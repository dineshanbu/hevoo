const express = require("express");
const router = express.Router();
const user = require('./user.route');
const roles = require("./roles.route")
const tutor = require("./tutor.route")

router.use("/user", user);
router.use("/roles", roles);
router.use("/tutor", tutor);

module.exports = router