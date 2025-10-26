import { useState, useEffect } from 'react';
import { FaCalendarAlt, FaHotel, FaTrash, FaEdit } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { bookingsAPI } from '../utils/api';
import './Bookings.css';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBooking, setEditingBooking] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    bookingDate: '',
    checkoutDate: '',
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await bookingsAPI.getAll();
      if (response.data.success) {
        setBookings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const response = await bookingsAPI.delete(bookingId);
      if (response.data.success) {
        toast.success('Booking cancelled successfully');
        setBookings(bookings.filter(b => b._id !== bookingId));
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error('Failed to cancel booking');
    }
  };

  const handleEdit = (booking) => {
    setEditingBooking(booking);
    setEditData({
      bookingDate: booking.bookingDate.split('T')[0],
      checkoutDate: booking.checkoutDate.split('T')[0],
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    setEditData({
      ...editData,
      [e.target.name]: e.target.value,
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    const checkIn = new Date(editData.bookingDate);
    const checkOut = new Date(editData.checkoutDate);
    
    if (checkOut <= checkIn) {
      toast.error('Checkout date must be after check-in date');
      return;
    }

    try {
      const response = await bookingsAPI.update(editingBooking._id, {
        bookingDate: editData.bookingDate,
        checkoutDate: editData.checkoutDate,
      });

      if (response.data.success) {
        toast.success('Booking updated successfully');
        setShowEditModal(false);
        setEditingBooking(null);
        fetchBookings(); // Refresh bookings
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking');
    }
  };

  const closeModal = () => {
    setShowEditModal(false);
    setEditingBooking(null);
    setEditData({ bookingDate: '', checkoutDate: '' });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return <div className="loading">Loading bookings...</div>;
  }

  return (
    <div className="bookings-page">
      <div className="container">
        <h1 className="page-title">My Bookings</h1>
        
        {bookings.length === 0 ? (
          <div className="no-bookings">
            <p>You don't have any bookings yet.</p>
            <a href="/hotels" className="btn btn-primary">Browse Hotels</a>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map((booking) => (
              <div key={booking._id} className="booking-card">
                <div className="booking-header">
                  <h3 className="booking-hotel">
                    <FaHotel /> {booking.hotel?.name || 'Hotel'}
                  </h3>
                  <div className="booking-actions">
                    <button 
                      onClick={() => handleEdit(booking)}
                      className="btn-icon btn-edit"
                      title="Edit booking"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      onClick={() => handleDelete(booking._id)}
                      className="btn-icon btn-delete"
                      title="Cancel booking"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>

                <div className="booking-details">
                  <div className="booking-info">
                    <p className="booking-date">
                      <FaCalendarAlt /> Check-in: {formatDate(booking.bookingDate)}
                    </p>
                    <p className="booking-date">
                      <FaCalendarAlt /> Check-out: {formatDate(booking.checkoutDate)}
                    </p>
                  </div>
                  
                  {booking.hotel && (
                    <div className="hotel-details">
                      <p>📍 {booking.hotel.address}</p>
                      <p>📞 {booking.hotel.tel}</p>
                    </div>
                  )}
                </div>

                <div className="booking-footer">
                  <span className="booking-created">
                    Booked on: {formatDate(booking.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>&times;</button>
            <h2>Edit Booking</h2>
            
            <form onSubmit={handleEditSubmit} className="edit-form">
              <div className="form-group">
                <label htmlFor="bookingDate">Check-in Date</label>
                <input
                  type="date"
                  id="bookingDate"
                  name="bookingDate"
                  value={editData.bookingDate}
                  onChange={handleEditChange}
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
                  value={editData.checkoutDate}
                  onChange={handleEditChange}
                  min={editData.bookingDate || new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block">
                Update Booking
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
