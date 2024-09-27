// models/UserState.js

const mongoose = require('mongoose');

const UserStateSchema = new mongoose.Schema({
    senderId: { type: String, required: true, unique: true },
    step: { type: String, default: 'initial' },
    name: { type: String },
    mobile: { type: String },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserState', UserStateSchema);
