const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    fullName: String,
    phoneNumber: String,
    password: String,
    weeklyAvg: Number,
    punctualityCheck:[{
        type: mongoose.Schema.Types.ObjectId,
    ref: "getLocation"
    }]
}, {timestamps: true})

const userModel = mongoose.model('users', userSchema)

const locationSchema = new mongoose.Schema({

    time: {
        type: String},
    date:{
        type: String},
    location:{
        type: String},
    image:{
         url: {
            type: String
         },
        public_id:{
            type: String
        }
    },
    score: { 
        type: String},
    
   userId: {
    type:String
   }
}, {timestamps: true})
const onTrackModel = mongoose.model('getlocation', locationSchema)


module.exports = {onTrackModel, userModel }