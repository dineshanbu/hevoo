const express = require("express");
const {protect } = require("../middleware/appAuth");
const router = express.Router();
const path = require('path')
const multer= require("multer")


const {create_user,getUser,deleteUserById,newRegister,login,accessUpdate,
    getAccessList,dashboard,FCMtoken,sendAppNotification,changePassword,updateUserDetail,userProfileUpdate,
    metaTokenUpdate,getMetaToken,updateMetaToken,sendOtp,verifyOtp,forgetPassword,getUserList
} = require("../controller/users.controller");

const uploadPath = path.resolve(__dirname, '../../public/uploads')

const profileStorage = multer.diskStorage({
    destination: uploadPath + '/userProfile',
    filename: function (req, file, cb) {
        console.log('inside multer request file', file);
        cb(null, file.originalname.split('.')[0] + '-' + Date.now() + path.extname(file.originalname))
    }
})
const profileUpload = multer({
    storage: profileStorage,
    limits: {
        filesize: 5 * 1024 * 1024
    },
    fileFilter(req, file, cb) {
        // console.log('inside multer request parameters', req);
        console.log('inside multer request file filter', file);
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Please upload an image'))
        }
        cb(undefined, true)
    }
})


router.route("/create").post(create_user);
router.route("/getUserList").post(protect,getUserList);
router.route("/auth/login").post(login);
router.route("/registerUser").post(newRegister);
router.route("/deleteUserById").post(deleteUserById);
router.route("/accessUpdate").post(accessUpdate);
router.route("/getAccessList").post(getAccessList);
router.route("/dashboard").get(dashboard);
router.route("/fcm-token").post(FCMtoken);
router.route("/send-app-notification").post(sendAppNotification);
router.route("/changePassword").post(changePassword);
router.route("/updateUserDetail").post(updateUserDetail);
router.post("/userProfileUpdate", profileUpload.single("profile"), userProfileUpdate);
router.route("/metaTokenUpdate").post(metaTokenUpdate);
router.route("/getMetaToken").get(getMetaToken);
router.route("/updateMetaToken").post(updateMetaToken);
router.route("/sendOtp").post(sendOtp);
router.route("/verifyOtp").post(verifyOtp);
router.route("/forgetPassword").post(forgetPassword)

module.exports = router;
