const mongoose = require('mongoose')

const backendSOTWSchema = new mongoose.Schema({
student: [{
    type: mongoose.Schema.Types.ObjectId,
    ref:"users"
 }],
week:{
    type: Number
},
score:{
    type: Number
}
}, {timestamps: true})

const backendSOTWModel = mongoose.model('backendSOTW', backendSOTWSchema)

module.exports = backendSOTWModel