const jwt = require('jsonwebtoken');
const {userModel} = require('../Models/infoModel');
const { timeout } = require('cron');
require('dotenv').config();

const userAuthentication = async(req,res, next)=>{
    try {
        const hasAuthorization = req.headers.authorization
        if(!hasAuthorization){
            return res.status(404).json('User not authorized')
        }
        const token = hasAuthorization.split(" ")[1];
        if(!token){
            return res.status(404).json('Token not found')
        }
        const decodeToken = jwt.verify(token, process.env.secret)
        const user = await userModel.findById(decodeToken.userId)
        if(!user){
            return res.status(404).json('User not found or You are not logged in')
        }
        
        req.user=decodeToken

        next()
    } catch (error) {
        if (err instanceof jwt.JsonWebTokenError){
            return res.status(501).json({
                message: 'Session timeout, please login to continue'
            })
        }
        return res.status(500).json({
            Error: "error authenticating: " +error.message,
        })
    }

}

//Authorized users to getAll Information

const admin = (req, res, next)=>{
    userAuthentication(req, res, async()=>{
        if(req.user.isAdmin){
            next()
        } else {
            return res.status(400).json({
                message: "Not an Admin! You are not authorized"
            })
        }
    })
}

module.exports= {userAuthentication, admin}