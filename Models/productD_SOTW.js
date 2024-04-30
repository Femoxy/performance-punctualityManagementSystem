const mongoose = require('mongoose')

const productDesignSOTWSchema = new mongoose.Schema({
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

const productDesignSOTWModel = mongoose.model('productDesignSOTW', productDesignSOTWSchema)

module.exports = productDesignSOTWModel