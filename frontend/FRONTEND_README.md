# Roomly Hotel Booking - Frontend

A modern React-based frontend for the Roomly Hotel booking application.

## Features

- ✨ User Authentication (Register/Login)
- 🏨 Browse Available Hotels
- 📅 Create and Manage Bookings
- ✏️ Edit Booking Dates
- ❌ Cancel Bookings
- 🎨 Beautiful UI with smooth animations
- 📱 Fully Responsive Design

## Technologies Used

- **React 19** - Frontend framework
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client for API requests
- **React Toastify** - Toast notifications
- **React Icons** - Icon library
- **Vite** - Build tool and dev server

## Getting Started

### Prerequisites

- Node.js (v20.19+ or v22.12+ recommended)
- Backend server running on port 5003

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will run on `http://localhost:5173` (or another port if 5173 is in use).

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/        # Reusable components
│   ├── Navbar.jsx    # Navigation bar component
│   └── Navbar.css
├── pages/            # Page components
│   ├── Home.jsx      # Landing page
│   ├── Login.jsx     # Login page
│   ├── Register.jsx  # Registration page
│   ├── Hotels.jsx    # Hotels listing page
│   ├── Bookings.jsx  # User bookings page
│   └── *.css         # Corresponding styles
├── utils/            # Utility functions
│   └── api.js        # API client configuration
├── App.jsx           # Main app component
├── App.css           # App-level styles
├── main.jsx          # App entry point
└── index.css         # Global styles
```

## API Configuration

The frontend connects to the backend API at `http://localhost:5003/api/v1`.

To change the API URL, edit `src/utils/api.js`:

```javascript
const API_BASE_URL = 'http://localhost:5003/api/v1';
```

## Available Routes

- `/` - Home page
- `/login` - Login page
- `/register` - Registration page
- `/hotels` - Browse hotels (protected)
- `/bookings` - Manage bookings (protected)

## Features in Detail

### Authentication
- Users can register with name, email, phone, and password
- Secure login with JWT token storage
- Protected routes require authentication
- Automatic token inclusion in API requests

### Hotel Browsing
- View all available hotels
- See hotel details (name, address, phone, rating)
- Book hotels with check-in and check-out dates

### Booking Management
- View all your bookings
- Edit booking dates
- Cancel bookings
- See hotel details for each booking

## Environment Variables

No environment variables needed for the frontend. The API URL is hardcoded in `src/utils/api.js`.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is part of the Roomly Hotel Booking system.
