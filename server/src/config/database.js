const mongoose = require("mongoose")

const connectDatabase = async () => {
    await mongoose.connect(process.env.MONGO_URL)
    console.log("MongoDB-yə qoşuldu");
    
}

module.exports = connectDatabase