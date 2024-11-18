const multer = require('multer');
const path = require('path');
const fs = require('fs');
const shortId = require('shortid');
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const ProductImage = require('../models/Product_img.js')

// Ensure the products directory exists
const proDir = path.join(path.resolve(__dirname, '../', 'products'));
if (!fs.existsSync(proDir)) {
    fs.mkdirSync(proDir);
}

// Configure multer storage
const proStore = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, proDir);
    },
    filename: (req, file, cb) => {
        const iname = shortId.generate();
        cb(null, iname + path.extname(file.originalname));  // Generate unique file name
    }
});

// Configure file upload limits and file types (allowing all images)
const uploadPro = multer({
  storage: proStore,
  limits: { fileSize: 5000000 },  // 5MB file size limit
  fileFilter: (req, file, cb) => {
      const imageMimeTypes = /jpeg|jpg|png|gif|bmp|tiff/;  // Allow all image formats
      const extname = imageMimeTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = imageMimeTypes.test(file.mimetype);

      if (extname && mimetype) {
          return cb(null, true);  // Accept the file
      } else {
          cb(new Error('Only image files are allowed.'));
      }
  },
});

// Route for adding products
router.post('/addproduct', uploadPro.single('product_thumb'), async (req, res) => {
    try {
        // Retrieve form data and file
        const { pro_cat, product_name, product_short_desc, product_long_desc, product_org_price, product_sale_price, product_sale_start_date, product_sale_end_date } = req.body;
        const product_thumb = req.file ? req.file.filename : null; // Get the filename of the uploaded image

        // Validate required fields
        if (!pro_cat || !product_name || !product_thumb || !product_org_price || !product_sale_price) {
            return res.status(400).json({ sts: 1, msg: "All fields are required, including product image." });
        }

        // Validate numeric values (price)
        const orgPrice = parseFloat(product_org_price);
        const salePrice = parseFloat(product_sale_price);

        if (isNaN(orgPrice) || isNaN(salePrice)) {
            return res.status(400).json({ sts: 1, msg: "Invalid price values." });
        }

        if (orgPrice <= 0 || salePrice <= 0) {
            return res.status(400).json({ sts: 1, msg: "Prices must be positive numbers." });
        }

        // Validate and parse dates
        const startDate = new Date(product_sale_start_date);
        const endDate = new Date(product_sale_end_date);

        if (isNaN(startDate.getTime())) {
            return res.status(400).json({ sts: 1, msg: "Invalid sale start date." });
        }
        if (isNaN(endDate.getTime())) {
            return res.status(400).json({ sts: 1, msg: "Invalid sale end date." });
        }

        // Ensure start date is earlier than end date
        if (startDate >= endDate) {
            return res.status(400).json({ sts: 1, msg: "Sale start date must be earlier than sale end date." });
        }

        // Create a new Product object
        const newProduct = new Product({
            pro_cat,
            product_name,
            product_short_desc,
            product_long_desc,
            product_thumb,
            product_org_price: orgPrice,
            product_sale_price: salePrice,
            product_sale_start_date: startDate,
            product_sale_end_date: endDate,
            product_status: 'pending',  // Default value
        });

        // Save the new product to the database
        await newProduct.save();

        // Send success response
        res.json({ sts: 0, msg: "Product uploaded successfully." });

    } catch (error) {
        console.error("Error saving product to database:", error);
        res.status(500).json({ sts: 1, msg: "Error saving product to database.", error: error.message });
    }
});

// Route for fetching all products

router.get('/adminproductview', async (req, res) => {
    try {
        const products = await Product.find().populate('pro_cat'); // Explicitly populate 'pro_cat'
        
        if (!products || products.length === 0) {
            return res.json({ sts: 1, msg: "Products not found." });
        } else {
            return res.json({ sts: 0, products });
        }
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ sts: 1, msg: "Error fetching products.", error: error.message });
    }
});


//http://localhost:2727/adminproduct/changestatus
router.post('/changestatus',async(req,res)=>{
const {productIds,newStatus} = req.body
    try {
        await Product.updateMany(
        {_id:{$in:productIds}},
    {$set:{product_status:newStatus}})
    res.json({"msg":"Product status Updated"})
    } catch (error) {
        console.error(error)
        
    }
})


//http://localhost:2727/adminproduct/deletemproduct

router.post('/deletemproduct',async(req,res)=>{
    const {productIds} = req.body
        try {
           const result =  await Product.deleteMany({
            _id:{$in:productIds}
           })
            
        res.json({"msg":`Total ${result.deletedCount} Product Deleted`})
        } catch (error) {
            console.error(error)
            
        }
    })

    //http://localhost:2727/adminproduct/deletesingleproduct/:id

router.delete('/deletesingleproduct/:id',async(req,res)=>{
    const productId = req.params.id
    const spro = await Product.findById(productId)
    const product_thumb = spro.product_thumb;
    const filepath = path.join(proDir,product_thumb)
    try {
        const pro = await Product.findByIdAndDelete(productId)
        if (!pro) {
            return res.json({"msg":"Product Not delete","delsts":1})
        } else {
            fs.unlinkSync(filepath)
            return res.json({"msg":"Product deleted","delsts":0})
        }
    } catch (error) {
        console.error(error)
    }

    })

//http://localhost:2727/adminproduct/uploadimages/:id

    const UploadImages = multer({storage:proStore})
    router.post('/uploadimages/:id',UploadImages.array('images'),async(req,res)=>{

        const productId = req.params.id
        const imageFiles = req.files
        try {
            const imagePromises = await imageFiles.map(file=>{
                const newProdImage = new ProductImage({
                    product_img:file.filename,
                    proId:productId
                })
                return newProdImage.save()
            })
            await Promise.all(imagePromises) 
            res.json({"msg":"Images Uploaded successfully"})
        } catch (error) {
            console.error(error)
            res.json({"msg":"Some error on Server"})
        }
    })

module.exports = router;
