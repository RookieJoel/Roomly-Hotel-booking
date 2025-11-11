# 🚀 Quick Start - Postman Testing

## One-Command Setup

1. **Import Collection**
   ```
   File: Roomly_Hotel_Booking_API_Tests.postman_collection.json
   ```

2. **Start Backend**
   ```bash
   cd backend
   npm run dev
   ```

3. **Run All Tests**
   - Right-click collection → "Run collection" → "Run"

---

## ✅ Expected Results Summary

| Requirement | Tests | What It Validates |
|-------------|-------|-------------------|
| REQ 1 | 2 | ✅ User registration with name, tel, email, password |
| REQ 2 | 3 | ✅ Login/logout functionality |
| REQ 3 | 6 | ✅ Hotel list, booking creation (max 3 nights enforced) |
| REQ 4 | 2 | ✅ View own bookings |
| REQ 5 | 1 | ✅ Edit own bookings |
| REQ 6 | 1 | ✅ Delete own bookings |
| REQ 7 | 2 | ✅ Admin view any bookings |
| REQ 8 | 1 | ✅ Admin edit any bookings |
| REQ 9 | 1 | ✅ Admin delete any bookings |

**Total: 19 Requests = All 9 Requirements Covered**

---

## 📋 Pre-Test Checklist

- [ ] Backend server running on port 8080
- [ ] MongoDB connected
- [ ] At least 1 hotel exists in database
- [ ] Postman installed
- [ ] Collection imported

---

## 🎯 Critical Tests

### Must Pass
1. ✅ Register user → Get token
2. ✅ Login → Get token
3. ✅ Create booking ≤ 3 nights → Success
4. ✅ Create booking > 3 nights → Fail (400)
5. ✅ Admin can access all bookings
6. ✅ User can only access own bookings

---

## 🔧 Quick Fixes

**No hotels found?**
```bash
POST /api/v1/hotels
{
  "name": "Test Hotel",
  "address": "123 Test St",
  "tel": "0812345678"
}
```

**Token expired?**
→ Re-run login request

**Admin tests fail?**
→ Run "Setup Admin User" folder first

---

## 📊 Test Flow

```
1. Register User → 2. Login → 3. Get Hotels → 4. Create Bookings 
→ 5. View Bookings → 6. Edit Booking → 7. Delete Booking
→ 8. Register Admin → 9. Admin Operations
```

---

## 🎓 Key Endpoints

```
POST   /auth/register       - Create account
POST   /auth/login          - Get JWT token
GET    /hotels              - List all hotels
POST   /hotels/:id/bookings - Create booking
GET    /bookings            - View bookings
PUT    /bookings/:id        - Update booking
DELETE /bookings/:id        - Delete booking
```

---

**Estimated Run Time**: 5-10 seconds  
**Expected Pass Rate**: 100%  
**Total Assertions**: 60+
