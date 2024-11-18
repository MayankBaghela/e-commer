require('dotenv').config()
const mongoose  = require('mongoose')

const db_url=process.env.DB_url

mongoose.connect(db_url).then(()=>{
    console.log("mongoDB connected")
})

mongoose.connection.on("connected",()=>{
    console.log("Connection Done ")
})
mongoose.connection.on("error",(error)=>{
    console.error("Connection error ",error)
})
mongoose.connection.on("disconnected",()=>{
    console.log("Disconnection Done")
})

module.exports = mongoose