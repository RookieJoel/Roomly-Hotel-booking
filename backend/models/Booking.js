const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    bookingDate: {
        type: Date,
        required: true,
    },
    checkoutDate: {
        type: Date,
        required: true,
    },
    numOfNights: {
        type: Number,
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

// Auto-calculate numOfNights from checkoutDate and bookingDate before saving
BookingSchema.pre('save', function(next) {
    if (this.checkoutDate && this.bookingDate) {
        const msPerDay = 24 * 60 * 60 * 1000;
        const nights = Math.round((this.checkoutDate - this.bookingDate) / msPerDay);
        this.numOfNights = nights;
        
        // Validate dates
        if (this.checkoutDate <= this.bookingDate) {
            return next(new Error('Check-out date must be after booking date'));
        }
        if (nights < 1) {
            return next(new Error('Minimum booking is 1 night'));
        }
        if (nights > 3) {
            return next(new Error('Maximum booking is 3 nights'));
        }
    }
    next();
});

module.exports = mongoose.model('Booking', BookingSchema);