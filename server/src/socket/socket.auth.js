const User = require("../models/User.model");
const jwt = require("jsonwebtoken");

const socketAuthentication = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if(!token){
            return next(
                new Error("Authentication tələb olunur")
            )
        }

        const decoded = jwt.verify(
            token, process.env.JWT_SECRET
        )

        const user = await User.findById(decoded.userId).lean()

        if(!user){
            return next(
                new Error("İstifadəçi tapılmadı")
            )
        }

        socket.user = user
        next()

        

    } catch (error) {
        next(
              new Error("Yanlış Authentication")
        )
    }
}

module.exports = socketAuthentication