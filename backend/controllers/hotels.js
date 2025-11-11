const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
//@desc GET all hotels
//@route GET /api/v1/hotels
//@access Public
exports.getHotels = async (req, res) => {

        // const hotels = await Hotel.find(req.query);
        // console.log(req.query);
        let query;

        // Copy req.query
        const reqQuery = { ...req.query };

        // Fields to exclude
        const removeFields = ['select', 'sort', 'page', 'limit'];

        // Loop over removeFields and delete them from reqQuery
        removeFields.forEach(param => delete reqQuery[param]);
        console.log(reqQuery);

        // Create query string
        let queryStr = JSON.stringify(reqQuery);
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

        query = Hotel.find(JSON.parse(queryStr)).populate('bookings');

        // Select Fields - with type validation
        if (req.query.select && typeof req.query.select === 'string') {
            const fields = req.query.select.split(',').join(' ');
            query = query.select(fields);
        }

        // Sort - with type validation
        if (req.query.sort && typeof req.query.sort === 'string') {
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        } else {
            query = query.sort('-createdAt');
        }

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 25;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        try {
            const total = await Hotel.countDocuments();
            
            query = query.skip(startIndex).limit(limit);

            // Executing query
            const hotels = await query;
            // Pagination result
            const pagination = {};
            
            if (endIndex < total) {
                pagination.next = {
                    page: page + 1,
                    limit
                };
            }
            
            if (startIndex > 0) {
                pagination.prev = {
                    page: page - 1,
                    limit
                };
            }

            res.status(200).json({ success: true, count: hotels.length, data: hotels });
        } catch (error) {
            res.status(400).json({ success: false });
        }
    };

//@desc GET single hotel
//@route GET /api/v1/hotels/:id
//@access Public
exports.getHotel = async (req, res) => {
    try {
        const hotel = await Hotel.findById(req.params.id);
        if (!hotel) {
            return res.status(404).json({ success: false });
        }
        res.status(200).json({ success: true, data: hotel });
    } catch (error) {
        res.status(400).json({ success: false });
    }
};

//@desc Create new hotel
//@route POST /api/v1/hotels
//@access Private
exports.createHotel = async (req, res) => {
        const hotel = await Hotel.create(req.body);
        res.status(201).json({ success: true, data: hotel });
};

//@desc Update hotel
//@route PUT /api/v1/hotels/:id
//@access Private
exports.updateHotel = async (req, res) => {
    try{
        const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!hotel) {
            return res.status(400).json({ success: false });
        }
        res.status(200).json({ success: true, data: hotel });
    }catch(error){
        res.status(400).json({ success: false });
    }
};

//@desc Delete hotel
//@route DELETE /api/v1/hotels/:id
//@access Public
exports.deleteHotel = async (req, res) => {
    try{
        const hotel = await Hotel.findById(req.params.id);
        if (!hotel) {
            return res.status(404).json({ success: false ,message : `Hotel not found with this id`});
        }
        await Booking.deleteMany({ hotel: req.params.id });
        await Hotel.deleteOne({_id: req.params.id});
        res.status(200).json({ success: true, data: {} });
    }catch(error){
        res.status(400).json({ success: false });
    }
};

//@desc GET single hospital
//@route GET /api/v1/hospitals/:id
//@access Public
exports.getHospital = async (req, res) => {
    try {
        const hospital = await Hospital.findById(req.params.id);
        if (!hospital) {
            return res.status(404).json({ success: false });
        }
        res.status(200).json({ success: true, data: hospital });
    } catch (error) {
        res.status(400).json({ success: false });
    }
};

//@desc Create new hospital
//@route POST /api/v1/hospitals
//@access Private
exports.createHospital = async (req, res) => {
        const hospital = await Hospital.create(req.body);
        res.status(201).json({ success: true, data: hospital });
};

//@desc Update hospital
//@route PUT /api/v1/hospitals/:id
//@access Private
exports.updateHospital = async (req, res) => {
    try{
        const hospital = await Hospital.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!hospital) {
            return res.status(400).json({ success: false });
        }
        res.status(200).json({ success: true, data: hospital });
    }catch(error){
        res.status(400).json({ success: false });
    }
};

//@desc Delete hospital
//@route DELETE /api/v1/hospitals/:id
//@access Public
exports.deleteHospital = async (req, res) => {
    try{
        const hospital = await Hospital.findById(req.params.id);
        if (!hospital) {
            return res.status(404).json({ success: false ,message : `Hospital not found with this id`});
        }
        await Appointment.deleteMany({ hospital: req.params.id });
        await Hospital.deleteOne({_id: req.params.id});
        res.status(200).json({ success: true, data: {} });
    }catch(error){
        res.status(400).json({ success: false });
    }
}; 