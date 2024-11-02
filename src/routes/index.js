const express = require('express');
const apiRoutes = require('./api');
const adminRoutes = require('./admin');

const router = express.Router();

router.use('/api', apiRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
