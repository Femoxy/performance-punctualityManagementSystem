const express = require('express')
const router = express.Router()

const {signUp, logIn, createData, getOneData, logOut, deleteImages} = require('../controllers/infoController')
const {userAuthentication} = require('../middleware/auth');
//const mediaUpload = require('../middleware/multer');



router.post('/signup', signUp)
router.post('/login', logIn)
router.post('/location', userAuthentication, createData)
router.delete('/deleteimage', userAuthentication, deleteImages)
router.get('/oneUserUpload/:id',  getOneData)
router.post('/logout', userAuthentication, logOut)

module.exports= router