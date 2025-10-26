const express = require('express');
const {addBooking} = require('../controllers/bookings');

const router = express.Router({mergeParams: true});

const {protect,authorize} = require('../middleware/auth');

router.route('/').post(protect,authorize('admin','user'), addBooking);


module.exports = router;