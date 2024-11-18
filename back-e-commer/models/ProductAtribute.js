const mongoose = require('mongoose')


const productAttributeSchema = new mongoose.Schema({
   
    attribute_name:{
        type:String,
        required:true
    },
    attribute_unit:{
        type:String,
        required:true
    },
    attribute_value:{
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