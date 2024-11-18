require('dotenv').config()
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const db = require('./db')
const adminRoute = require('./routes/adminLogin')
const adminCategory = require('./routes/category')
const adminProduct = require('./routes/product')

const app = express()

// CORS configuration
app.use(cors({
    origin: 'http://localhost:3000',  // Allow requests from React frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow GET, POST, PUT, DELETE
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow headers for authorization
}));

app.use(bodyParser.json())

// All Static Folder access
app.use('/cats', express.static('categoryes'))
app.use('/pros', express.static('products'))

// Routes
app.use('/adminloginapi', adminRoute)
app.use('/admincategory', adminCategory)
app.use('/adminproduct', adminProduct)

const port = process.env.PORT || 2727

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`)
})
