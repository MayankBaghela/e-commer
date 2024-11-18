require("dotenv").config();
const express = require("express");
const shortId = require('shortid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const Category = require('../models/Categorys');

const catDir = path.join(path.resolve(__dirname, '../', 'categoryes')); // Correct the path resolution

const router = express.Router();

// Storage engine setup using multer for 'cat_img'
const cateStore = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, catDir); // Use absolute path to store images
  },
  filename: (req, file, cb) => {
    const iname = shortId.generate();  // Generate unique image name
    cb(null, iname + path.extname(file.originalname)); // Append file extension to unique name
  },
});

const uploadCat = multer({
  storage: cateStore,
  limits: { fileSize: 1024000 }, // Limit file size to 1MB
}).single('cat_img');

// Route to add a new category
router.post('/addcategory', uploadCat, async (req, res) => {
  const { cat_name } = req.body;
  const cat_img = req.file ? req.file.filename : null; // Ensure that the file is present

  if (!cat_name || !cat_img) {
    return res.status(400).json({ "sts": 1, "msg": "Category name and image are required" });
  }

  try {
    const newCat = new Category({ cat_img, cat_name });
    await newCat.save();  // Save the new category to the database
    res.json({ "sts": 0, "msg": "Category uploaded successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ "sts": 1, "msg": "Error uploading category", "error": error.message });
  }
});

// Route to fetch all categories
router.get('/getcat', async (req, res) => {
  try {
    const cats = await Category.find(); // Get all categories from the database
    if (!cats || cats.length === 0) {
      return res.json({ 'viewcatsts': 1, "msg": "No categories found" });
    }
    res.json({ "viewcatsts": 0, cats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ "viewcatsts": 1, "msg": "Error fetching categories", "error": error.message });
  }
});

// Route to delete a category by ID
router.delete('/deletecat/:catId', async (req, res) => {
  const { catId } = req.params;  // Extract category ID from URL params
  try {
    // Find the category to be deleted
    const sCat = await Category.findById(catId);
    if (!sCat) {
      return res.json({ "delcatsts": 1, "msg": "Category not found" });
    }

    // Delete the category
    const cImage = sCat.cat_img;
    const filePath = path.join(catDir, cImage);

    // Remove the category from the database
    const delCat = await Category.findByIdAndDelete(catId);
    if (!delCat) {
      return res.json({ "delcatsts": 1, "msg": "Category not deleted" });
    }

    // Delete the image file from the server asynchronously
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Error deleting image file:", err);
        return res.status(500).json({ "delcatsts": 1, "msg": "Error deleting category image" });
      }
      res.json({ "delcatsts": 0, "msg": "Category deleted successfully" });
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ "delcatsts": 1, "msg": "Error deleting category", "error": error.message });
  }
});

module.exports = router;
