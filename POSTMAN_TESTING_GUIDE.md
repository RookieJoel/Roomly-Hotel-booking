# Roomly Hotel Booking - API Testing Guide

## 📋 Overview

This Postman collection contains comprehensive tests for all 9 system requirements of the Roomly Hotel Booking system.

## 🎯 Requirements Coverage

| Requirement | Description | Test Coverage |
|-------------|-------------|---------------|
| **REQ 1** | User Registration (name, tel, email, password) | ✅ 2 tests |
| **REQ 2** | User Login & Logout | ✅ 3 tests |
| **REQ 3** | Hotel List & Booking (max 3 nights) | ✅ 6 tests |
| **REQ 4** | View Own Bookings | ✅ 2 tests |
| **REQ 5** | Edit Own Bookings | ✅ 1 test |
| **REQ 6** | Delete Own Bookings | ✅ 1 test |
| **REQ 7** | Admin View Any Bookings | ✅ 2 tests |
| **REQ 8** | Admin Edit Any Bookings | ✅ 1 test |
| **REQ 9** | Admin Delete Any Bookings | ✅ 1 test |

**Total: 19 API Tests**

---

## 🚀 Setup Instructions

### Prerequisites
1. **Postman** installed (Desktop or Web)
2. **Backend server** running on `http://localhost:8080`
3. **MongoDB** connected with at least one hotel in the database

### Import Collection
1. Open Postman
2. Click **Import** button
3. Select `Roomly_Hotel_Booking_API_Tests.postman_collection.json`
4. Collection will appear in your workspace

---

## ⚙️ Configuration

### Environment Variables (Auto-configured)
The collection uses **Collection Variables** that are automatically set during test execution:

| Variable | Description | Set By |
|----------|-------------|--------|
| `base_url` | API base URL | Pre-configured: `http://localhost:8080/api/v1` |
| `user_token` | Regular user JWT token | Auto-set after login |
| `admin_token` | Admin user JWT token | Auto-set after admin login |
| `hotel_id` | Hotel ID for bookings | Auto-set from hotel list |
| `booking_id_1` | First booking ID | Auto-set after creating booking |
| `booking_id_2` | Second booking ID | Auto-set after creating booking |
| `booking_id_3` | Third booking ID | Auto-set after creating booking |

### Manual Configuration (if needed)
1. Click on the collection
2. Go to **Variables** tab
3. Update `base_url` if your backend runs on a different port

---

## 🏃 Running Tests

### Option 1: Run Entire Collection (Recommended)
1. Right-click on the collection name
2. Select **Run collection**
3. Click **Run Roomly Hotel Booking - Requirements Testing**
4. View results with pass/fail status for each requirement

### Option 2: Run Individual Folders
Run folders in this order:
1. **Requirement 1 - User Registration**
2. **Requirement 2 - User Login & Logout**
3. **Requirement 3 - Hotel List & Booking**
4. **Requirement 4 - View Own Bookings**
5. **Requirement 5 - Edit Own Bookings**
6. **Requirement 6 - Delete Own Bookings**
7. **Setup Admin User** *(prerequisite for REQ 7-9)*
8. **Requirement 7 - Admin View Any Bookings**
9. **Requirement 8 - Admin Edit Any Bookings**
10. **Requirement 9 - Admin Delete Any Bookings**

### Option 3: Run Individual Requests
1. Expand any folder
2. Click on a request
3. Click **Send**
4. View test results in the **Test Results** tab

---

## 📊 Test Scenarios

### Requirement 1: User Registration
- ✅ **Test 1.1**: Register user with valid data (name, tel, email, password)
- ✅ **Test 1.2**: Prevent duplicate email registration

### Requirement 2: Login & Logout
- ✅ **Test 2.1**: Login with valid credentials
- ✅ **Test 2.2**: Verify authentication with token
- ✅ **Test 2.3**: Logout successfully

### Requirement 3: Hotel Booking (Max 3 Nights)
- ✅ **Test 3.1**: Get hotel list with name, address, tel
- ✅ **Test 3.2**: Create booking for 1 night
- ✅ **Test 3.3**: Create booking for 2 nights
- ✅ **Test 3.4**: Create booking for 3 nights (maximum allowed)
- ✅ **Test 3.5**: Reject booking for more than 3 nights

### Requirement 4: View Own Bookings
- ✅ **Test 4.1**: Get all user's bookings
- ✅ **Test 4.2**: Get single booking details

### Requirement 5: Edit Own Bookings
- ✅ **Test 5.1**: Update booking dates

### Requirement 6: Delete Own Bookings
- ✅ **Test 6.1**: Delete own booking

### Requirement 7: Admin View Bookings
- ✅ **Test 7.1**: Admin view all bookings (all users)
- ✅ **Test 7.2**: Admin view specific user's booking

### Requirement 8: Admin Edit Bookings
- ✅ **Test 8.1**: Admin update any user's booking

### Requirement 9: Admin Delete Bookings
- ✅ **Test 9.1**: Admin delete any user's booking

---

## 🔍 Understanding Test Results

### Successful Test Response
```json
{
  "success": true,
  "data": { ... },
  "token": "jwt_token_here"
}
```

### Test Assertions
Each test includes multiple assertions:
- ✅ HTTP status code validation
- ✅ Response structure validation
- ✅ Required field existence
- ✅ Business logic validation
- ✅ Requirement satisfaction confirmation

### Example Test Output
```
✅ Status code is 200
✅ Response has success=true
✅ Response contains token
✅ User has required fields: name, tel, email
✅ REQ 1: User can register with name, tel, email, password
```

---

## 🛠️ Troubleshooting

### Issue: "Hotel not found" or `hotel_id` is empty
**Solution**: Ensure at least one hotel exists in the database
```bash
# Create a hotel via API or MongoDB
POST /api/v1/hotels
{
  "name": "Test Hotel",
  "address": "123 Test Street",
  "tel": "0812345678"
}
```

### Issue: Token expired
**Solution**: Re-run the login request to get a fresh token

### Issue: Tests fail on "Admin" requirements
**Solution**: Ensure you run "Setup Admin User" folder first

### Issue: Connection refused
**Solution**: 
1. Check backend server is running: `npm run dev`
2. Verify port 8080 is accessible
3. Update `base_url` variable if using different port

### Issue: "Booking exceeds 3 nights" test passes when it should fail
**Solution**: Check backend validation logic in `bookings` controller

---

## 📝 Test Data

### Regular User
- **Email**: testuser@example.com
- **Password**: password123
- **Name**: Test User
- **Tel**: 0812345678

### Admin User
- **Email**: admin@example.com
- **Password**: admin123
- **Name**: Admin User
- **Tel**: 0898765432

---

## 🎓 Best Practices

1. **Run tests in sequence** - Tests are designed to run in order
2. **Clean database** - For consistent results, start with a clean database
3. **Check variables** - Ensure all collection variables are set correctly
4. **Review test scripts** - Understand what each test validates
5. **Monitor console** - Check Postman console for detailed request/response logs

---

## 📈 Expected Results

When running the complete collection:
- **Total Tests**: 60+ assertions
- **Expected Pass Rate**: 100% (if backend is correctly implemented)
- **Duration**: ~5-10 seconds

---

## 🔗 API Endpoints Tested

| Method | Endpoint | Requirement |
|--------|----------|-------------|
| POST | `/auth/register` | REQ 1 |
| POST | `/auth/login` | REQ 2 |
| GET | `/auth/me` | REQ 2 |
| GET | `/auth/logout` | REQ 2 |
| GET | `/hotels` | REQ 3 |
| POST | `/hotels/:hotelId/bookings` | REQ 3 |
| GET | `/bookings` | REQ 4, 7 |
| GET | `/bookings/:id` | REQ 4, 7 |
| PUT | `/bookings/:id` | REQ 5, 8 |
| DELETE | `/bookings/:id` | REQ 6, 9 |

---

## 📞 Support

If tests fail unexpectedly:
1. Check backend server logs
2. Verify MongoDB connection
3. Ensure all routes are implemented
4. Check middleware (auth, authorization)
5. Validate business logic (e.g., 3-night limit)

---

## ✨ Features

- ✅ Automated token management
- ✅ Sequential test execution
- ✅ Clear pass/fail indicators
- ✅ Comprehensive assertions
- ✅ Business logic validation
- ✅ Error case testing
- ✅ Admin vs User authorization testing
- ✅ Self-documenting test names

---

**Created for**: Roomly Hotel Booking System  
**Purpose**: System Requirements Validation  
**Version**: 1.0.0  
**Last Updated**: November 2025
