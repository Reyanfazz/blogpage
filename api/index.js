const express = require('express');
const sql = require('mssql');
const cookieParser = require('cookie-parser');
const path = require('path');
const cors = require('cors');
const userRoutes = require('./routes/user.route.js');
const authRoutes = require('./routes/auth.route.js');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// MS SQL connection configuration
const config = {
    user: 'e003404a',
    password: 'KmeDataBase4321!',
    server: 'mssql101.windows.loopia.com',
    database: 'e003404',
    options: {
        encrypt: false // Disable SSL encryption
    }
};

// Connect to MS SQL database
sql.connect(config)
    .then(pool => {
        console.log('Connected to MS SQL database');
        app.locals.db = pool;
    })
    .catch(err => {
        console.error('Error connecting to MS SQL:', err);
        process.exit(1); // Exit the process if connection fails
    });

// Define routes
app.use('/api/user', userRoutes);
//app.use('/api/auth', authRoutes);

// Serve static files
const staticDir = path.join(__dirname, '../client'); // Assuming 'client' is the directory containing your static files
app.use(express.static(staticDir));

// Route for any other requests
app.get('*', (req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error'
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
module.exports = config;
