const express = require('express');
const route = express.Router();
const { protect , authorize} = require('../middleware/auth');

const {getHotels, getHotel, createHotel, updateHotel, deleteHotel} = require('../controllers/hotels');


/**
 * @swagger
 * tags:
 *   - name: Hotel
 *     description: The hotel managing API
 */

// Re-route into other resource routers
const bookingRouter = require('./bookings');
route.use('/:hotelId/bookings', bookingRouter);

/**
 * @swagger
 * /hotels:
 *   get:
 *     summary: Returns the list of all hotels
 *     tags: [Hotel]
 *     responses:
 *       200:
 *         description: A list of hotels
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HotelList'
 *   post:
 *     summary: Create a new hotel
 *     tags: [Hotel]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HotelInput'
 *     responses:
 *       201:
 *         description: Hotel created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hotel'
 */
route.route('/').get(getHotels).post(protect, authorize('admin'), createHotel);

/**
 * @swagger
 * /hotels/{id}:
 *   get:
 *     summary: Get the hotel by id
 *     tags: [Hotel]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hotel object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hotel'
 *   put:
 *     summary: Update the hotel by id
 *     tags: [Hotel]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HotelInput'
 *     responses:
 *       200:
 *         description: Hotel updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hotel'
 *   delete:
 *     summary: Remove the hotel by id
 *     tags: [Hotel]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hotel deleted
 */
route.route('/:id').get(getHotel).put(protect, authorize('admin'), updateHotel).delete(protect, authorize('admin'), deleteHotel);

module.exports = route; 

