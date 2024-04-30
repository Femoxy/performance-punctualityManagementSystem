const mongoose = require('mongoose');

const weeklyAttendanceSchema = new mongoose.Schema({
    userId :{
        type: String
    },
    weekStart:{
        type: String
    },
    weekEnd: {
        type: String
    },
    avgPunctualityScore:{
        type: Number
    }
}, {timestamps: true})

const weeklyAttendanceModel = mongoose.model('weeklyAttendance', weeklyAttendanceSchema)

module.exports = weeklyAttendanceModel