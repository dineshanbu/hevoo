const asyncHandler = require("../middleware/async");
const User = require("../models/userModel");
const Tutor = require('../models/tutor.Model');
const mongoose = require('mongoose'); 
const path = require("path");
const crypto = require("crypto");
const algorithm = "aes-256-cbc";
const admin = require('firebase-admin');
const fs = require('fs')
const axios = require('axios');
const moment = require('moment');
const{sendMail,generateOtp} = require('../utils/mailHelper')
const bcrypt = require('bcryptjs')

exports.newRegister = asyncHandler(async (req, res, next) => {
    if (!req.body.name) {
      return res.send({
        success: false,
        status: 0,
        statusCode: 422,
        message: "Please provide name",
      });
    }

    if (!req.body.email ) {
      return res.send({
        success: false,
        status: 0,
        statusCode: 422,
        message: "Please provide email",
      });
    }

    if (!req.body.dob) {
      return res.send({
        success: false,
        status: 0,
        statusCode: 422,
        message: "Please Provide Date of birth",
      });
    }

    if(!req.body.phone_number){
      return res.send({
        success: false,
        status: 0,
        statusCode: 422,
        message: "Please Provide Phone Number",
      });
    }

  
    const [checkUserEmail, checkUserName] = await Promise.allSettled([
        User.findOne({ email: req.body.email, is_deleted: 0 }),
        User.findOne({ phone_number: req.body.phone_number, is_deleted: 0 })
    ]);
    
    if (checkUserEmail.status === 'fulfilled' && checkUserEmail.value) {
        return res.send({ success: false, status: 0, statusCode: 422, message: "Email already exists" });
    }
    
    if (checkUserName.status === 'fulfilled' && checkUserName.value) {
        return res.send({ success: false, status: 0, statusCode: 422, message: "Phone Number already exists" });
    }    
  
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      phone_number:req.body.phone_number,
      dob:req.body.dob,
      pincode: req.body.pincode,
      user_type:req.body.user_type
    });
    
    const token = await user.generateAuthToken();
    user.token = token;
    await user.save();
    // await
    let userInfo = await User.findById(user._id).select({
      email: 1,
      name: 1,
      phone_number: 1,
      dob:1,
      user_type: 1,
      is_active: 1,
      token: 1,
      pincode:1,
    });
    let userDetails = userInfo.toObject();

    res.status(201).send({
      success: true,
      statusCode: 200,
      data: userDetails,
      message:
        "You have registered successfully",
    });
});

exports.encryption = function () {
    try {
      // generate 16 bytes of random data
      const initVector = crypto.randomBytes(16);
      // protected data
      const message = "whatsapp cloud";  
      // secret key generate 32 bytes of random data
      const Securitykey = crypto.randomBytes(32); 
     // the cipher function
      const cipher = crypto.createCipheriv(algorithm, Securitykey, initVector);  
      // encrypt the message
      // input encoding
      // output encoding
      let encryptedData = cipher.update(message, "utf-8", "hex"); 
      encryptedData += cipher.final("hex");  
      console.log("Encrypted message: " + encryptedData);
      return {
        success: true,
        encryptedData,
      };
    } catch (e) {
      console.log(e);
    }
  };

exports.getUserList = asyncHandler(async (req, res, next) => {
    try {
        const users = await User.aggregate([
            {
                $match: {
                    _id: mongoose.Types.ObjectId(req.user._id),
                    is_deleted: 0
                }
            },
            {
                $lookup: {
                    from: 'tutors',
                    let: { userId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$userId', { $toString: '$$userId' }] }
                            }
                        },
                        {
                            $lookup: {
                                from: 'roles',
                                let: { rolesId: '$rolesId' }, // Pass rolesId from tutor
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: { $eq: ['$_id', { $toObjectId: '$$rolesId' }] } // Convert to ObjectId
                                        }
                                    }
                                ],
                                as: 'roleDetails'
                            }
                        },
                        {
                            $unwind: {
                                path: '$roleDetails',
                                preserveNullAndEmptyArrays: true // Allow for tutors without roles
                            }
                        }
                    ],
                    as: 'tutorDetails'
                }
            },
            {
                $unwind: {
                    path: '$tutorDetails',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    name: 1,
                    email: 1,
                    dob: 1,
                    phone_number: 1,
                    pincode: 1,
                    'tutor.address1': '$tutorDetails.address1',
                    'tutor.address2': '$tutorDetails.address2',
                    'tutor.location': '$tutorDetails.location',
                    'tutor.country': '$tutorDetails.country',
                    'tutor.pincode': '$tutorDetails.pincode',
                    'tutor.role_name': { $ifNull: ['$tutorDetails.roleDetails.role_name', ''] },
                    'tutor.role_type': {
                        $ifNull: [
                            {
                                $arrayElemAt: ['$tutorDetails.roleDetails.role_types.name', 0]
                            },
                            ''
                        ]
                    }
                }
            }
        ]);

        console.log("Aggregated Users with Tutor and Roles: ", JSON.stringify(users, null, 2));

        if (!users.length) {
            return res.status(404).json({
                statuscode: 404,
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            statuscode: 200,
            success: true,
            data: users
        });
    } catch (err) {
        console.error("Error fetching user list:", err);
        res.status(500).json({
            statuscode: 500,
            success: false,
            message: "Server Error",
            error: err.message
        });
    }
});



exports.getUser = asyncHandler(async (req, res, next) => {
    const searchQuery = {
      is_active:1,
      is_deleted:0,
      _id:req.user._id
    }

    // Find user details based on the search criteria
    const userDetails = await User.find(searchQuery).select({
      _id:1,
      user_name:1,
      email:1,
      contact_no:1,
      rolesId:1,
      roles:1,
      created_at:1
    });
    const additionalRecord = {
      _id: 1,
      user_name: "Un Assigned"
    };
    userDetails.push(additionalRecord);
    res.send({
        statuscode:200,
        message:'Recived successfully',
        data:userDetails
    })
})

exports.create_user = asyncHandler(async (req, res, next) => {
    const {
        user_name,
        user_no
    }=req.body;

    const user = new UserDetails({
        user_name,
        user_no
    });

    user.save();

    res.send({
        statuscode:200,
        message:'User created successfully'
    })
})



exports.deleteUserById = asyncHandler(async (req, res, next) => {
    // Find the user by ID and delete it
    const objectId = req.body.objectId; // Get the _id from the request body

    // Check if the provided _id is a valid ObjectId
    if (!ObjectID.isValid(objectId)) {
        return res.status(400).send({
            statusCode: 400,
            message: 'Invalid _id'
        });
    }

    // Find the user by _id and delete it
    const deletedUser = await UserDetails.findByIdAndDelete(objectId);

    if (!deletedUser) {
        return res.status(404).send({
            statusCode: 404,
            message: 'User not found'
        });
    }

    res.send({
        statusCode: 200,
        message: 'User deleted successfully',
        data: deletedUser
    });
});

exports.login = asyncHandler(async (req, res, next) => {
  // Destructure email and password from request body
  const { email, password } = req.body;

  // Check if email and password are provided
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Please provide email and password",
    });
  }

  try {
    // Find user by credentials
    const user = await User.findByCredentials(email, password);
    // Generate authentication token
    token = await user.generateAuthToken();
    user.token = token;
    await user.save();
    let userAccess = {};

    if (user.user_type !== 1) {
      userAccess._id = { "$in": user.menu_list };
    }
    
    // Menu find
    let userAccess_Menu = await menu_list.find(userAccess);

    // Select user details to send in response
    const userDetails = {
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      user_name: user.user_name,
      user_type: user.user_type,
      is_active: user.is_active,
      token: user.token,
      contact_no:user.contact_no,
      roles:user.roles,
      menu_list:userAccess_Menu,
      user_id:user._id,
      profile_url:user.profile_url

    };


    // Send response
    res.status(200).json({
      statusCode:200,
      success: true,
      message: "You have logged in successfully",
      data: { user: userDetails},
    });
  } catch (error) {
    // Forward error to error-handling middleware
    return next(error);
  }
});

exports.accessUpdate = asyncHandler(async (req, res, next) => {
  try {
    const userIds = req.body.userIds; // Assuming userIds is an array of user IDs
    const wa_id = req.body.wa_ids; // Assuming wa_ids is a single WhatsApp ID string

    // Update users by removing the existing WhatsApp IDs and replacing them with the new one
    const existingUsers = await User.find({ whatsapp_wa_id: { $in: wa_id } });
    if (existingUsers.length > 0) {
      // Remove the WhatsApp IDs from the existing users
      for (const user of existingUsers) {
        await User.findByIdAndUpdate(user._id, { $pull: { whatsapp_wa_id: { $in: wa_id } } });
      }
    }
    if(existingUsers){
      const result = await User.updateMany(
        { _id: { $in: userIds } },
        { $set: { whatsapp_wa_id: ''} } // Set the new WhatsApp ID for all users
      );
    }
    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { $set: { whatsapp_wa_id: wa_id } } // Set the new WhatsApp ID for all users
    );

    console.log(`${result.nModified} users updated.`);
    res.status(200).send({
      statusCode: 200,
      message: "Updated Successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      statusCode: 500,
      message: "Internal Server Error"
    });
  }
});

exports.getAccessList = asyncHandler(async (req, res, next) => {
  try {
    const wa_ids = req.body.wa_ids; // Assuming wa_ids is an array of WhatsApp IDs

    // Search for users with the provided WhatsApp IDs
    const usersWithWaId = await User.find({ whatsapp_wa_id: wa_ids }).select({
      _id: 1
    });

    // Extract _id values from the array of users
    const userIds = usersWithWaId.map(user => user._id);

    res.status(200).send({
      statusCode: 200,
      data: userIds,
      message: "Received Successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      statusCode: 500,
      message: "Internal Server Error"
    });
  }
});

exports.dashboard = asyncHandler(async (req, res, next) => {
  let totalContacts = await contacts.countDocuments();
  let totalUser = await User.countDocuments({ user_type: { $ne: 1 } }); // Count users where user_type is not equal to 1
   // Get all distinct "contact_no" from the User collection
  let userContactNumbers = await User.distinct("contact_no",{user_type: { $ne: 1 }});
  console.log(userContactNumbers)
   // Count the number of unique "contact_no" from the User collection that are not in the "wa_id" field of the whatsapp_chat collection
  let newUser = await whatsapp_chat.countDocuments({ wa_id: { $nin: userContactNumbers } });

  res.send({
    statusCode: 200,
    data: {
      TotalContacts: totalContacts ? totalContacts : 0,
      TotalUsers: totalUser ? totalUser : 0,
      TotalNewUser : newUser ? newUser:0
    }
  });
});

exports.FCMtoken = asyncHandler(async (req, res, next) => {
  const { userId, token } = req.body; // Expecting userId and token in the request body

  // Find the user by their _id
  let user = await User.findById(userId);

  if (user) {
    // Update the fcm_token with the new token
    user.fcm_token = token;
    await user.save(); // Save the user document
  } 
  res.sendStatus(200); // Respond with a 200 status code indicating success
});

exports.sendAppNotification = asyncHandler(async (req, res, next) => {
  const { userId, message } = req.body;
  let user = await User.findById(userId);
  if (user ) {
    const tokens = "e2BCNBT2TWWi82rlfYwG1h:APA91bHRiMJe9Ha42MZCaadXWrDJ2CW-LvJm3AVC-7UPKKawfoIW-eRf_ai0YN9Wv0GBlkN1ycnJ4r8lSAkhCqXRv4lXKEp4HMkKYgmgvNS0k6kapsjy-pGB_0bcumATIFBtSsD4YND9";
    // Trigger Notifications: Detect event (new message)
    // Send Notifications: Call function to send notification
    await sendNotification(tokens, message);
    res.sendStatus(200);
  } else {
    res.status(404).send('User not found or no tokens available');
  }
})

const sendNotification = async (tokens, message) => {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        // credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://creatah-chats-default-rtdb.firebaseio.com/"
      });
    }
    const payload = {
      notification: {
        title: 'Test Notification',
        body: message, // Use the message from the request body
      },
      data: {
        screen: 'Setting',
        ...additionalData
        // Add any additional data you need here
      },
      token: tokens // Replace with the recipient device token
    };

    admin.messaging().send(payload).then(response => {
      console.log('Successfully sent message:', response);
    }).catch(error => {
      console.log('Error sending message:', error);
    });
    
  } catch (error) {
    console.log(error);
  }
};

const androidPush = async(deviceKey,pushMessage)=>{
  admin.initializeApp({
    // credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://creatah-chats-default-rtdb.firebaseio.com"
  });


  try{
      var payload = {
          data:{
              body:pushMessage,
              title:'Buildup Application',
              tag:"",
              sound:'mysound', /* Default sound */
          },
          notification:{
              body:pushMessage,
              title:'Buildup Application',
              tag:"",
              sound:'mysound', /* Default sound */
          }
      }
      var option = {
          priority:"high",
          timeToLive:60 * 60 * 24
      }
      const response = await admin.messaging().sendToDevice(deviceKey, payload, option)
      console.log(JSON.stringify(response))
      if(response.successCount == 1){
          console.log(`Mesage with text ${pushMessage} Delivered SUccessfully`)
      }
      if(response.failureCount == 1){
          console.log(response.results)
      }
      
  }catch(error){
      console.log(error);
  }
}

exports.updateUserDetail = asyncHandler(async (req, res, next) => {
  // type:1 is for updating  first name and lastname
  // type:2 is for password reset 
  const { type, first_name, last_name,oldPassword, newPassword,user_id } = req.body;
 
  if (type==1) {   
    let user = await User.findById(user_id);
    if (user) {
      user.first_name = first_name;
      user.last_name = last_name;
      
      await user.save();
      res.send({
        success: true,
        status: 1,
        message: "User details updated successfully",
      });
    }
    
    else {
      res.status(404).send('User not found');
    }
  } else if(type==2){
      if (!oldPassword) {
        return res.send({
          success: false,
          status: 0,
          message: "Please provide old password",
        });
      }
  
      let userList= await User.checkOldPassword(user_id, oldPassword);
      if(userList){
        userList.password = newPassword;	
      }
      await userList.save();
      res.send({
        success: true,
        status: 1,
        message: "Password updated successfully",
      });
    
  }
});

exports.changePassword = asyncHandler(async (req, res, next) => {
  const { oldPassword, newPassword,user_id } = req.body;
  if (!req.body.oldPassword) {
    return res.send({
      success: false,
      status: 0,
      message: "Please provide old password",
    });
  }

  let userList= await User.checkOldPassword(user_id, oldPassword);
  if(userList){
    userList.password = newPassword;	
  }
  await userList.save();
  res.send({
    success: true,
    status: 1,
    message: "Password updated successfully",
  });
});

exports.passwordReset = asyncHandler(async (req, res, next) => {
  const { oldPassword, newPassword,user_id } = req.body;
  let user = await User.findById(user_id);
  if (user ) {

    await sendNotification(tokens, message);
    res.sendStatus(200);
  } else {
    res.status(404).send('User not found or no tokens available');
  }
})

exports.userProfileUpdate = asyncHandler(async (req, res, next) => {
  const { user_id } = req.body;
  const profileImagePath = req.protocol + '://' + req.get('host') + '/uploads/userProfile/' + req.file.filename  
  try {
    const user = await User.findById(user_id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.profile_filename) {
      const oldProfileImagePath = path.resolve(__dirname, '../../public/uploads/userProfile/' + user.profile_filename);  
      if (fs.existsSync(oldProfileImagePath)) {
        fs.unlinkSync(oldProfileImagePath);
      } 
    }
    await User.updateOne(
      { _id: user_id },
      { $set: { profile_url: profileImagePath,profile_filename:req.file.filename } }
    );
    res.send({
      statuscode:200,
      message: 'Profile Updated', 
      profileImageUrl:profileImagePath
    })
  } catch (error) {
    console.log("error message", error)
    res.send({
      statuscode:500,
      error :error
    })
  }
  });

exports.metaTokenUpdate = asyncHandler(async (req, res, next) => {
  const {authorization_token,phoneNumberId,whatsapp_business_id}=req.body
   const metaTokemSchema = new metaTokenModel({
    autorization_token:authorization_token,
    phone_number_id:phoneNumberId,
    whatsapp_business_id:whatsapp_business_id
   })

   await metaTokemSchema.save()
   res.send({
      statuscode: 200,
      message: 'Success'
   })
})




exports.getMetaToken = asyncHandler(async (req, res, next) => {
  let token = await metaTokenModel.findOne({});

  if (token) {
    // Convert Mongoose document to plain JavaScript object
    token = token.toObject();
    
    // Check and format created_at
    if (token.created_at) {
      token.created_at_formatted = moment(token.created_at).format('DD MMMM YYYY');
    }
    
    // Check and format updated_at
    if (token.updated_at) {
      token.updated_at_formatted = moment(token.updated_at).format('DD MMMM YYYY');
    }
  }

  res.send({
    message: "Received token",
    statuscode: 200,
    data: token
  });
});


// Function to verify the authorization token
const verifyAuthorization = async (authorizationToken) => {
  try {
      const response = await axios.get(`https://graph.facebook.com/me?access_token=${authorizationToken}`);
      return response.data && response.data.id ? true : false;
  } catch (error) {
      console.error('Authorization verification error:', error.message);
      return false;
  }
};

// Function to verify phone number ID
const verifyPhoneNumberId = async (phoneNumberId, authorizationToken, whatsappBusinessId) => {
  try {
      const response = await axios.get(`https://graph.facebook.com/v19.0/${whatsappBusinessId}/message_templates`, {
          headers: {
              Authorization: `Bearer ${authorizationToken}`
          }
      });
      if(response?.data?.data.length>0){
        return  true
      }
  } catch (error) {
      console.error('Phone number ID verification error:', error.message);
      return false;
  }
};

exports.updateMetaToken = asyncHandler(async (req, res, next) => {
  const { _id, autorization_token, phone_number_id, whatsapp_business_id } = req.body;

  // Fetch stored token data
  const storedTokenData = await metaToken.findById(_id);

  if (!storedTokenData) {
      return res.send({ statuscode: 404, message: "Token data not found" });
  }

  // Verify authorization token
  const isAuthorized = await verifyAuthorization(autorization_token);
  if (!isAuthorized) {
      return res.send({ statuscode: 401, message: "Invalid authorization token" });
  }

  // Verify phone number ID
  const isPhoneNumberValid = await verifyPhoneNumberId(phone_number_id,autorization_token, whatsapp_business_id);
  if (!isPhoneNumberValid) {
      return res.send({ statuscode: 404, message: "Phone number ID is not valid" });
  }

  // Update metaToken if both checks pass
  await metaToken.updateOne(
      { _id: _id },
      { $set: { autorization_token: autorization_token, phone_number_id: phone_number_id, whatsapp_business_id: whatsapp_business_id , updated_at: new Date().toISOString() } }
  );

  res.send({
      message: "Updated Token",
      statuscode: 200,
  });
});
exports.sendOtp = asyncHandler(async (req, res, next) => { 
 const {email} = req.body   
  try{ 
    let user = await User.findOne({ email: email });       
       if(user){
           const otp = generateOtp()
             user.otp = otp;
             sendMail(user.email,otp)
             await user.save();
           res.send({
              statuscode:200,
              message: 'Email Send Succesfully ',
             })
        }
        else{
          res.send({
            statuscode:404,
            message: 'Email does not found ', })
        }      
    }
    catch(err){
      res.send({
        statuscode: 500,
        message: 'Internal server error',
        error:err
       });
   }
  })

exports.verifyOtp = asyncHandler(async (req, res, next) => { 
  const {otp,email} = req.body
  let user = await User.findOne({ email: email }); 
  try{
    if(user){
        if(otp){
            if(user.otp===otp){
              res.send({
                statuscode:200,
                message: 'Otp Matched Sucessfully ', 
              })}
            else{
                res.send({
                    statuscode: 400,
                    message: 'Enter The Valid OTP',
                });}
         }
        else{
          res.send({
            statuscode:404,
            message: 'Please Enter the Otp', 
          })
        }
      }
    else{
      res.send({
        statuscode:401,
        message: 'UnAuthorized User', 
      })
    }

}
catch(err){
  res.send({
    statuscode: 500,
    message: 'Internal server error',
    error:err
   });
}
})

exports.forgetPassword = asyncHandler(async (req, res, next) => {
  const { email,otp,password } = req.body;
  let user = await User.findOne({ email: email });
  try{
       if(user){
            if(user.otp === otp){
              let  newPassword = await bcrypt.hash(password, 8)
              await User.updateOne(
                { email: email },
                { $set: { password: newPassword,otp:"" } }
              )
                res.send({
                  statuscode:200,
                  message: "Pasword Changed Sucessfully",
                }); 
             }
             else{
              res.send({
                statuscode:401,
                message:"Please Enter The Valid Otp",
              });
            }
         }
       else{
        res.send({
          statuscode:404 ,
          message:"Email does not found",
        });
        }
  }
  catch(err){
     res.send({
       statuscode: 500,
       message: 'Internal Server Error',
       error:err
      });
  }
})







