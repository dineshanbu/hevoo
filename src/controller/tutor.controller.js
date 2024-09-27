const asyncHandler = require("../middleware/async");
const tutorModel = require("../models/tutor.Model")

exports.createTutor = asyncHandler(async (req, res, next) => {
    const findUserId = await tutorModel.findOne({ userId:req.user._id });
    if (findUserId) {
        return res.send({
            success: false,
            status: 0,
            statusCode: 422,
            message: "Tutor already exists",
        });
    }
    const tutorObject = new tutorModel({
        address1: req.body.address1,
        address2:  req.body.address2,
        location: req.body.location,
        country:  req.body.country,
        pincode: req.body.pincode,
        userId: req.user._id,
        rolesId:  req.body.rolesId,
        role_type_Id:  req.body.role_type_Id,
    });

    await tutorObject.save();

    res.status(201).send({
        success: true,
        statusCode: 200,
        message: "tutor saved successfully",
    });
});