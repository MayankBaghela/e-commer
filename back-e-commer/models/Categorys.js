const mongoose = require('mongoose')


const categorySchema = new mongoose.Schema({
    cat_name:{
        type:String,
        required:true
    },
    cat_img:{
        type:String,
        required:true
    },
    
})
module.exports = mongoose.model('e-commer_category',categorySchema)