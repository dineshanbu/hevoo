const mongoose = require('mongoose');


const tutorModelSchema = new mongoose.Schema({
    address1: {
        type: String,
        required: false
    },
    address2: {
        type: String,
        required: false
    },
    location: {
        type: String,
        required: false
    },
    country: {
        type: String,
        required: false
    },
    pincode:{
        type: String,
        required: true
    },
    userId:{
        type: String,
        required: true
    },
    rolesId:{
        type: String,
        required: true
    },
    role_type_Id:{
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        default: new Date()
    },
    is_active: {
        type: Number,
        default: 1
    },
    is_delete: {
        type: Number,
        default: 1
    }
});

const tutorModel = mongoose.model("Tutor", tutorModelSchema);

module.exports = tutorModel;
