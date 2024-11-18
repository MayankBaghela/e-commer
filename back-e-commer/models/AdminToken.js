const mongoose = require('mongoose')

const adminTokenSchema = new mongoose.Schema({
    adminId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'E-commer_admin'
    },
    token:{
        type:String,
        required:true
    },
    expiresAt:{
        type:Date,
        required:true,
    }
})

adminTokenSchema.index({expiresAt:1},{expireAfterSeconds:0})
module.exports = mongoose.model('Admin_token',adminTokenSchema)