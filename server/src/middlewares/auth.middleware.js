const User = require("../models/User.model");
const AppError = require("../utils/AppError");
const jwt = require("jsonwebtoken");

const authenticate = async(req, res, next) => {
    try {
        const authorization = req.headers.authorization;
        if(!authorization || !authorization.startsWith("Bearer ")){
            throw new AppError("Hesaba daxil olmağınız tələb olunur", 401, "AUTH_REQUIRED")
        }
        const token = authorization.split(" ")[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const user = await User.findById(decoded.userId).lean()
        if(!user){
            throw new AppError("İstifadəçi tapılmadı", 401, "USER_NOT_FOUND")
        }

        req.user = user
        next()
    } catch (error) {
        if (error.name === "JsonWebTokenError"){
            return next(
                new AppError("Keçərli olmayan token", 401, "INVALID_TOKEN")
            )
        }
        if (error.name === "TokenExpiredError"){
            return next(
                new AppError("Müddəti bitmiş token", 401, "TOKEN_EXPIRED")
            )
        }
        next(error)
    }
}

module.exports = authenticate