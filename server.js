require('dotenv').config();

const express = require("express");
const app = express();
const cors = require("cors");
const session = require('express-session');
const passport = require('passport');
const path = require("path");
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const sequelize = require('./config/db');

// Routers
const Userrouter = require('./router/userRouter');
const EstateRouter = require('./router/estateRouter');
const PlansRouter = require('./router/planRouter');
const UnitRouter = require('./router/unitRouter');
const subscribeRouter = require('./router/subcribersRouter');
const codeRouter = require('./router/codeRouter');

const port = process.env.PORT || 8000;

//  Security middleware
app.use(helmet());

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

//  Rate limiting
app.use('/api', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict'
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    maxAge: '7d'
}));

// API Routes
app.use('/api/v1/users', Userrouter);
app.use('/api/v1/estates', EstateRouter);
app.use('/api/v1/plans', PlansRouter);
app.use('/api/v1/units', UnitRouter);
app.use('/api/v1/subscriptions', subscribeRouter);
app.use('/api/v1/visitors', codeRouter);

// Start server
sequelize.sync().then(() => {
    console.log('Database synced');

    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
});