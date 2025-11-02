import { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaPhone, FaStar } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { hotelsAPI, bookingsAPI } from '../utils/api';
import './Hotels.css';

const Hotels = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    bookingDate: '',
    checkoutDate: '',
  });

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      const response = await hotelsAPI.getAll();
      if (response.data.success) {
        setHotels(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching hotels:', error);
      toast.error('Failed to load hotels');
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = (hotel) => {
    setSelectedHotel(hotel);
    setShowBookingModal(true);
  };

  const handleBookingChange = (e) => {
    setBookingData({
      ...bookingData,
      [e.target.name]: e.target.value,
    });
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    if (!bookingData.bookingDate || !bookingData.checkoutDate) {
      toast.error('Please fill in all fields');
      return;
    }

    const checkIn = new Date(bookingData.bookingDate);
    const checkOut = new Date(bookingData.checkoutDate);
    
    if (checkOut <= checkIn) {
      toast.error('Checkout date must be after check-in date');
      return;
    }

    try {
      const response = await bookingsAPI.create({
        hotel: selectedHotel._id,
        bookingDate: bookingData.bookingDate,
        checkoutDate: bookingData.checkoutDate,
      });

      if (response.data.success) {
        toast.success('Booking created successfully!');
        setShowBookingModal(false);
        setBookingData({ bookingDate: '', checkoutDate: '' });
        setSelectedHotel(null);
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.response?.data?.message || 'Failed to create booking');
    }
  };

  const closeModal = () => {
    setShowBookingModal(false);
    setSelectedHotel(null);
    setBookingData({ bookingDate: '', checkoutDate: '' });
  };

  if (loading) {
    return <div className="loading">Loading hotels...</div>;
  }

  return (
    <div className="hotels-page">
      <div className="container">
        <h1 className="page-title">Available Hotels</h1>
        
        {hotels.length === 0 ? (
          <div className="no-hotels">
            <p>No hotels available at the moment.</p>
          </div>
        ) : (
          <div className="hotels-grid">
            {hotels.map((hotel) => (
              <div key={hotel._id} className="hotel-card">
                <div className="hotel-image">
                  <img 
                    src={hotel.picture || 'https://via.placeholder.com/400x300?text=Hotel'} 
                    alt={hotel.name} 
                  />
                </div>
                <div className="hotel-content">
                  <h3 className="hotel-name">{hotel.name}</h3>
                  
                  <div className="hotel-info">
                    <p className="hotel-address">
                      <FaMapMarkerAlt /> {hotel.address}
                    </p>
                    <p className="hotel-district">
                      District: {hotel.district}
                    </p>
                    <p className="hotel-province">
                      Province: {hotel.province}
                    </p>
                    <p className="hotel-tel">
                      <FaPhone /> {hotel.tel}
                    </p>
                    <div className="hotel-rating">
                      <FaStar /> {hotel.rating || 'N/A'}
                    </div>
                  </div>

                  <button 
                    onClick={() => handleBookNow(hotel)} 
                    className="btn btn-primary btn-book"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>&times;</button>
            <h2>Book {selectedHotel?.name}</h2>
            
            <form onSubmit={handleBookingSubmit} className="booking-form">
              <div className="form-group">
                <label htmlFor="bookingDate">Check-in Date</label>
                <input
                  type="date"
                  id="bookingDate"
                  name="bookingDate"
                  value={bookingData.bookingDate}
                  onChange={handleBookingChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="checkoutDate">Check-out Date</label>
                <input
                  type="date"
                  id="checkoutDate"
                  name="checkoutDate"
                  value={bookingData.checkoutDate}
                  onChange={handleBookingChange}
                  min={bookingData.bookingDate || new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block">
                Confirm Booking
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hotels;
