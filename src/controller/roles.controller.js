const asyncHandler = require("../middleware/async");
const rolesModel = require("../models/roles.Model")

exports.createRole = asyncHandler(async (req, res, next) => {
  if (!req.body.role_name) {
    return res.send({
      success: false,
      status: 0,
      statusCode: 422,
      message: "Please provide Role Name",
    });
  }

  if (!req.body.role_types || !Array.isArray(req.body.role_types)) {
    return res.send({
      success: false,
      status: 0,
      statusCode: 422,
      message: "Please provide Role Types as an array",
    });
  }

  const findRoleName = await rolesModel.findOne({ role_name: { $regex: new RegExp(`^${req.body.role_name}$`, "i") } });

  if (findRoleName) {
    return res.send({
      success: false,
      status: 0,
      statusCode: 422,
      message: "Role Name already exists",
    });
  }

  // Format role_types to have id and name
  const roleTypesWithId = req.body.role_types.map((type) => ({
    name: type // Each type is expected to be a string name
  }));

  const rolesObject = new rolesModel({
    role_name: req.body.role_name,
    role_types: roleTypesWithId
  });

  await rolesObject.save();

  res.status(201).send({
    success: true,
    statusCode: 200,
    message: "Role saved successfully",
  });
});


exports.getRoles = asyncHandler(async (req, res, next) => {
    const roles = await rolesModel.find({is_active:1})

    if(roles.length>0){
        res.status(201).send({
            success: true,
            statusCode: 200,
            data: roles,
            message:
              "You have Recieved successfully",
        });
        return
    }

    res.status(201).send({
        success: true,
        data: roles,
    });
});






