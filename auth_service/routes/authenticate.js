const express = require('express');
const router = express.Router();
const dotenv = require('dotenv').config();
const jwt = require('jsonwebtoken');
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

async function findUserById(userId) {
    const query = 'SELECT * FROM users WHERE id = $1';
    try {
        const result = await pool.query(query, [userId]);
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
        res.status(401).json({
            success: false,
            message: 'Both email and password are required'
        });
    }
    findUserByEmailAndPassword(email, password).then(async (user) => {
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        const jwtSecret = process.env.JWT_SECRET_KEY;
        let data = {
            sub: user.id,
            iat: new Date().getTime()
        };
        jwt.sign(data,
            jwtSecret,
            { expiresIn: '1d' },
            (err, token) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Error generating token',
                    error: err
                });
            }
            req.session.userId = user.id;
            delete user.password;
            return res.cookie('Authorization', 'Bearer ' + token)
                .status(200).json({
                    success: true,
                    message: 'Login successful',
                    user: user,
                    token: token
                });
        });

    });
};

const logoutHandler = function (req, res, next) {
    req.session.destroy();
    res.status(200).clearCookie('connect.sid', {
        path: '/'
    }).clearCookie('Authorization', {
        path: '/'
    }).json({
        success: true,
        message: 'Logout successful'
    });
};

const signUpHandler = function (req, res, next) {
    let email = req.body.email;
    let password = req.body.password;
    let name = req.body.name;

    if (!(email && password && name)) {
        return res.status(400).json({
            success: false,
            message: 'All fields are required'
        });
    }

    findUserByEmail(email).then(async (user) => {
        if (user) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }
        registerUser(email, password, name).then((result) => {
            return res.status(201).json({
                success: true,
                message: 'User created successfully'
            });
        });
    });
}

const currentUserHandler = function (req, res, next) {
    const cookies = req.cookies;

    const authHeader = cookies['Authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) {
        return res.status(401).json({
            success: false,
            message: 'No token found! Unauthorized'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET_KEY, null, (err, payload) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden'
            });
        }

        const userId = payload.sub;
        findUserById(userId).then((user) => {
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized'
                });
            }
            delete user.password;
            res.status(200).json({
                success: true,
                message: 'Current user',
                user: user
            });
        });
    });
};

router.post('/login', loginHandler);
router.get('/logout', logoutHandler);
router.post('/register', signUpHandler);
router.get('/user', currentUserHandler);

module.exports = router;
