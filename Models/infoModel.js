const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    fullName:{
        type: String
    },
    email: {
        type: String
    },
    phoneNumber:{
        type: String
    },
    password:{
        type: String
    },
    stack: {
        type: String
    },
    role:{
        type: String,
        default: 'student'
    },
    cohort: {
        type: Number
    },
    allRatings: {
        type: Array
    },
    overallRating: {
        type: Number
    },
    weeklyRating: {
        type: Number
    },
    nominated: {
        type: Boolean,
        default: false
    },
    frontendSOTW: {
        type: Boolean,
        default: false
    },
    backendSOTW: {
        type: Boolean,
        default: false
    },
    productDesignSOTW: {
        type: Boolean,
        default: false
    },
    frontendSOTM: {
        type: Boolean,
        default: false
    },
    backendSOTM: {
        type: Boolean,
        default: false
    },
    productDesignSOTM: {
        type: Boolean,
        default: false
    },
    token:{
        type: String
    }

}, {timestamps: true})

const userModel = mongoose.model('users', userSchema)

const locationSchema = new mongoose.Schema({

    time: {
        type: String
    },
    date:{
        type: String
    },
    location:{
        type: String
    },
    image:{
         url: {
            type: String
         },
        public_id:{
            type: String
        }
    },
    punctualityScore: { 
        type: Number
    }, 
    
   userId: {
    type:String
   }
}, {timestamps: true})
const onTrackModel = mongoose.model('punctualityChecks', locationSchema)


module.exports = {onTrackModel, userModel }