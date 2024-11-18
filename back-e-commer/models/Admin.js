const mongoose = require('mongoose');

// Define the admin schema
const adminSchema = new mongoose.Schema({
  admin_name: {
    type: String,
    required: true,
  },
  admin_email: {
    type: String,
    required: true,
    unique: true, // Ensure email is unique
    lowercase: true, // Store email in lowercase for consistency
    trim: true, // Trim spaces
  },
  admin_pass: {
    type: String,
    required: true,
  },
});

// Ensure the email is unique
adminSchema.index({ admin_email: 1 }, { unique: true });

// Create and export the Admin model
module.exports = mongoose.model('E-commer_admin', adminSchema);
