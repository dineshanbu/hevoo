const mongoose = require('mongoose');

// Schema for role types
const roleTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true // Name for each role type
    }
});

const rolesModelSchema = new mongoose.Schema({
    role_name: {
        type: String,
        required: true
    },
    role_types: [roleTypeSchema], // Array of role type objects
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

const businessRole = mongoose.model("Roles", rolesModelSchema);

module.exports = businessRole;
