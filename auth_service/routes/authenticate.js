const express = require('express');
const router = express.Router();
const dotenv = require('dotenv').config();
const Pool = require('pg').Pool

const credentials = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
}

// Connect to the database
const pool = new Pool(credentials);

async function findUserByEmailAndPassword(email, password) {
    const query = 'SELECT * FROM users WHERE email = $1 AND password = $2';

    try {
        const result = await pool.query(query, [email, password]);
        return result.rows[0];
    } catch (error) {
        throw error;
    }
}

async function findUserByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    try {
        const result = await pool.query(query, [email]);
        return result.rows[0];
    } catch (error) {
        throw error;
    }
}

async function registerUser(email, password, name) {
    const query = 'INSERT INTO users (email, password, name) VALUES ($1, $2, $3)';
    try {
        return await pool.query(query, [email, password, name]);
    } catch (error) {
        throw error;
    }
}

const loginHandler = function (req, res, next) {
    let email = req.body.email;
    let password = req.body.password;

    if (!(email && password)) {
        res.status(401).send('Email and password are required');
    }
    findUserByEmailAndPassword(email, password).then(async (user) => {
        if (!user) {
            return res.status(401).send('Invalid credentials');
        }
        req.session.name = user.name;
        req.session.id = user.id;
        res.status(200).send('Login successful!\nWelcome ' + user.name);
    });
};

const logoutHandler = function (req, res, next) {
    req.session.destroy();
    res.status(200).clearCookie('connect.sid', {
        path: '/'
    }).send('Logout successful');
};

const signUpHandler = function (req, res, next) {
    let email = req.body.email;
    let password = req.body.password;
    let name = req.body.name;

    if (!(email && password && name)) {
        return res.status(400).send('All input is required');
    }

    findUserByEmail(email).then(async (user) => {
        if (user) {
            return res.status(400).send('User already exists');
        }
        registerUser(email, password, name).then((result) => {
            return res.status(201).send('User registered successfully\nLogin to continue');
        });
    });
}

const currentUserHandler = function (req, res, next) {
    if (!req.session.name) {
        return res.status(401).send('Unauthorized');
    }
    res.status(200).send('Welcome ' + req.session.name);
};

router.post('/login', loginHandler);
router.get('/logout', logoutHandler);
router.post('/register', signUpHandler);
router.get('/user', currentUserHandler);

module.exports = router;
