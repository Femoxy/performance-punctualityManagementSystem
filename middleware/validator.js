const Joi = require('@hapi/joi')

const validateUser = (data)=>{
    try {
        const validateSignup = Joi.object({
            fullName: Joi.string().required().min(3).max(30).regex(/^[a-zA-Z ]+$/).trim().required().messages({
                'string.empty': "First name field can't be left empty",
                'string.min': "Minimum of 3 characters for the first name field",
                'any.required': "Please first name is required"
            }),
            // lastName: Joi.string().min(3).max(30).regex(/^[a-zA-Z]+$/).trim().required().messages({
            //     'string.empty': "Last name field can't be left empty",
            //     'string.min': "Minimum of 3 characters for the last name field",
            //     'any.required': "Please last name is required"
            // }),
            // email: Joi.string().max(40).trim().email( {tlds: {allow: false} } ).required().messages({
            //     'string.empty': "Email field can't be left empty",
            //     'any.required': "Please Email is required"
            // }),
            phoneNumber: Joi.string().required().pattern(/^[0-9]{11}$/).message('Phone number must be exactly 11 digits')
            .messages({
                'string.empty': 'PhoneNumber cannot be empty',
                'any.required': 'PhoneNumber is required',
                'any.pattern.base': 'Invalid phone number',
                'string.length': 'Phone number can not be less than or greater than 11 digit'
              }),

            password: Joi.string().min(8).max(20).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/).trim().required().messages({
                'string.empty': "Password field can't be left empty",
                'string.pattern.base': 'Password must contain Lowercase, Uppercase, Numbers, and special characters',
                'string.min': "Password must be at least 8 characters long",
                'any.required': "Please password field is required"
            }),

        })
        return validateSignup.validate(data);
        
    } catch (error) {
       throw new Error("Error validating this user : " + error.messages)
    }
    
}


module.exports = {validateUser}