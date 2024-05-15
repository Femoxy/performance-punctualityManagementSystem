const {userModel} = require('../Models/infoModel');
const ratingsModel = require('../Models/ratingsModel');
const monthlyModel = require('../Models/monthlyRatings');
const frontendSOTM = require('../Models/frontendSOTM');
const backendSOTM = require('../Models/backendSOTM');
const productD_SOTM = require('../Models/productD_SOTM');

require('dotenv').config();

//Get monthly ratings for a student

const monthlyRating = async(req,res)=>{
    try {
        //Get the current date
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
        // Set time to the beginning of the day for start of month
        startOfMonth.setHours(0, 0, 0, 0);
    
        // Set time to the end of the day for end of month
        endOfMonth.setHours(23, 59, 59, 999);
        //Prevent monthly rating from been generated if date is not the end of the month
        const thresholdDays = 4;
        //calculate the difference in days btw the current date and the end of the month
        const differenceInDays = Math.round(endOfMonth - currentDate)/(1000*60*60*24);
        // Check if the current date is close to the end of the month based on the threshold
        if(!(differenceInDays <= thresholdDays)){
            return res.status(200).json({
                message: "Monthly ratings cannot be generated until the end of the month"
            })
        }
        //Get Months
        const months=[
            "January", "February", "March", "April", "May", "June", "July",
            "August", "September", "October", "November", "December" 
        ];
        //check if the monthly rating has already been generated
        const checkMonthlyRating = await monthlyModel.find({month: months[currentDate.getMonth()]})
        if(checkMonthlyRating){
            return res.status(400).json({
                message: `Monthly rating already generated for the month of ${months[currentDate.getMonth()]}`
            })
        }

        const userId = req.params.userId;
        const student = await userModel.findById(userId)
        if(!student){
            return res.status(404).json({
                message: "Student not found"
            })
        }  

        const monthlyRating= await ratingsModel.findOne({
            student: userId,
            createdAt:{
                $gte: startOfMonth.toLocaleDateString(),
                $lte: endOfMonth.toLocaleDateString()
            },
        })
        //calculate all the score of each week to get the total score for the month
        let grandTotal = 0;
         monthlyRating.forEach(rating => {
          grandTotal += rating.total;
        });

        //we get the average score of the grand total
        const avgMonthlyScore = grandTotal / monthlyRating.length
          //save monthly score into the monthlyRating document
          const saveMonthlyData = new monthlyModel.create({
            student: student,
            month: months[currentDate.getMonth()],
            monthlyRating: avgMonthlyScore
          })  ;
          return res.status(200).json({
            message: "Student monthly ratings graded successfully",
            data: saveMonthlyData
          }) 
    } catch (error) {
        return res.status(500).json({
            error: "Interval server error " + error.message
        })
    }
}

const autoGenMonthlyRating = async(req,res)=>{
    try {
        //Get the current date
        const currentDate = new Date();
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
        // Set time to the beginning of the day for start of month
        startOfMonth.setHours(0, 0, 0, 0);
    
        // Set time to the end of the day for end of month
        endOfMonth.setHours(23, 59, 59, 999);
        //Prevent monthly rating from been generated if date is not the end of the month
        const thresholdDays = 4;
        //calculate the difference in days btw the current date and the end of the month
        const differenceInDays = Math.round(endOfMonth - currentDate)/(1000*60*60*24);
        // Check if the current date is close to the end of the month based on the threshold
        if(!(differenceInDays <= thresholdDays)){
            return res.status(200).json({
                message: "Monthly ratings cannot be generated until the end of the month"
            })
        }
        //Get Months
        const months=[
            "January", "February", "March", "April", "May", "June", "July",
            "August", "September", "October", "November", "December" 
        ];
        //check if the monthly rating has already been generated
        const checkMonthlyRating = await monthlyModel.find({month: months[currentDate.getMonth()]})
        if(checkMonthlyRating){
            return res.status(400).json({
                message: `Monthly rating already generated for the month of ${months[currentDate.getMonth()]}`
            })
        }
         //Fetch all student from the database
        const students = await userModel.find();
        
        const monthlyScores= [];
        for (const student of students){
            const monthlyRatings = await ratingsModel.find({
                student: student._id,
                createdAt:{
                    $gte: startOfMonth.toLocaleDateString(),
                    $lte: endOfMonth.toLocaleDateString()    
                }
            });
            //calculate all the score of each week to get the total score for the month
        let grandTotal = 0;
        monthlyRatings.forEach(rating => {
         grandTotal += rating.total;
       });

       //we get the average score of the grand total
       const avgMonthlyScore = grandTotal / monthlyRatings.length
         //save monthly score into the monthlyRating document
         const saveMonthlyData = new monthlyModel.create({
           student: student,
           month: months[currentDate.getMonth()],
           monthlyRating: avgMonthlyScore
         });
         monthlyScores.push(saveMonthlyData)
         return res.status(200).json({
           message: "Student monthly ratings graded successfully",
           data: saveMonthlyData
         }) 
        }
        
    } catch (error) {
        res.status(500).json({error:"internal server error "+ error.message})
    }
}

//view a monthly rating
const viewMonthlyRating = async(req,res)=>{
    try {
        const monthlyRatingId = req.params.id;
        const monthlyRating = await monthlyModel.findById(monthlyRatingId);
        if(!monthlyRating){
            return res.status(404).json({
                message: "Rating for the month not found"
            })
        }
        return res.status(200).json({
            message: "Monthly rating viewed successfully",
            data: monthlyRating
        })
        
    } catch (error) {
        res.status(500).json({
            error: "Internal server serror "+ error.message
        })
    }
}

//To view all monthly ratings
const getAllMonthlyRatings = async (req, res)=>{
    try {
        const allMonthlyRatings = await monthlyModel.find()
        if(!allMonthlyRatings){
            return res.status(404).json({
                message:"Issues getting all monthly Ratings of the students"
            })
        } else{
            return res.status(200).json({
                message: "Below are the monthly Ratings for all students",
                data:allMonthlyRatings
            })
        }
    } catch (error) {
        res.status(500).json({
            error:"Internal server error " + error.message
        })
    }
}

// Function to select Student of the Month (SOTM) for a specific stack
const selectSOTMForStack = async (stack, monthlyModel, sotwModel) => {
    // Fetch students' ratings for the specified stack and month
    const currentDate = new Date();
    const months = [
        "January", "February", "March", "April", "May", "June", "July",
        "August", "September", "October", "November", "December"
    ];
    const currentMonth = months[currentDate.getMonth()]

    const allRatings = await monthlyModel.find({ month: currentMonth }).populate('student');

    // Filter ratings by stack and role
    const filterByStack = allRatings.filter(rating => {
        // Check if the student's stack and role match the provided parameters
        const student = rating.student; // Assuming student is an array of objects
        const matchingStudent = student.find(s => s.stack === stack && s.role === 'student');
        return matchingStudent !== undefined; // Return true if the student matches the criteria
    });

    // If no students found for the stack, throw an error
    if (filterByStack.length === 0) {
        throw new Error(`No student found for ${stack} stack in ${currentMonth}!`);
    }

    // Map each student's score and information
    const getEachScore = filterByStack.map(score => ({
        month: score.month,
        monthlyRating: score.monthlyRating,
        student: score.student[0]
    }));
    // Extract the scores
    const scores = getEachScore.map(score => score.monthlyRating);
    // Find the maximum score
    const maxScore = Math.max(...scores);
    // Filter students with the maximum score
    const highScores = getEachScore.filter(score => score.monthlyRating === maxScore);

    // If there's only one student with the maximum score, return the student and score
    if (highScores.length === 1) {
        return { student: highScores[0].student, score: maxScore };
    } else { // If multiple students have the same maximum score, consider previous month's score
        const highestPrevMonthScore = [];
        for (const score of highScores) {
            // Find the previous month's score for each student
            const prevMonthScore = await monthlyModel.findOne({ month: months[currentDate.getMonth() - 1], student: score.student._id });
            // Use the previous month's score or default to 0 if not found
            const totalScore = prevMonthScore ? prevMonthScore.total : 0;
            highestPrevMonthScore.push(totalScore);
        }
        // Find the minimum previous month's score among the high scorers
        const minPrevMonthScore = Math.max(...highestPrevMonthScore);
        const minScoreIndex = highestPrevMonthScore.indexOf(minPrevMonthScore);
        // Return the student with the highest previous month's score
        return { student: highScores[minScoreIndex].student, score: maxScore };
    }
};

// Function to select SOTM for a given stack
const selectSOTM = async (stack, monthlyModel, sotmModel) => {
    const currentDate = new Date();
    const months = [
        "January", "February", "March", "April", "May", "June", "July",
        "August", "September", "October", "November", "December"
    ];
    const currentMonth = months[currentDate.getMonth()]
    // Select SOTM for the specified stack
    const selectedSOTM = await selectSOTMForStack(stack, monthlyModel, sotmModel);
    const { student, score } = selectedSOTM;

    // Check if SOTM has already been selected for the month
    const checkSOTM = await sotmModel.findOne({ month: currentMonth });

    // If SOTM already exists for the month, throw an error
    if (checkSOTM) {
        throw new Error(`${stack} SOTM has already been selected for ${currentMonth}!`);
    }

    // Create SOTM entry in the database
    await sotmModel.create({ student, month: currentMonth, score });
    // Return the selected student
    return student;
};


//Function to get the best student for the month by their stacks
const SOTM = async (req, res) => {
    try {
        const stack = req.body.stack
        // Select SOTM for Backend stack
        const selectedBackendSOTM = await selectSOTM('', monthlyModel, backendSOTM);
        // Select SOTM for Frontend stack
        const selectedFrontendSOTM = await selectSOTM('frontend', monthlyModel, frontendSOTM);
        // Select SOTM for Product Design stack
        const selectedProductSOTM = await selectSOTM('productdesign', monthlyModel, productD_SOTM);

        // Return successful response with selected SOTW for each stack
        return res.status(200).json({
            message: "Student of the month successfully selected for the following stacks:",
            Backend: selectedBackendSOTM,
            Frontend: selectedFrontendSOTM,
            ProductDesign: selectedProductSOTM,
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error: " + error.message,
        })
    }
}

const SOTMbyMonth = async (stack, SOTMmodel) => {
    const currentDate = new Date();
    const months = [
        "January", "February", "March", "April", "May", "June", "July",
        "August", "September", "October", "November", "December"
    ];
    const currentMonth = months[currentDate.getMonth()]

    // fetch SOTM for the current month
    const SOTM = await SOTMmodel.findOne({ month: currentMonth }).populate('student');

    if (!SOTM || SOTM.length === 0) {
        throw new Error(`${stack} SOTM was not found for ${currentMonth}!`);
    }

    return SOTM;
}

//Function to view the SOTM for a particular month and for all stacks
const viewSOTM = async (req, res) => {
    try {
        // fetch SOTM for Backend stack
        const BackendSOTM = await SOTMbyMonth('backend', backendSOTM);
        // fetch SOTM for Frontend stack
        const FrontendSOTM = await SOTMbyMonth('frontend', frontendSOTM);
        // fetch SOTM for Product Design stack
        const ProductSOTM = await SOTMbyMonth('productdesign', productD_SOTM);

        return res.status(200).json({
            message: "Student of the month successfully fetched for the following stacks:",
            Backend: BackendSOTM,
            Frontend: FrontendSOTM,
            ProductDesign: ProductSOTM,
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error: " + error.message,
        })
    }
}

const allSOTM = async (stack, SOTMmodel) => {

    // fetch SOTM for the current month
    const SOTM = await SOTMmodel.find().sort({ createdAt: -1 }).populate('student');

    if (!SOTM || SOTM.length === 0) {
        throw new Error(`${stack} SOTM was not found!`);
    }

    return SOTM;
}


//Function to view all the SOTM for all stacks
const viewAllSOTM = async (req, res) => {
    try {
        // fetch SOTM for Backend stack
        const BackendSOTM = await allSOTM('backend', backendSOTM);
        // fetch SOTM for Frontend stack
        const FrontendSOTM = await allSOTM('frontend', frontendSOTM);
        // fetch SOTM for Product Design stack
        const ProductSOTM = await allSOTM('productdesign', productD_SOTM);

        return res.status(200).json({
            message: "Student of the Month successfully fetched for the following stacks:",
            Backend: BackendSOTM,
            Frontend: FrontendSOTM,
            ProductDesign: ProductSOTM,
        });

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error: " + error.message,
        })
    }
}


//Function to delete a backend SOTM document
const deleteSOTMb = async (req, res) => {
    try {
        const sotmId = req.params.sotmId
        const sotmB = await backendSOTM.findById(sotmId);
        if (!sotmB) {
            return res.status(404).json({
                message: "Backend SOTM not found",
            })
        }

        const deleteSOTMb = await backendSOTM.findByIdAndDelete(sotmId);
        if (!deleteSOTMb) {
            return res.status(400).json({
                message: "Unable to delete Backend SOTM Data"
            });
        }

        return res.status(200).json({
            message: "SOTM data for backend deleted successfully",
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error: " + error.message,
        })
    }
}


//Function to delete a frontend SOTM document
const deleteSOTMf = async (req, res) => {
    try {
        const sotmId = req.params.sotmId
        const sotmF = await frontendSOTM.findById(sotmId);
        if (!sotmF) {
            return res.status(404).json({
                message: "Frontend SOTM not found",
            })
        }

        const deleteSOTMf = await frontendSOTM.findByIdAndDelete(sotmId);
        if (!deleteSOTMf) {
            return res.status(400).json({
                message: "Unable to delete Frontend SOTM Data"
            });
        }

        return res.status(200).json({
            message: "SOTM data for frontend deleted successfully",
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error: " + error.message,
        })
    }
}


//Function to delete a Product design SOTM document
const deleteSOTMp = async (req, res) => {
    try {
        const sotmId = req.params.sotmId
        const sotmP = await productD_SOTM.findById(sotmId);
        if (!sotmP) {
            return res.status(404).json({
                message: "Product design SOTM not found",
            })
        }

        const deleteSOTMp = await productD_SOTM.findByIdAndDelete(sotmId);
        if (!deleteSOTMp) {
            return res.status(400).json({
                message: "Unable to delete Product design SOTM Data"
            });
        }

        return res.status(200).json({
            message: "SOTM data for Product design deleted successfully",
        })

    } catch (error) {
        return res.status(500).json({
            message: "Internal Server Error: " + error.message,
        })
    }
}


module.exports = {
    monthlyRating,
    autoGenMonthlyRating,
    viewMonthlyRating,
    getAllMonthlyRatings
}