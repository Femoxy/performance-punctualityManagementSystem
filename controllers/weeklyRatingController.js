const {userModel} = require('../Models/infoModel');
const weeklyAttendance = require('../Models/weeklyAttendanceModel');
const backendSOTW = require('../Models/backendSOTW');
const frontendSOTW = require('../Models/frontendSOTW');
const productDesignSOTW = require('../Models/productD_SOTW');
const ratingsModel = require('../Models/ratingsModel')

const createWeeklyRating = async (req,res)=>{
    try {
        const today = new Date();
        const userId = req.params.userId;
        //check if the student is in the database
        const checkStudent = await userModel.findById(userId);
        if(!checkStudent){
            return res.status(404).json({
                message: "Student not found"
            });
        }
         const checkWeeklyRating = await ratingsModel.findOne({week:week, student: userId}) 
         if(checkWeeklyRating){
            return res.status(400).json({
                message: `Week ${week} Ratings already entered for student ${checkStudent.fullName} ` 
            })
         }
            // Destructure the required fields from req.body
        const { punctuality, Assignment, personalDefense, classParticipation, classAssessment, week } = req.body;

        // Calculate total score
        const totalScore = [punctuality, Assignment, personalDefense, classParticipation, classAssessment].reduce((acc, curr) => acc + curr, 0);
        //Alternatively
        //const fields = [punctuality, Assignment, personalDefense, classParticipation, classAssessment]
        //const sum = fields.reduce((acc, curr)=> acc + curr, 0)

        // Create a new ratings document
        const newRating = new ratingsModel({
            punctuality: punctuality,
            Assignment: Assignment,
            personalDefense: personalDefense,
            classParticipation: classParticipation,
            classAssessment: classAssessment,
            total: totalScore,
            week: week
        });

        //Push total score to the allRating array
         checkStudent.allRatings.push(newRating.total)
        //   // Calculate total number of ratings
        //   const ratings = await ratingsModel.find({ student: userId });
        //   const count = ratings.length;
  
          // Calculate max total
          const maxTotal = 5 * 20; // Assuming each category has a maximum score of 5 and there are 'count' ratings documents
  
          // Student overallrating percentage score
          const percentageScore = (totalScore / maxTotal) * 100;
          checkStudent.overallRating = percentageScore
          
        //Push the student ID into Ratings document
         newRating.student.push(checkStudent)
         // Save the new rating to the database
         await newRating.save();
         await checkStudent.save();

         return res.stauts(200).json({
            message: "Student Performance graded successfully",
            rating: newRating
         })

    } catch (error) {
        return res.status(500).json({
            error: "Internal server error: "+ error.message
        })
    }
}

//To get a student rating data
const studentRating = async(req, res)=>{
    try {
        const ratingId = req.params.ratingId;
        const rating = await ratingsModel.findById(ratingId)
        if(!rating){
            return res.status(404).json({
                message: 'Rating not found'
            })
        }
        return res.status(200).json({
            message: "Ratings successfully shown",
            data: rating
        });
        
    } catch (error) {
        return res.status(500).json({
            Error:"Internal server error: "+error.message
        })
    }
}

//To get all student ratings
const allStudentRatings = async (req, res) => {
    try {
        const studentRatings = await ratingsModel.aggregate([
            {
                $group: {
                    _id: "$student",
                    ratings: { $push: "$$ROOT" }
                }
            }
        ]);

        if (!studentRatings || studentRatings.length === 0) {
            return res.status(404).json({
                message: "No ratings found"
            });
        }

        return res.status(200).json({
            message: `${studentRatings.length} student(s) found with ratings`,
            studentRatings: studentRatings
        });

    } catch (error) {
        return res.status(500).json({
            Error: "Internal server error: " + error.message
        });
    }
};

//Update a student rating
const updateRating = async(req, res)=>{
    try {
        const userId = req.params.userId;
        const student = await userModel.findById(userId);
        if(!student){
            return res.status(404).json({
                message:" Student not found"
            });
        }
        const ratingId= req.params.ratingId;
        const getRating= await ratingsModel.findById(ratingId);
        if(!getRating){
            return res.status(404).json({
                message: 'Rating not found'
            });
        }
        const ratingInfo ={
            punctuality: req.body.punctuality || getRating.punctuality,
            Assignment: req.body.Assignment || getRating.Assignment,
            personalDefense: req.body.personalDefense || getRating.personalDefense,
            classParticipation: req.body.classParticipation || getRating.classParticipation,
            classAssessment: req.body.classAssessment || getRating.classAssessment,
            week: req.body.week || getRating.week,
            student: getRating.student
        }
        //calculate total score
        const totalScore = Math.round([ratingInfo.punctuality, ratingInfo.Assignment, ratingInfo.personalDefense, ratingInfo.classParticipation, ratingInfo.classAssessment].reduce((acc, curr)=>acc + curr, 0))
        ratingInfo.total = totalScore
        //update AllRating Array
        const indexToUpdate = student.allRatings.indexOf(getRating.total)
        if(indexToUpdate!==-1){
            student.allRatings[indexToUpdate]=totalScore;
            if(student.allRatings.length===0){
                return res.status(200).json({
                    message: 'No Rating found yet'
                })
            }
        }
        //update overallRating to the latest
        const addUp = student.allRatings.reduce((acc, value)=>acc + value, 0)
        const count = student.allRatings.length;
        const average = addUp/count ;
        student.overallRating = average * 100;
        //save the updated field in student document
        await student.save();
        //update rating document
        const updatedRating = await ratingsModel.findByIdAndUpdate(userId, ratingInfo, {new: true});
        if(!updatedRating){
           return res.status(400).json({
            message: "Unable to update ratings"
           });
        }
        return res.status(200).json({
            message: "Rating Update successful",
            rating: updatedRating
        })
    } catch (error) {
        return res.status(500).json({
            error: 'Internal server error: '+ error.message
        })
    }
}

//Function to delete a rating for a specific student
const deleteRating = async(req, res)=>{
    try {
        const ratingId = req.params.ratingId;
        const checkRating = await ratingsModel.findById(ratingId);
        if(!checkRating){
            return res.status(404).json({
                message: "Rating not found"
            });
        }
        const ratingToDelete = await ratingsModel.findByIdAndDelete(ratingId)
        if(!ratingToDelete){
            return res.status(400).json({
                message: "Unable to delete"
            })
        }else{
            return res.status(200).json({
                message: "Deleted successfully"
            })
        }
        
    } catch (error) {
        return res.status(500).json({
            Error: "Internal server error "+ error.message
        })
    }
}

//Function to get student of the week based on stack

        const selectSOTWForStack = async (stack, week, ratingsModel) => {
            try {
                // Fetch ratings for the specified stack and week
                const ratings = await ratingsModel.find({ week }).populate('student');
                
                // Filter ratings by stack and role ('student')
                const filteredRatings = ratings.filter(rating => rating.student.stack === stack && rating.student.role === 'student');
                
                // If no students found for the stack, return null
                if (filteredRatings.length === 0) {
                    return new Error(`Student not found for ${stack} stack in week ${week}`)
                }
             // Find the student with the highest total score
        let maxScoreStudent = filteredRatings[0].student;
        let maxScore = filteredRatings[0].total;
        
        for (let i = 1; i < filteredRatings.length; i++) {
            if (filteredRatings[i].total > maxScore) {
                maxScoreStudent = filteredRatings[i].student;
                maxScore = filteredRatings[i].total;
            }
        }
        
        return { student: maxScoreStudent, score: maxScore };
    } catch (error) {
        throw new Error(`Error selecting SOTW for ${stack} stack in week ${week}: ${error.message}`);
    }
};
        
         