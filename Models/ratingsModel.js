const mongoose = require("mongoose");

const ratingsSchema = new mongoose.Schema({
    punctuality: {
        type: Number, required: true
    },
    Assignment: {
        type: Number, required: true
    },
    personalDefense: {
        type: Number, required: true
    },
    classParticipation: {
        type: Number, required: true
    },
    classAssessment: {
        type: Number, required: true
    },
    total: {
        type: Number, required: true
    },
    student: [{
        type: mongoose.Schema.Types.ObjectId,
        ref:"users"
    }],
    week: {
        type: Number
    }

}, {timestamps: true});

const ratingsModel = mongoose.model('Ratings', ratingsSchema)

module.exports = ratingsModel
