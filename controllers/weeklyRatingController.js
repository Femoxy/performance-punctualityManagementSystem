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


const selectSOTW = async (stack, week, ratingsModel, userModel) => {
    try {
        const selectedSOTW = await selectSOTWForStack(stack, week, ratingsModel, userModel);
        
        if (!selectedSOTW) {
            throw new Error(`No student found for ${stack} stack in week ${week}!`);
        }
        
        // Update userModel to indicate the selected SOTW for the stack
         await userModel.findOneAndUpdate(
            { stack, role: 'student' }, // Query to find students of the specified stack
            { $set: { [`${stack} SOTW`]: selectedSOTW.student._id } } // Update SOTW field for the stack
        );
        if(selectedSOTW.stack === "Backend"){
            await userModel.findByIdAndUpdate(selectedSOTW.student._id, {backendSOTW: true}, {new: true})
        }
        if(selectedSOTW.stack === "Frontend"){
            await userModel.findByIdAndUpdate(selectedSOTW.student._id, {frontendSOTW: true}, {new: true})
        }
        if(selectedSOTW.stack === "Product Design"){
            await userModel.findByIdAndUpdate(selectedSOTW.student._id, {productDesignSOTW: true}, {new: true})
        }
        return selectedSOTW.student;
        //return updateSOTW
    } catch (error) {
        throw new Error(`Error selecting SOTW for ${stack} stack in week ${week}: ${error.message}`);
    }
};
        
const selectSOTWs = async (week, ratingsModel, userModel) => {
    try {
        const stacks = ['Frontend', 'Backend', 'product Design'];
        const selectedSOTWs = {};
        
        for (const stack of stacks) {
            const selectedSOTW = await selectSOTW(stack, week, ratingsModel, userModel);
            selectedSOTWs[stack] = selectedSOTW;
        }
        
        return selectedSOTWs;
    } catch (error) {
        throw new Error(`Error selecting SOTWs for week ${week}: ${error.message}`);
    }
};

const SOTW = async (req, res)=>{
    try {
        const week = req.body.week;
         // Select SOTW for Backend stack
         const selectedBackendSOTW = await selectSOTW('backend', week, ratingsModel, backendSOTW);
         // Select SOTW for Frontend stack
         const selectedFrontendSOTW = await selectSOTW('frontend', week, ratingsModel, frontendSOTW);
         // Select SOTW for Product Design stack
         const selectedProductSOTW = await selectSOTW('productDesign', week, ratingsModel, productDesignSOTW); 
         // Return successful response with selected SOTW for each stack
         return res.status(200).json({
             message: "Student of the week successfully selected for the following stacks:",
             Backend: selectedBackendSOTW,
             Frontend: selectedFrontendSOTW,
             ProductDesign: selectedProductSOTW,
         });
     } catch (error) {
         // Return error response if any error occurs during the process
         return res.status(500).json({ message: "Internal Server Error: " + error.message });
     }
 };
        
  //Function to handle student of the week by stack
  const getSOTWByStackAndWeek = async(req, res)=>{
    try {
        const {stack, week} = req.body;
        const selectedBackendSOTW = await backendSOTW.findOne(stack=== 'Backend').populate("student");
        // Select SOTW for Frontend stack
        const selectedFrontendSOTW = await frontendSOTW.findOne(stack=== 'Frontend').populate("student");
        // Select SOTW for Product Design stack
        const selectedProductSOTW = await productDesignSOTW.findOne(stack=== 'Product Design').populate("student"); 
        if(stack=== 'Backend'){
            return selectedBackendSOTW
        }
        if(stack=== 'Frontend'){
            return selectedFrontendSOTW
        }
        if(stack=== 'Product Design'){
            return selectedProductSOTW
        }
        
    } catch (error) {
        return res.status(500).json({error:"Internal server error "+ error.message})
    }
  }

  //Function to view the SOTW for a particular week and for all stacks
const viewSOTW = async (req, res) => {
    try {
        const week = req.body.week;

        // fetch SOTW for Backend stack
        const BackendSOTW = await SOTWbyWeek('backend', week, backendSOTW);
        // fetch SOTW for Frontend stack
        const FrontendSOTW = await SOTWbyWeek('frontend', week, frontendSOTW);
        // fetch SOTW for Product Design stack
        const ProductSOTW = await SOTWbyWeek('productdesign', week, productDesignSOTW);

        return res.status(200).json({
            message: "Student of the week successfully fetched for the following stacks:",
            Backend: BackendSOTW,
            Frontend: FrontendSOTW,
            ProductDesign: ProductSOTW,
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error: " + error.message,
        })
    }
}

//Function to delete a backend SOTW document
const deletebSOTW = async (req, res) => {
    try {
        const id = req.params.id
        const bSOTW = await backendSOTW.findById(id);
        if (!bSOTW) {
            return res.status(404).json({
                message: "Backend SOTW not found",
            })
        }

        const deletebSOTW = await backendSOTW.findByIdAndDelete(id);
        if (!deletebSOTW) {
            return res.status(400).json({
                message: "Unable to delete Backend SOTW Data"
            });
        }

        return res.status(200).json({
            message: "SOTW data for backend deleted successfully",
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error: " + error.message,
        })
    }
}

//Function to delete a frontend SOTW document
const deleteFSOTW = async (req, res) => {
    try {
        const id = req.params.id
        const FSOTW = await frontendSOTW.findById(id);
        if (!FSOTW) {
            return res.status(404).json({
                message: "Frontend SOTW not found",
            })
        }

        const deleteFSOTW = await frontendSOTW.findByIdAndDelete(id);
        if (!deleteFSOTW) {
            return res.status(400).json({
                message: "Unable to delete Frontend SOTW Data"
            });
        }

        return res.status(200).json({
            message: "SOTW data for frontend deleted successfully",
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error: " + error.message,
        })
    }
}



//Function to delete a Product design SOTW document
const deletePSOTW = async (req, res) => {
    try {
        const id = req.params.id
        const PSOTW = await productDesignSOTW.findById(id);
        if (!PSOTW) {
            return res.status(404).json({
                message: "Product design SOTW not found",
            })
        }

        const deletePSOTW = await productDesignSOTW.findByIdAndDelete(id);
        if (!deletePSOTW) {
            return res.status(400).json({
                message: "Unable to delete Product design SOTW Data"
            });
        }

        return res.status(200).json({
            message: "SOTW data for product design deleted successfully",
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error: " + error.message,
        })
    }
}


  module.exports = {
    createWeeklyRating,
    studentRating,
    allStudentRatings,
    updateRating,
    deleteRating,
    SOTW,
    getSOTWByStackAndWeek
  }