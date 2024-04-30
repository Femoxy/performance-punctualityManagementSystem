const mongoose = require('mongoose')

const backendSOTMSchema = new mongoose.Schema({
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

const backendSOTMModel = mongoose.model('backendSOTM', backendSOTMSchema)

module.exports = backendSOTMModel