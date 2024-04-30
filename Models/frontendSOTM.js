const mongoose = require('mongoose')

const frontendSOTMSchema = new mongoose.Schema({
student: [{
    type: mongoose.Schema.Types.ObjectId,
    ref:"users"
 }],
month:{
    type: String
},
score:{
    type: Number
}
}, {timestamps: true})

const frontendSOTMModel = mongoose.model('frontendSOTM', frontendSOTMSchema)

module.exports = frontendSOTMModel