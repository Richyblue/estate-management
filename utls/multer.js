// config/multer.js
const multer = require('multer');
const path = require('path');

// Configure storage for images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/images'); // Directory to save uploaded files
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)); // Define file name format
    }
});

// Set up the multer middleware
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|pdf|docs|doc/;
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeType = fileTypes.test(file.mimetype);
        
        if (mimeType && extname) {
            return cb(null, true);
        } else {
            cb("Error: Images only!"); // Only accept images
        }
    }
});

module.exports = upload;