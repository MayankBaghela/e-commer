const mongoose = require('mongoose');  // Make sure this line is present

const productSchema = new mongoose.Schema({
    product_name: {
        type: String,
        required: true,
    },
    pro_cat: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'e-commer_category', // Make sure this points to your Category model
    },
    product_short_desc: {
        type: String,
        required: true,
    },
    product_long_desc: {
        type: String,
        required: true,
    },
    product_thumb: {
        type: String,
        required: true,
    },
    product_org_price: {
        type: Number,
        required: true,
    },
    product_sale_price: {
        type: Number,
        required: true,
    },
    product_sale_start_date: {
        type: Date,
        required: true,
    },
    product_sale_end_date: {
        type: Date,
        required: true,
    },
    product_status: {
        type: String,
        enum: ['pending', 'enable', 'disable'],
        default: 'pending',
        required: true,
    },
});

// Pre-hook for 'find' to populate the 'pro_cat' field
productSchema.pre('find', function(next) {
    this.populate('pro_cat');
    next();
});

module.exports = mongoose.model('e-commer_products', productSchema);  // Export model
