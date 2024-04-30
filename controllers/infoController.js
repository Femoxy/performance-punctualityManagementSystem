const fs = require('fs')
const {userModel, onTrackModel} = require('../Models/infoModel')
const bcrypt = require ('bcrypt')
const jwt = require('jsonwebtoken')
//const gm = require('gm')
const fileUpload = require('express-fileupload')
const path = require('path')
const cloudinary = require('../middleware/cloudinary')
const {validateUser} = require('../middleware/validator')
const weeklyAttendanceModel = require('../Models/weeklyAttendanceModel')


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
        // Get the current day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
        const currentDayOfWeek = new Date().getDay();
        //Check if it is class days(Monday, Wednesday, Friday)
        if(![1,3,5].includes(currentDayOfWeek)){
            return res.status(400).json({
                message: "You can only upload on class days"
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

        //check if the user has already checkIn/uploaded that day
        const hasCheckedIn = await onTrackModel.findOne({date: currentDate})
        if(hasCheckedIn.userId === userId){
            return res.status(400).json({
                message: "You can only checkIn ones a Day"
            })
        }
        
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
            punctualityScore: score,      
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
//Function to get the assessment of a student by a reviewer
const weeklyAssessments = async (req, res)=>{
    try {
        userId = req.params.userId;
        const student = await userModel.findById(userId)
        if(!student){
            return res.status(400).json({
                message: "Student not found"
            })
        }
        // Get the current date and time
        const currentDate = new Date();
        // const localDate = currentDate.toLocaleDateString();
        // const localTime = currentDate.toLocaleTimeString();

        const currentDayOfWeek = currentDate.getDay();
        const currentHour = currentDate.getHours();

        // Check if it's the end of the week (Friday after 4 pm, Saturday, or Sunday)
        if (!((currentDayOfWeek === 5 && currentHour >= 16) || currentDayOfWeek === 6 || currentDayOfWeek === 0)) {
            // If it's not the end of the week, do nothing
            return res.status(400).json({
                message: "You can't acknowledge the student punctuality until the end of class for that week"
            });
        }

        // Calculate the start and end of the week based on the current date
        const startOfWeek = new Date(currentDate);
        //startOfWeek.setDate(currentDate.getDate() - currentDayOfWeek + (currentDayOfWeek === 0 ? -6 : 1));
        //Same as the line of code 279 but without ternary operator
        startOfWeek.setDate(currentDate.getDate() - currentDayOfWeek + (7 - currentDayOfWeek + 1));
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        //Check if punctuality has been checked for the week for this Student
        const checkAttendance = await weeklyAttendanceModel.findOne({
             userId: userId,
             weekStart: startOfWeek.toLocaleDateString()
        });
        if(checkAttendance){
            return res.status(400).json({
                message: "This Student's attendance already acknowledged for the week"
            })
        }

        //Fetch attendance data for the current week
        const attendance = await onTrackModel.find({
            userId: userId,
            date: { 
                $gte: startOfWeek.toLocaleDateString(), 
                $lte: endOfWeek.toLocaleDateString() }
        })

        // Calculate the total punctuality score for the week
        let totalPunctualityScore = 0;
        attendance.forEach(item => {
            totalPunctualityScore += item.punctualityScore; //or totalPunctualityScore = totalPunctualityScore + item.punctualityScore
        });

        // Calculate the overall average punctuality score for the week
        const averagePunctualityScore = totalPunctualityScore / attendance.length;

        // Delete the uploaded images
        attendance.forEach(async (item) => {
            try {
                 // Assuming you have a function to delete the images
            await cloudinary.uploader.destroy(item.image.public_id);
            // Remove the document from onTrackModel database
            await onTrackModel.findByIdAndDelete(item._id);
            } catch (error) {
                return res.status(500).json({
                    Error: "Error deleting Images"+ error.message
                })   
            }
        });

        // Save the weekly attendance acknowledgment
        const acknowledgment = new weeklyAttendanceModel({
            //userId: userId,
            weekStart: startOfWeek.toLocaleDateString(),
            weekEnd: endOfWeek.toLocaleDateString(),
            avgPunctualityScore: averagePunctualityScore
        });
        await acknowledgment.save();
        
        // Save acknowledgment inside userId array of weeklyAttendance
        await weeklyAttendanceModel.updateOne(
            { userId: userId },
            { $push: { acknowledgments: acknowledgment } }
        );
        // Update weekly average punctuality score for the user
       // const updatedStudent = await userModel.findByIdAndUpdate(userId, { weeklyAvg: averagePunctualityScore }, { new: true });
 
        return res.status(200).json({
            message: "Weekly assessment completed successfully",
            data: acknowledgment
            
        });

         
    } catch (error) {
        return res.status(500).json({
            error: 'Internal server error '+ error.message
        })
    }
} 

//Function to get checkIn details for a student
const getWeeklyCheckIn = async (req, res)=>{
    try {
        userId = req.params.userId;
        const student = await userModel.findById(userId)
        if(!student){
            return res.status(400).json({
                message: "Student not found"
            })
        }
        // Get the current date and time
        const currentDate = new Date();
        // const localDate = currentDate.toLocaleDateString();
        // const localTime = currentDate.toLocaleTimeString();

        const currentDayOfWeek = currentDate.getDay();

        // Calculate the start and end of the week based on the current date
        const startOfWeek = new Date(currentDate);
        //startOfWeek.setDate(currentDate.getDate() - currentDayOfWeek + (currentDayOfWeek === 0 ? -6 : 1));
        //Same as the line of code 279 but without ternary operator
        startOfWeek.setDate(currentDate.getDate() - currentDayOfWeek + (7 - currentDayOfWeek + 1));
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const weeklyCheckIn = await onTrackModel.find({
            userId:userId,
            date:{
                $gte: startOfWeek.toLocaleDateString(), 
                $lte: endOfWeek.toLocaleDateString()
             }   
        });
        if(!weeklyCheckIn){
            return res.status(400).json({
                message: "The student attendance data not found"
            })
        }
        
        // Aggregate punctuality scores for the week
        const aggregatedData = weeklyCheckIn.reduce((acc, curr) => {
            const { punctualityScore } = curr;

            acc.totalScore += punctualityScore;
            acc.count++;

            return acc;
        }, { totalScore: 0, count: 0 });

        const averagePunctualityScore = aggregatedData.totalScore / aggregatedData.count;

        return res.status(200).json({
            message: "Student check-in data for the week",
            data: weeklyCheckIn,
            averagePunctualityScore: averagePunctualityScore
        });

    } catch(error){
        return res.status(500).json({
            error: "Internal server error " +error.message
        })
    }
}

//Function to get checkIn details for all student
const getAllWeeklyCheckIn = async (req, res)=>{
    try {
        
        // Get the current date and time
        const currentDate = new Date();
        // const localDate = currentDate.toLocaleDateString();
        // const localTime = currentDate.toLocaleTimeString();

        const currentDayOfWeek = currentDate.getDay();
      
        // Calculate the start and end of the week based on the current date
        const startOfWeek = new Date(currentDate);
        //startOfWeek.setDate(currentDate.getDate() - currentDayOfWeek + (currentDayOfWeek === 0 ? -6 : 1));
        //Same as the line of code 279 but without ternary operator
        startOfWeek.setDate(currentDate.getDate() - currentDayOfWeek + (7 - currentDayOfWeek + 1));
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const weeklyCheckIn = await onTrackModel.aggregate([
            {
                $match: {
                    date: {
                        $gte: startOfWeek.toLocaleDateString(),
                        $lte: endOfWeek.toLocaleDateString()
                    }
                }
            },
            {
                $group: {
                    _id: "$userId",
                    checkIns: { $push: "$$ROOT" }
                }
            }
        ]);
        if(!weeklyCheckIn || weeklyCheckIn.length === 0){
            return res.status(400).json({
                message: "Attendance data not found"
            })
        }
        return res.status(200).json({
            message: `There are ${weeklyCheckIn.length} Students checkIn data for the week`,
            data: weeklyCheckIn
        })

    } catch(error){
        return res.status(500).json({
            error: "Internal server error " +error.message
        })
    }
}

//Function to get a student attendance data for the week
 const oneStudentAttendanceData = async(req, res)=>{
    try {
        const userId = req.params.id;
                // Get the current date and time
                const currentDate = new Date();
                // const localDate = currentDate.toLocaleDateString();
                // const localTime = currentDate.toLocaleTimeString();
        
                const currentDayOfWeek = currentDate.getDay();
        
                // Calculate the start and end of the week based on the current date
                const startOfWeek = new Date(currentDate);
                //startOfWeek.setDate(currentDate.getDate() - currentDayOfWeek + (currentDayOfWeek === 0 ? -6 : 1));
                //Same as the line of code 279 but without ternary operator
                startOfWeek.setDate(currentDate.getDate() - currentDayOfWeek + (7 - currentDayOfWeek + 1));
                startOfWeek.setHours(0, 0, 0, 0);
        
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                endOfWeek.setHours(23, 59, 59, 999);

        const oneWeekAttendanceDataSummary = await weeklyAttendanceModel.find({
            userId:userId,
            weekStart:{
                 $gte: startOfWeek.toLocaleDateString()
            },
            weekEnd: {
                $lte: endOfWeek.toLocaleDateString()
            }
        })
        if(!oneWeekAttendanceDataSummary){
            return res.status(404).json({
                message: 'Student Attendace data summary for the week not Found'
            })
        }
        return res.status(200).json({
            message: "Summary of a student attendance for this week",
            data: oneWeekAttendanceDataSummary
        })
        
    } catch (error) {
        return res.status(500).json({
            error: "Imternal sever error "+error.message
        })
    }
 }

//Function to get attendance data for all student for the week
const getAllAttendanceData = async(req, res)=>{
    try {
        const userId = req.params.id;
                // Get the current date and time
                const currentDate = new Date();
                // const localDate = currentDate.toLocaleDateString();
                // const localTime = currentDate.toLocaleTimeString();
        
                const currentDayOfWeek = currentDate.getDay();
        
                // Calculate the start and end of the week based on the current date
                const startOfWeek = new Date(currentDate);
                //startOfWeek.setDate(currentDate.getDate() - currentDayOfWeek + (currentDayOfWeek === 0 ? -6 : 1));
                //Same as the line of code 279 but without ternary operator
                startOfWeek.setDate(currentDate.getDate() - currentDayOfWeek + (7 - currentDayOfWeek + 1));
                startOfWeek.setHours(0, 0, 0, 0);
        
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                endOfWeek.setHours(23, 59, 59, 999);

        const generalAttendanceDataSummary = await weeklyAttendanceModel.find({
            weekStart:{
                 $gte: startOfWeek.toLocaleDateString()
            },
            weekEnd: {
                $lte: endOfWeek.toLocaleDateString()
            }
        })
        if(!generalAttendanceDataSummary || generalAttendanceDataSummary.length===0){
            return res.status(404).json({
                message: 'No attendance data for all student'
            })
        }
        return res.status(200).json({
            message: "Summary of a student attendance for this week",
            data: generalAttendanceDataSummary
        }) 
        
    } catch (error) {
        return res.status(500).json({
            error: "Internal server error "+error.message
        })
    }
 }

//Function to delete checkIn data
//Function to delete a Full week checkIn data
//Function to delete attendance summarry data for the week



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
            





module.exports = {signUp, logIn, createData, weeklyAssessments, getWeeklyCheckIn, getAllWeeklyCheckIn, oneStudentAttendanceData, getAllAttendanceData, deleteImages, logOut}