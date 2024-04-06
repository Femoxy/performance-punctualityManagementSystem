const mongoose = require('mongoose');
const dbHost = 'localhost:27017'
const dbName = 'locationApi'

mongoose.connect(`mongodb://${dbHost}/${dbName}`)
.then(()=>{
    console.log("Database Connection established")
}).catch((error)=>{
    console.log(error.message)
})