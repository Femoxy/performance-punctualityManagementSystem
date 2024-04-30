const express = require('express')
require("./config/dbConfig")
require('dotenv').config()
const fileUpload = require('express-fileupload')

const router = require('./routers/router')
const app = express();

app.use(fileUpload({
    useTempFiles: true,
    limits:{ fileSize: 5 * 1024 * 1024 }
}));
app.use(express.json());

app.get('/', (req, res) =>{
    res.send('Welcome to The Curve Africa Performance Management System')
})
 
app.use(router)

const port= process.env.PORT
app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`)
})