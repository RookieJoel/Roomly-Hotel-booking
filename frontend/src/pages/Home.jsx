import { Link } from 'react-router-dom';
import { FaHotel, FaCalendarAlt, FaShieldAlt } from 'react-icons/fa';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to Roomly</h1>
          <p className="hero-subtitle">Your perfect hotel booking experience</p>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary btn-large">
              Get Started
            </Link>
            <Link to="/login" className="btn btn-secondary btn-large">
              Login
            </Link>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Why Choose Roomly?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <FaHotel />
              </div>
              <h3>Wide Selection</h3>
              <p>Choose from hundreds of hotels worldwide with the best rates</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <FaCalendarAlt />
              </div>
              <h3>Easy Booking</h3>
              <p>Book your perfect stay in just a few clicks</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <FaShieldAlt />
              </div>
              <h3>Secure Payment</h3>
              <p>Your payment information is safe and secure</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Book Your Next Stay?</h2>
          <p>Join thousands of happy travelers</p>
          <Link to="/register" className="btn btn-primary btn-large">
            Sign Up Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
