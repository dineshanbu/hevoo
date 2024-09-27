const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
const ErrorResponse = require("../utils/errorResponse");
const CryptoJS = require("crypto-js");

const generateHashPassword = async (plainPassword) => {
    try {
        const Hash = await bcrypt.hash(plainPassword, 10);
        return Hash;
    } catch (err) {
        res.send(err);
    }
};



const Protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization) {
            token = req.headers.authorization;
        }
        if (!token) {
            return next(
                res.send({
                    statuscode: 301,
                    msg: "Not Authorized to access route",
                })
            );
        } else {
            const decode = jwt.verify(token, process.env.JWT_KEY);
            const user = await User.findOne({
                _id: decode._id,
                token: token,
            });
            if (!user) {
                return next(res.send({
                    statuscode: 301,
                    msg: "Authorized Faild"
                }))
            } else {
                req.user = user._id
                return next()
            }
        }
    } catch (err) {
        return res.send({
            statuscode: 401,
            msg: "Invalid Token",
            err
        })
    }
};

const verification_code = async(email) =>{
    // Encrypt
    const secretKey = "Training"
    const ciphertext = CryptoJS.AES.encrypt(email, secretKey).toString();
    return ciphertext;
}

module.exports = { generateHashPassword, Protect,verification_code };
