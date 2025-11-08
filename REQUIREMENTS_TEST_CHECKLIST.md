# ✅ Requirements Testing Checklist

## System Requirements Validation - Roomly Hotel Booking

---

## 📋 Requirement 1: User Registration
**System shall allow user to register by specifying name, telephone, email, and password**

- [ ] **Test 1.1**: Register new user with all required fields
  - Input: name, tel (10 digits), email, password
  - Expected: Status 200/201, success=true, token received
  - Test File: "Register User (Success)"

- [ ] **Test 1.2**: Prevent duplicate email registration  
  - Input: Same email as existing user
  - Expected: Status 400, success=false
  - Test File: "Register User - Duplicate Email (Fail)"

**✅ PASS CRITERIA**: Both tests pass

---

## 📋 Requirement 2: User Login & Logout
**After registration, user becomes registered user and can login/logout with email and password**

- [ ] **Test 2.1**: Login with valid credentials
  - Input: email, password
  - Expected: Status 200, success=true, token received
  - Test File: "Login User (Success)"

- [ ] **Test 2.2**: Verify authentication status
  - Input: JWT token in Authorization header
  - Expected: Status 200, user data returned
  - Test File: "Get Current User (Verify Login)"

- [ ] **Test 2.3**: Logout successfully
  - Expected: Status 200, success=true
  - Test File: "Logout User"

**✅ PASS CRITERIA**: All 3 tests pass

---

## 📋 Requirement 3: Hotel List & Booking (Max 3 Nights)
**System shall allow registered user to book up to 3 nights by specifying date and preferred hotel. Hotel list is provided with name, address, tel**

- [ ] **Test 3.1**: Get hotel list
  - Expected: Status 200, array of hotels
  - Validate: Each hotel has name, address, tel
  - Test File: "Get Hotel List"

- [ ] **Test 3.2**: Create booking for 1 night
  - Input: bookingDate, checkoutDate (1 night), hotelId
  - Expected: Status 200/201, booking created
  - Test File: "Create Booking - 1 Night (Success)"

- [ ] **Test 3.3**: Create booking for 2 nights
  - Input: bookingDate, checkoutDate (2 nights), hotelId
  - Expected: Status 200/201, booking created
  - Test File: "Create Booking - 2 Nights (Success)"

- [ ] **Test 3.4**: Create booking for 3 nights (maximum)
  - Input: bookingDate, checkoutDate (3 nights), hotelId
  - Expected: Status 200/201, booking created
  - Test File: "Create Booking - 3 Nights (Success)"

- [ ] **Test 3.5**: Reject booking for more than 3 nights
  - Input: bookingDate, checkoutDate (4+ nights), hotelId
  - Expected: Status 400, success=false, error message
  - Test File: "Create Booking - More than 3 Nights (Should Fail)"

**✅ PASS CRITERIA**: 
- Tests 3.1-3.4 pass (success cases)
- Test 3.5 passes (validation working)

---

## 📋 Requirement 4: View Own Bookings
**System shall allow registered user to view his hotel bookings**

- [ ] **Test 4.1**: Get all user's bookings
  - Input: User JWT token
  - Expected: Status 200, array of user's bookings only
  - Test File: "Get User's Bookings"

- [ ] **Test 4.2**: Get single booking details
  - Input: User JWT token, booking ID
  - Expected: Status 200, booking details with hotel info
  - Test File: "Get Single Booking"

**✅ PASS CRITERIA**: Both tests pass, user sees only their bookings

---

## 📋 Requirement 5: Edit Own Bookings
**System shall allow registered user to edit his hotel bookings**

- [ ] **Test 5.1**: Update own booking
  - Input: User JWT token, booking ID, new dates
  - Expected: Status 200, success=true, booking updated
  - Test File: "Update User's Booking (Success)"

**✅ PASS CRITERIA**: User can successfully edit their booking

---

## 📋 Requirement 6: Delete Own Bookings
**System shall allow registered user to delete his hotel bookings**

- [ ] **Test 6.1**: Delete own booking
  - Input: User JWT token, booking ID
  - Expected: Status 200, success=true, booking deleted
  - Test File: "Delete User's Booking (Success)"

**✅ PASS CRITERIA**: User can successfully delete their booking

---

## 📋 Requirement 7: Admin View Any Bookings
**System shall allow admin to view any hotel bookings**

- [ ] **Setup**: Create admin user
  - Test File: "Setup Admin User" folder

- [ ] **Test 7.1**: Admin get all bookings
  - Input: Admin JWT token
  - Expected: Status 200, array of ALL bookings (all users)
  - Test File: "Admin Get All Bookings"

- [ ] **Test 7.2**: Admin get specific user's booking
  - Input: Admin JWT token, any booking ID
  - Expected: Status 200, booking details (even if not admin's)
  - Test File: "Admin Get Specific User's Booking"

**✅ PASS CRITERIA**: Admin can see all bookings from all users

---

## 📋 Requirement 8: Admin Edit Any Bookings
**System shall allow admin to edit any hotel bookings**

- [ ] **Test 8.1**: Admin update any user's booking
  - Input: Admin JWT token, any booking ID, new data
  - Expected: Status 200, success=true, booking updated
  - Test File: "Admin Update Any Booking (Success)"

**✅ PASS CRITERIA**: Admin can edit bookings created by other users

---

## 📋 Requirement 9: Admin Delete Any Bookings
**System shall allow admin to delete any hotel bookings**

- [ ] **Test 9.1**: Admin delete any user's booking
  - Input: Admin JWT token, any booking ID
  - Expected: Status 200, success=true, booking deleted
  - Test File: "Admin Delete Any Booking (Success)"

**✅ PASS CRITERIA**: Admin can delete bookings created by other users

---

## 🎯 Overall Validation Summary

### Total Requirements: 9
### Total Test Cases: 19

| Requirement | Tests | Status |
|-------------|-------|--------|
| REQ 1 | 2 | ⬜ |
| REQ 2 | 3 | ⬜ |
| REQ 3 | 5 | ⬜ |
| REQ 4 | 2 | ⬜ |
| REQ 5 | 1 | ⬜ |
| REQ 6 | 1 | ⬜ |
| REQ 7 | 2 | ⬜ |
| REQ 8 | 1 | ⬜ |
| REQ 9 | 1 | ⬜ |

---

## 📊 Test Execution Results

**Date**: _____________  
**Tester**: _____________  
**Environment**: Development / Staging / Production  
**Backend Version**: _____________  

**Results**:
- Total Tests Run: _______ / 19
- Tests Passed: _______ 
- Tests Failed: _______
- Pass Rate: _______% 

**Sign-off**:
- [ ] All requirements validated
- [ ] All tests passing
- [ ] No critical issues found
- [ ] System ready for next phase

**Notes**:
_____________________________________________
_____________________________________________
_____________________________________________

---

## 🔍 Detailed Test Results Template

For each failed test, document:

**Requirement #**: _____  
**Test Name**: _____________________  
**Expected Result**: _____________________  
**Actual Result**: _____________________  
**Error Message**: _____________________  
**Root Cause**: _____________________  
**Fix Required**: _____________________  
**Retest Status**: Pass / Fail / Pending  

---

**Document Version**: 1.0  
**Last Updated**: November 2025  
**Next Review**: _____________
