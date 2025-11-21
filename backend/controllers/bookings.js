const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');

// Cleanup helper: delete bookings where checkoutDate is in the past
async function cleanExpiredBookings() {
    try {
        const now = new Date();
        // delete bookings whose checkoutDate is before current time
        await Booking.deleteMany({ checkoutDate: { $lt: now } });
    } catch (err) {
        console.error('Error cleaning expired bookings:', err.stack || err);
    }
}

//@desc GET all bookings
//@route GET /api/v1/bookings
//@access Private
exports.getBookings = async (req, res, next) => {
    let query;
    // remove any bookings that have already passed
    await cleanExpiredBookings();
    //General users can see only their bookings
    const commonPopulate = [
        { path: 'hotel', select: 'name address tel' },
        { path: 'user', select: 'name email' }
    ];

    if (req.user.role !== 'admin') {
        query = Booking.find({ user: req.user.id }).populate(commonPopulate);
    } else {
        query = Booking.find().populate(commonPopulate);
    }
    try {
        const bookings = await query;
        return res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        console.log(error.stack);
        return res.status(500).json({ success: false, error: 'Cannot find Booking' });
    }
};

//@desc Get single booking
//@route GET /api/v1/bookings/:id
//@access Public
exports.getBooking = async (req, res, next) => {
    try {
        // remove expired bookings first
        await cleanExpiredBookings();
        const booking = await Booking.findById(req.params.id).populate([
            { path: 'hotel', select: 'name address tel' },
            { path: 'user', select: 'name email' }
        ]);
        if (!booking) {
            return res.status(404).json({ success: false , message : `No booking with this id` });
        }
        // Authorization: only admins can fetch any booking; normal users may only fetch their own
        if (req.user.role !== 'admin' && booking.user._id.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized to view this booking' });
        }
        res.status(200).json({ success: true, data: booking });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Cannot find Booking' });
    }
};

//@desc add new booking
//@route POST /api/v1/hotels/:hotelId/bookings
//@access Private
exports.addBooking = async (req, res, next) => {
    try {
        req.body.hotel = req.params.hotelId;
        
        const hotel = await Hotel.findById(req.params.hotelId);
        if (!hotel) {
            return res.status(404).json({ success: false, message: `No hotel with this id` });
        }

        //add user Id to req.body
        req.body.user = req.user.id;

        // Validate booking date is not in the past
        if (req.body.bookingDate) {
            const bookingDate = new Date(req.body.bookingDate);
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            if (bookingDate < today) {
                return res.status(400).json({ success: false, message: 'You can only book for now or future.' });
            }
        }

        const booking = await Booking.create(req.body);
        // populate hotel and user before returning
        const populated = await Booking.findById(booking._id).populate([
            { path: 'hotel', select: 'name address tel' },
            { path: 'user', select: 'name email' }
        ]);
        return res.status(200).json({
            success: true,
            data: populated
        });
    } catch (error) {
        console.log(error.stack);
        // Return validation errors from model
        if (error.name === 'ValidationError' || error.message.includes('night')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        return res.status(500).json({ success: false, message: 'Cannot create Booking' });
    }
};

//@desc Update booking
//@route PUT /api/v1/bookings/:id
//@access Private
exports.updateBooking = async (req, res, next) => {
    try {
        let booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, message: `No booking with this id` });
        }
        //make sure user is booking owner
        if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: `This user is not authorized to update this booking` });
        }
        booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        const populated = await Booking.findById(booking._id).populate([
            { path: 'hotel', select: 'name address tel' },
            { path: 'user', select: 'name email' }
        ]);
        res.status(200).json({ success: true, data: populated });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Cannot update Booking' });
    }
};

//@desc Delete booking
//@route DELETE /api/v1/bookings/:id
//@access Private
exports.deleteBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, message: `No booking with this id` });
        }
        
        //make sure user is booking owner
        if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: `This user is not authorized to delete this booking` });
        }
        
        await booking.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Cannot delete Booking' });
    }
}
