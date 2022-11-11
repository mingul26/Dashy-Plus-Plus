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

let currentLoggedInUser = null;

// Connect to the database
const pool = new Pool(credentials);

async function createNewDashboard(name, description, ownerId) {
    const query = 'INSERT INTO dashboard (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *';
    try {
        return await pool.query(query, [name, description, ownerId]);
    } catch (error) {
        throw error;
    }
}

async function fetchAllDashboards(ownerId) {
    const query = 'SELECT id, name, description FROM dashboard WHERE owner_id = $1';
    try {
        const result = await pool.query(query, [ownerId]);
        return result.rows;
    } catch (error) {
        throw error;
    }
}

const checkIfUserIsLoggedIn = function (req, res, next) {
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
        currentLoggedInUser = payload.sub;
        next();
    });
}

const fetchAllDashboardsHandler = function (req, res, next) {
    fetchAllDashboards(currentLoggedInUser).then(dashboards => {
        return res.status(200).json({
            success: true,
            message: 'Fetched all dashboards',
            dashboards: dashboards
        });
    }).catch(error => {
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    });
}

const dashboardCreateHandler = function (req, res, next) {
    const dashboardName = req.body.name;
    const dashboardDescription = req.body.description;

    if(!dashboardName) {
        return res.status(400).json({
            success: false,
            message: 'Missing dashboard name'
        });
    }

    createNewDashboard(dashboardName, dashboardDescription, currentLoggedInUser)
        .then(async(dashboard) => {
            return res.status(201).json({
                success: true,
                message: 'Dashboard created',
                data: dashboard.rows[0]
            });
        })
        .catch(error => {
            return res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        });
}


const dashboardHomepageHandler = function (req, res, next) {
    return res.status(200).json({
        success: true,
        message: 'Dashboard homepage'
    });
}

/* GET users listing. */
router.get('/', dashboardHomepageHandler);
router.get('/all', checkIfUserIsLoggedIn, fetchAllDashboardsHandler);
router.post('/create', checkIfUserIsLoggedIn, dashboardCreateHandler);

module.exports = router;