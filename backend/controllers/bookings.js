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
        const bookingUserId = booking.user && (booking.user._id ? booking.user._id.toString() : booking.user.toString());
        const requesterId = req.user && (req.user._id ? req.user._id.toString() : req.user.id);
        if (req.user.role !== 'admin' && bookingUserId !== requesterId) {
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

        // If checkoutDate provided, compute numOfNights; otherwise expect numOfNights
        if (req.body.checkoutDate && req.body.bookingDate) {
            const checkIn = new Date(req.body.bookingDate);
            const checkOut = new Date(req.body.checkoutDate);
            const msPerDay = 24 * 60 * 60 * 1000;
            const nights = Math.round((checkOut - checkIn) / msPerDay);
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            if (checkIn < today) {
                return res.status(400).json({ success: false, message: 'You can only book for now or future.' });
            }
            if (checkOut < checkIn) {
                return res.status(400).json({ success: false, message: 'Check out date cannot be before check in date.' });
            }
            // enforce maximum nights rule on server side as well
            if (nights > 3) {
                return res.status(400).json({ success: false, message: 'You can only book up to 3 nights.' });
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
        // make sure user is booking owner (handle populated user or ObjectId)
        const bookingUserId = booking.user && (booking.user._id ? booking.user._id.toString() : booking.user.toString());
        const requesterId = req.user && (req.user._id ? req.user._id.toString() : req.user.id);
        if (req.user.role !== 'admin' && bookingUserId !== requesterId) {
            return res.status(401).json({ success: false, message: `This user is not authorized to update this booking` });
        }

        // Validate updated dates / nights: ensure not booking past dates and not exceeding 3 nights
        // Determine effective checkIn and checkOut after update
        const msPerDay = 24 * 60 * 60 * 1000;
        let effectiveCheckIn = booking.bookingDate ? new Date(booking.bookingDate) : null;
        let effectiveCheckOut = booking.checkoutDate ? new Date(booking.checkoutDate) : null;

        if (req.body.bookingDate) effectiveCheckIn = new Date(req.body.bookingDate);
        if (req.body.checkoutDate) effectiveCheckOut = new Date(req.body.checkoutDate);

        // If we have an effective check-in date, ensure it's today or future
        if (effectiveCheckIn) {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            if (effectiveCheckIn < today) {
                return res.status(400).json({ success: false, message: 'You can only book for now or future.' });
            }
        }

        // If both dates available, validate ordering and nights
        if (effectiveCheckIn && effectiveCheckOut) {
            if (effectiveCheckOut < effectiveCheckIn) {
                return res.status(400).json({ success: false, message: 'Check out date cannot be before check in date.' });
            }
            const nights = Math.round((effectiveCheckOut - effectiveCheckIn) / msPerDay);
            if (nights > 3) {
                return res.status(400).json({ success: false, message: 'You can only book up to 3 nights.' });
            }
        }

        // If client provided numOfNights directly in the update, validate it
        if (req.body.numOfNights) {
            if (req.body.numOfNights > 3) {
                return res.status(400).json({ success: false, message: 'You can only book up to 3 nights.' });
            }
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
        
        // make sure user is booking owner (handle populated user or ObjectId)
        const bookingUserId = booking.user && (booking.user._id ? booking.user._id.toString() : booking.user.toString());
        const requesterId = req.user && (req.user._id ? req.user._id.toString() : req.user.id);
        if (req.user.role !== 'admin' && bookingUserId !== requesterId) {
            return res.status(401).json({ success: false, message: `This user is not authorized to delete this booking` });
        }
        
        await booking.deleteOne();
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Cannot delete Booking' });
    }
}
