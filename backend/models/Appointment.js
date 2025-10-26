const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    bookingDate: {
        type: Date,
        required: true,
    },
    numOfNights: {
        type: Number,
        required: [true, 'Please add number of nights'],
        min: [1, 'Minimum booking is 1 night'],
        max: [3, 'Maximum booking is 3 nights']
    },
    user : {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    hotel : {
        type: mongoose.Schema.ObjectId,
        ref: 'Hotel',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Booking', BookingSchema);