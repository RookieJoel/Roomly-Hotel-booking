import { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaPhone, FaStar } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { hotelsAPI, bookingsAPI, authAPI } from '../utils/api';
import './Hotels.css';

const Hotels = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newHotel, setNewHotel] = useState({ name: '', address: '', tel: '', district: '', province: '', picture: '' });
  const [bookingData, setBookingData] = useState({
    bookingDate: '',
    checkoutDate: '',
  });

  useEffect(() => {
    checkAdmin();
    fetchHotels();
  }, []);

  const checkAdmin = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return setIsAdmin(false);
      const res = await authAPI.getMe();
      if (res.data && res.data.data) {
        setIsAdmin(res.data.data.role === 'admin');
      }
    } catch (err) {
      setIsAdmin(false);
    }
  };

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

  const handleCreateChange = (e) => {
    setNewHotel({ ...newHotel, [e.target.name]: e.target.value });
  };

  const openCreate = () => {
    setShowCreateModal(true);
  };

  const closeCreate = () => {
    setShowCreateModal(false);
    setNewHotel({ name: '', address: '', tel: '' });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newHotel.name || !newHotel.address) {
      toast.error('Please provide at least name and address');
      return;
    }
    try {
      const res = await hotelsAPI.create(newHotel);
      if (res.data && res.data.success) {
        toast.success('Hotel created');
        closeCreate();
        fetchHotels();
      }
    } catch (err) {
      console.error('Create hotel error', err);
      toast.error(err.response?.data?.msg || 'Failed to create hotel');
    }
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
      // compute number of nights and call the hotel-scoped booking endpoint
      const response = await bookingsAPI.createForHotel(selectedHotel._id, {
        bookingDate: bookingData.bookingDate,
        checkoutDate: bookingData.checkoutDate,
      });

      if (response.data && response.data.success) {
        toast.success('Booking created successfully!');
        setShowBookingModal(false);
        setBookingData({ bookingDate: '', checkoutDate: '' });
        setSelectedHotel(null);
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.response?.data?.message || error.response?.data?.msg || 'Failed to create booking');
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
        {isAdmin && (
          <div style={{ marginBottom: '1rem' }}>
            <button className="btn btn-primary" onClick={openCreate}>Create New Hotel</button>
          </div>
        )}
        
        {hotels.length === 0 ? (
          <div className="no-hotels">
            <p>No hotels available at the moment.</p>
          </div>
        ) : (
          <div className="hotels-grid">
            {hotels.map((hotel) => (
              <div key={hotel._id} className="hotel-card">
                <div className="hotel-content">
                  <h3 className="hotel-name">{hotel.name}</h3>
                  
                  <div className="hotel-info">
                    <p className="hotel-address">
                      <FaMapMarkerAlt /> {hotel.address}
                    </p>
                    <p className="hotel-tel">
                      <FaPhone /> {hotel.tel}
                    </p>
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

      {/* (Removed bookings list UI per request) */}

      {/* Create Hotel Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={closeCreate}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeCreate}>&times;</button>
            <h2>Create Hotel</h2>
            <form onSubmit={handleCreateSubmit} className="booking-form">
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input id="name" name="name" value={newHotel.name} onChange={handleCreateChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input id="address" name="address" value={newHotel.address} onChange={handleCreateChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="tel">Phone</label>
                <input id="tel" name="tel" value={newHotel.tel} onChange={handleCreateChange} />
              </div>
              <button type="submit" className="btn btn-primary btn-block">Create</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hotels;
