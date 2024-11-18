require("dotenv").config();
const express = require("express");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const shortId = require('shortid')
const Admin = require("../models/Admin");
const AdminToken = require("../models/AdminToken");
const AdminPassReset = require('../models/AdminPassReset')
const router = express.Router();
const KEY = process.env.KEY;
const {sendEmail} = require('../CommonSnips/EmailSender')

//-->   http://localhost:2727/adminloginapi/create-admin
router.post("/create-admin", async (req, res) => {
  try {
    const { admin_name, admin_email, admin_pass } = req.body;

    console.log("Received data:", req.body); // Log the received data

    // Validate required fields
    if (!admin_name || !admin_email || !admin_pass) {
      return res.status(400).json({ msg: "Please provide all required fields." });
    }

    // Check if the email already exists
    const existingAdmin = await Admin.findOne({ admin_email });
    if (existingAdmin) {
      return res.status(400).json({ msg: "Email already exists!" });
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(admin_pass, 12);

    // Create a new admin
    const newAdmin = new Admin({
      admin_name,
      admin_email,
      admin_pass: hashedPassword,
    });

    const savedAdmin = await newAdmin.save();

    res.status(200).json({
      sts: 0, // Success status
      msg: "Registration successful!",
      admin: savedAdmin,
    });
  } catch (error) {
    console.error("Error during registration:", error); // Log the error
    res.status(500).json({ msg: "Server Error" });
  }
});


//-->   http://localhost:2727/adminloginapi/login-admin
router.post("/login-admin", async (req, res) => {
  const admin_email = req.body.admin_email;
  const admin_pass = req.body.admin_pass;
  try {
    const login = await Admin.findOne({ admin_email });
    if (!login) {
      return res.json({ msg: "email not found", sts: 1 });
    } else {
      if (await bcrypt.compare(admin_pass, login.admin_pass)) {
        const token = jwt.sign({ adminId: login._id }, KEY, {
          expiresIn: "1hr",
        });
        const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000);
        const adminTokenSave = new AdminToken({
          adminId: login._id,
          token,
          expiresAt,
        });
        const aid = login._id;
        const aEmail = login.admin_email;
        const aName = login.admin_name;

        await adminTokenSave.save();
        return res.json({ sts: 0, aid, aEmail, aName, token });
      } else {
        return res.json({ msg: "Wrong password", sts: 2 });
      }
    }
  } catch (error) {
    res.status(500).json({ error: error });
  }
  // const token = jwt.sign((userId,))
});

//-->   http://localhost:2727/adminloginapi/checktokken
router.post("/checktokken", async (req, res) => {
  const token = req.body.token;
  try {
    const tokencheck = await AdminToken.findOne({ token });
    if (!tokencheck) {
      return res.json({ tokensts: 1 });
    } else {
      return res.json({ tokensts: 0 });
    }
  } catch (error) {
    console.error(error);
  }
});

//-->   http://localhost:2727/adminloginapi/updatepass
router.post("/updatepass", async (req, res) => {
  const admin_email = req.body.admin_email;
  const admin_pass = req.body.admin_pass;
  const old_pass = req.body.old_pass;
  try {
    const passChk = await Admin.findOne({ admin_email });
    if (await bcrypt.compare(old_pass,passChk.admin_pass )) {
      //  console.log({"msg":"password match"})
      const hasAdmin_pass = await bcrypt.hash(admin_pass, 12);
      const updateAdminPass = await Admin.findOneAndUpdate(
       { admin_email:admin_email},
        { $set: { admin_pass: hasAdmin_pass } },
        { new: true }
      );

     return res.json({ "changeSts": 0, "msg": "PAssword changed" });
    } else {
      return res.json({ "changeSts": 1, "msg": "old password do not match" });
    }
  } catch (error) {
    console.error(error);
  }
});

//-->   http://localhost:2727/adminloginapi/adminlogout
router.post('/adminlogout',async(req,res)=>{
  const token = req.body.token
  try {
    const logout = await AdminToken.findOneAndDelete({token})
    if (!logout) {
      return res.json({"logoutsts":1,"msg":"logout failed"})
    } else {
      return res.json({"logoutsts":0,"msg":"logout success "})
    }
  } catch (error) {
    console.error(error)
  }

})

//-->   http://localhost:2727/adminloginapi/sendresetlink
router.post('/sendresetlink', async (req, res) => {
  const { admin_email } = req.body;

  try {
    const findAdmin = await Admin.findOne({ admin_email });
    if (!findAdmin) {
      return res.json({ sts: 1, msg: 'Email not found' });
    }

    const reset_token = shortId.generate();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry
    const subject = 'E-Commer : Reset Password Link';
    const text = `Your Reset Password link is http://localhost:3000/adminpassreset/${reset_token}`;

    const saveResetToken = new AdminPassReset({
      admin_email,
      reset_token,
      expiresAt
    });

    await saveResetToken.save();

    // Debugging: Log the email sending attempt
    console.log('Sending email to:', admin_email);

    // Call sendEmail function
    try {
      await sendEmail(admin_email, subject, text);
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      return res.json({ sts: 1, msg: 'Failed to send reset link' });
    }

    return res.json({
      sts: 0,
      msg: 'Your reset link has been sent',
      reset_url: `http://localhost:3000/adminpassreset/${reset_token}`
    });
  } catch (error) {
    console.error('Error:', error);
    return res.json({ sts: 1, msg: 'Something went wrong, please try again later' });
  }
});


//--> http://localhost:2727/adminloginapi/resetpass
router.post('/resetpass', async (req, res) => {
  const { reset_token, admin_pass } = req.body;

  if (!reset_token || !admin_pass) {
    return res.status(400).json({ sts: 1, msg: "Reset token and password are required." });
  }

  try {
    const hashedPass = await bcrypt.hash(admin_pass, 12);
    const findAdmin = await AdminPassReset.findOne({ reset_token });

    if (!findAdmin) {
      return res.status(400).json({ sts: 1, msg: "Invalid or expired reset token." });
    }

    // Check if the token is expired
    if (new Date() > findAdmin.expiresAt) {
      return res.status(400).json({ sts: 1, msg: "Your link has expired. Please request a new reset link." });
    }

    const admin_email = findAdmin.admin_email;

    const updateAdminPass = await Admin.findOneAndUpdate(
      { admin_email },
      { $set: { admin_pass: hashedPass } },
      { new: true }
    );

    if (!updateAdminPass) {
      return res.status(404).json({ sts: 1, msg: "Admin account not found." });
    }

    await AdminPassReset.findOneAndDelete({ reset_token });

    return res.status(200).json({ sts: 0, msg: "Your password has been successfully updated." });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({ sts: 1, msg: "An error occurred while resetting your password." });
  }
});





module.exports = router;
