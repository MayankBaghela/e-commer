const mongoose = require('mongoose')


const productImgSchema = new mongoose.Schema({
   
    product_img:{
        type:String,
        required:true
    },
    proId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"e-commer_products"
    }
    
})
module.exports = mongoose.model('e-commer_product_img',productImgSchema)