const mongoose = require('mongoose')

const productDesignSOTMSchema = new mongoose.Schema({
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

const productDesignSOTMModel = mongoose.model('productDesignSOTM', productDesignSOTMSchema)

module.exports = productDesignSOTMModel