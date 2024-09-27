const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const ErrorResponse = require('../utils/errorResponse')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        default: '',
        required: false,
        trim: true,
        maxlength: [30, 'Name can not be more than 30 character']
    },
    email: {
        type: String,
        required: false,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,64})+$/, 'Please add a valid email'
        ],
        lowercase: true
    },
    dob: {
        type: String,
        required: false,
    },
    otp:{
       type:String,
       required:false
    },
    phone_number:{
        type:String,
        required:false
    },
    pincode:{
        type:Number,
        required:false
    },
    user_type: {
        type: Number,
        default: 2 //1-admin, 2-app user
    },
    account_verification_code: {
        type: String,
        default: ''
    },
    token: {
        type: String,
    },
    is_active: {
        type: Number,
        default: 1 
    },
    is_deleted: {
        type: Number,
        default: 0
    },
    created_at: {
        type: Date,
        default: Date.now
    }
})

userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject()
    delete userObject.password
    delete userObject.token
    delete userObject.__v
    return userObject
}

userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({
        _id: user._id.toString()
    }, process.env.JWT_SECRET)
    //user.tokens = user.tokens.concat({token})
    user.token = token
    await user.save()
    return token
}

userSchema.statics.findByCredentials = async (email, password) => {
    let findQuery = {
        email,
        is_deleted: 0
    }

    try {
        const user = await User.findOne(findQuery);
        
        if (!user) {
            throw new ErrorResponse('Email does not exist', 404); // Use appropriate HTTP status code for "Not Found"
        }

        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            throw new ErrorResponse('Invalid login credentials', 401); // Use appropriate HTTP status code for "Unauthorized"
        }

        return user;
    } catch (error) {
        // Forward the error to the calling function
        throw error;
    }
}

userSchema.statics.checkOldPassword = async (userId, oldPassword) => {
    const user = await User.findOne({
        _id: userId
    })
    if (!user) {
        throw new ErrorResponse('User does not exist', 404)
    }
    const isMatchpass = await bcrypt.compare(oldPassword, user.password)
    if (!isMatchpass) {
        throw new ErrorResponse('Invalid Old Password', 401)
    }
    return user
}


userSchema.pre('save', async function (next) {
    const user = this
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }
    next()
})

const User = mongoose.model('User', userSchema)
module.exports = User