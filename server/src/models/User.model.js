const { default: mongoose } = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        
    },
    email: {
            type: String,
            unique:true
    },
    password: {
        type: String,
        required: true
    },
    isOnline: {
        type: Boolean,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastSeenAt: {
        type: Date,
        default: null
    }
}, {timestamps:true})

const User = mongoose.model("User", userSchema)

module.exports = User