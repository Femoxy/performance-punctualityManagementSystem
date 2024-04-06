const fs = require('fs')
const {userModel, onTrackModel} = require('../Models/taskModel')
const bcrypt = require ('bcrypt')
const jwt = require('jsonwebtoken')
const gm = require('gm')
//const cron = require('cron')
const fileUpload = require('express-fileupload')
const path = require('path')
const cloudinary = require('../middleware/cloudinary')
const {validateUser} = require('../middleware/validator')
const { id } = require('@hapi/joi/lib/base')
//const auth = require('../middleware/auth')


const signUp = async (req,res)=>{
    try {
        const {error} = validateUser(req.body)
        if(error){
            return res.status(500).json(error.details[0].message)
        } else {
            const {fullName, phoneNumber, password} = req.body
            const checkUser = await userModel.findOne({phoneNumber})
            if(checkUser){
                return res.status(400).json({
                    message: 'User already exist'
                })
            }
            const hashPassword = bcrypt.hashSync(password, 12)
            const user = new userModel({
                fullName,
                password:hashPassword,
                phoneNumber,  
            })
            await user.save();
            return res.status(200).json({
                message: "Account creation successful",
                data: user
            })
    
        }
        
    } catch (error) {
        return res.status(500).json({
            error: error.message
        })
    }

}

const logIn = async (req,res)=>{
    try {
        const {password, phoneNumber}= req.body;
        //const userId = req.params.id
        const checkUser = await userModel.findOne({phoneNumber})
        if(!checkUser){
            return res.status(400).json({
                message: 'Invalid password or phoneNumber'
            })
        } 
        
       const checkPassword = bcrypt.compareSync(password, checkUser.password);
       if(!checkPassword){
            return res.status(404).json('Invalid Email or Password')
         }
        else {
            const token = jwt.sign({
                userId: checkUser._id,
                fullName: checkUser.fullName,
                phoneNumber: checkUser.phoneNumber
            }, process.env.secret, { expiresIn: '1d' })
            return res.status(200).json({
                message: 'Login successful',
                data: token
            })
        }
        
    } catch (error) {
        return res.status(500).json({
            error: error.message
        })
    }
}




const createData = async (req,res)=>{
    try {
        
        const {location} = req.body
        const userId = req.user.userId
        const checkUser = await userModel.findById(userId)
        if(!checkUser){
            return res.status(404).json({
                message: 'user not found'
            })
        } 
        
        // Get the current time and Date at API level
        const currentDate = new Date().toLocaleDateString();
        const currentTime = new Date().toLocaleTimeString();

         // Check if the user has already uploaded an image for the current day
         const existingImage = await onTrackModel.findOne({
            userId: userId,
            date: currentDate
        });

        if (existingImage) {
            return res.status(400).json({
                message: 'You have already uploaded an image for today'
            });
        }

        const studentImage = req.files && req.files.image;
       
        //Prevent the student from uploading more than one image
        if(Array.isArray(studentImage) || studentImage.length > 1){
            return res.status(400).json({
            message: "Only one image file can be uploaded"})
        }
        if(!studentImage){
            return res.status(400).json({
                message: "No Image file provided"
            }) 
        }
        const fileExtension = path.extname(studentImage.name).toLowerCase();
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
        if(!allowedExtensions.includes(fileExtension)){
            return res.status(400).json({
                message: 'Only image files are allowed'
            })
        }
           
           
        // Adjusted transformation string
        // const transformationString = `text:arial_20_bold:Location:${location}| Date:${currentDate}| Time:${currentTime}`;
        
        const overlayText = `text:arial_20_bold:Location%3A%20${encodeURIComponent(location)}%2C%20Date%3A%20${encodeURIComponent(currentDate)}%2C%20Time%3A%20${encodeURIComponent(currentTime)}`;

        const result = await cloudinary.uploader.upload(studentImage.tempFilePath, {
            folder: 'Image-Upload', 
            overwrite: true,
            tags: ['location', 'time', 'date'],
            transformation: [
                { width: 500, height: 500, crop: 'fill' }, // Resize the image
                { overlay: overlayText, gravity: 'south_east', color: 'white', opacity: 80, width: 400 } // Add watermark
            ]
        })
        // cloudinary.studentImage(result.public_id,  { 
        //     transformation: [
        //         { overlay: { 
        //             font_family: "Arial",
        //             font_size: 20,
        //             text: transformationString,
        //             gravity: "south_east",
        //             color: "Gray",
        //             x: 10, // Optional: Adjust the x and y offsets for positioning
        //             y: 10
        //         } }
        //     ]
        // })
        
        fs.unlinkSync(studentImage.tempFilePath); 

        //Appoint score based on the time of image upload
            const uploadTime = new Date();

            const currentHour = uploadTime.getHours();
            const currentMinute = uploadTime.getMinutes();
    
            let score = 0;
    
            if (currentHour < 9 || (currentHour === 9 && currentMinute <= 45)) {
                // Before 9:45 AM, score 20 marks
                score = 20;
            } else if (currentHour === 9 && currentMinute >= 45) {
                // Between 9:45 AM and 10:00 AM, score 10 marks
                score = 10;
            } else {
                // 10:00 AM or later, score 0 marks
                score = 0;
            }
            
           
    //console.log(result)
        const newData = new onTrackModel({
            date: currentDate,
            time: currentTime,
            location: location,
            image:{ url: result.secure_url,
            public_id: result.public_id},
            score: score,      
            userId: userId
        })
    //console.log(newData)
        
        await newData.save();
        checkUser.punctualityCheck.push(newData)
       await checkUser.save()
       
         res.status(200).json({
            message: 'Data entered successfully', 
            data: newData
        })

    //} 
            
        
    } catch (error) {
        return res.status(500).json({
            error: error.message
        })
    }   
}

const getOneData = async (req,res)=>{
    try {
        const userId = req.params.id
        const checkUser = await onTrackModel.findById(userId);
       
        if(!checkUser){
            return res.status(404).json('User not Found')
        } else{
            return res.json({
                message: ` Account information`,
                checkUser
            })
        }
        
    } catch (error) {
        return res.status(500).json(error.message)
    }
}



     // Define the function to delete user images
      const deleteImages = async (req, res) => {
         try {
             const userId = req.user.userId
                
             const userDocuments = await onTrackModel.find({ userId:userId });

                // Define the start and end dates of the week
                const endDate = new Date(); // Current date
                const startDate = new Date(endDate);
                startDate.setDate(endDate.getDate() - 7); // One week ago
        
                // Query the database to find images uploaded by the user within the past week
                const userImages = await onTrackModel.find({ userId: userId, date: { $gte: startDate, $lte: endDate } });
        
                let totalScore = 0;
        
                // Calculate the total score
                userImages.forEach(image => {
                    totalScore += image.score;
                });
        
                // Calculate the average score
                //const averageScore = userImages.length > 0 ? totalScore / userImages.length : 0;
                let averageScore = 0;
                   if (userImages.length > 0) {
                   averageScore = totalScore / userImages.length;
                    } 

                const checkAvg = await userModel.findByIdAndUpdate(userId, {weeklyAvg: averageScore}, {new: true}).select(['weeklyAvg'])
              
        // Iterate over each document
        for (const document of userDocuments) {
            // Delete the image from Cloudinary
            await cloudinary.uploader.destroy(document.image.public_id);

            // Remove the document from onTrackModel
            await onTrackModel.findByIdAndDelete(document._id);
        }
            return res.status(200).json({
                message: `Deleted ${userDocuments.length} image(s) for user ${userId}`,
                Data: checkAvg
            })
                   // console.log(`Deleted ${userDocuments.length} images for user ${userId}`);
                } catch (error) {
                   return res.status(500).json({
                    error: 'Error deleting images:'+ error.message});
                }
            };
            



//Signout
const logOut = async (req, res) => {
    try {
        const userId = req.user.userId

        // Find the agent by ID
        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Invalidate the token by setting it to null
        user.token = null;
        await user.save();

        res.status(200).json({ message: 'logout successful' });
        
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
        
    }
}

module.exports = {signUp, logIn, createData, getOneData, deleteImages, logOut}