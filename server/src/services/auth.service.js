const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const AppError = require("../utils/AppError");

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id.toString(),
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    },
  );
};


const register = async({name, email, password}) => {
    const normalizedEmail = email.toLowerCase().trim()

    const existingUser = await User.findOne({
        email: normalizedEmail
    })

    if(existingUser){
        throw new AppError("Bu E-mail adresi artıq istifadə edilib", 409, "EMAIL_ALREADY_EXISTS")
    }
    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await User.create({
        name,
        email: normalizedEmail,
        password: hashedPassword
    })

    return {
        user: {
            id: user._id,
            name: user.name,
            email: user.email
        },
        token: generateToken(user)
    }
}

const login = async ({email, password}) => {
    const user = await User.findOne({email: email.toLowerCase().trim()}).select("+password")
    if(!user){
        throw new AppError("E-poçt və ya şifrə yanlışdır", 401, "INVALID_CREDENTIALS")
    }
   
    const passwordMatches = await bcrypt.compare(password, user.password)
     if(!passwordMatches){
        throw new AppError("E-poçt və ya şifrə yanlışdır", 401, "INVALID_CREDENTIALS")
    }

     if(!user.isActive){
         throw new AppError("Hesabınız deaktiv edilib", 403, "ACCOUNT_BLOCKED")
    }

    return {
        user: {
            id: user._id,
            name: user.name,
            email: user.email
        },
        token: generateToken(user)
    }
    
}

module.exports = {
    register,
    login
}