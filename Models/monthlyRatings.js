const mongoose= require('mongoose')

const monthlySchema = new mongoose.Schema({
    student: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    month: {
        type: String
    },
    monthlyRating:{
        type: Number
    },
}, {timestamps: true});

const monthlyModel = mongoose.model('monthlyRatings', monthlySchema)

module.exports = monthlyModel;