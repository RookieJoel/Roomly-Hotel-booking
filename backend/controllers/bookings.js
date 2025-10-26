const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');

//@desc add new booking
//@route POST /api/v1/hotels/:hotelId/bookings
//@access Private
exports.addBooking = async (req, res, next) => {
    try {
        req.body.hotel = req.params.hotelId;
        
        const hotel = await Hotel.findById(req.params.hotelId);
        if (!hotel) {
            return res.status(404).json({ success: false, message: `No hotel with the id of ${req.params.hotelId}` });
        }

        //add user Id to req.body
        req.body.user = req.user.id;

        //check for existing booking
        const existingBooking = await Booking.find({ user: req.user.id });
        if (existingBooking.length >= 3 && req.user.role !== 'admin') {
            return res.status(400).json({ success: false, message: `The user with ID ${req.user.id} already has 3 bookings` });
        }
        const booking = await Booking.create(req.body);
        return res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.log(error.stack);
        return res.status(500).json({ success: false, message: 'Cannot create Booking' });
    }
};


