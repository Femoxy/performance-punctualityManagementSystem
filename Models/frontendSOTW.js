const mongoose = require('mongoose')

const frontendSOTWSchema = new mongoose.Schema({
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

const frontendSOTWModel = mongoose.model('frontendSOTW', frontendSOTWSchema)

module.exports = frontendSOTWModel