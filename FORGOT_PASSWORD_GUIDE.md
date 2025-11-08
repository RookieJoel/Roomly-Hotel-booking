# 🔐 Forgot Password Feature - Setup Guide

## Overview
The forgot password feature allows users to reset their password via email confirmation. The flow works as follows:

1. User clicks "Forgot Password?" on the login page
2. User enters their email address
3. System sends a password reset link to their email (valid for 10 minutes)
4. User clicks the link in the email
5. User enters and confirms their new password
6. User is automatically logged in with the new password

---

## Backend Implementation ✅

### 1. User Model Updates (`backend/models/User.js`)
- Added `crypto` module for token generation
- Added `getResetPasswordToken()` method that:
  - Generates a random token
  - Hashes it and stores in `resetpasswordToken`
  - Sets expiration time (10 minutes) in `resetpasswordExpire`
  - Returns the unhashed token to be sent in email

### 2. Email Utility (`backend/utils/sendEmail.js`)
- Created email sending utility using `nodemailer`
- Supports custom HTML email templates
- Configurable SMTP settings

### 3. Auth Controller (`backend/controllers/auth.js`)
Added two new functions:

#### `forgotPassword` (POST /api/v1/auth/forgotpassword)
- Finds user by email
- Generates reset token
- Sends beautifully formatted HTML email with reset link
- Link format: `http://localhost:5173/reset-password/{token}`
- Token expires in 10 minutes

#### `resetPassword` (PUT /api/v1/auth/resetpassword/:resettoken)
- Validates the reset token and expiration
- Checks if passwords match
- Updates user password
- Clears reset token fields
- Automatically logs user in with new JWT token

### 4. Routes (`backend/routes/auth.js`)
- `POST /api/v1/auth/forgotpassword` - Request password reset
- `PUT /api/v1/auth/resetpassword/:resettoken` - Reset password with token

---

## Frontend Implementation ✅

### 1. ForgotPassword Page (`frontend/src/pages/ForgotPassword.jsx`)
- Clean UI for entering email address
- Shows success message after email is sent
- Option to resend email
- Link back to login page

### 2. ResetPassword Page (`frontend/src/pages/ResetPassword.jsx`)
- Accepts new password and confirmation
- Real-time password match validation
- Shows success animation
- Auto-redirects to home page after successful reset
- Automatically logs user in

### 3. App.jsx Updates
- Added routes for `/forgot-password` and `/reset-password/:resettoken`
- Protected routes redirect logged-in users

### 4. Login Page Update
- Added "Forgot Password?" link above login button

---

## 📧 Email Configuration Setup

### Option 1: Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "Hotel Booking App"
   - Copy the 16-character password

3. **Update `backend/config/config.env`:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your-gmail@gmail.com
SMTP_PASSWORD=your-16-char-app-password
FROM_NAME=Hotel Booking System
FROM_EMAIL=your-gmail@gmail.com
```

### Option 2: Mailtrap (Best for Testing)

1. **Create free account:** https://mailtrap.io/
2. **Get SMTP credentials** from your inbox
3. **Update `backend/config/config.env`:**
```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_EMAIL=your-mailtrap-username
SMTP_PASSWORD=your-mailtrap-password
FROM_NAME=Hotel Booking System
FROM_EMAIL=noreply@hotelbooking.com
```

### Option 3: SendGrid, AWS SES, etc. (Production)
Follow their documentation for SMTP credentials.

---

## 🧪 Testing the Feature

### 1. Start Backend
```bash
cd backend
npm run dev
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

### 3. Test Flow

#### Step 1: Request Password Reset
1. Go to http://localhost:5173/login
2. Click "Forgot Password?"
3. Enter a registered user's email
4. Click "Send Reset Link"
5. Check your email inbox (or Mailtrap inbox)

#### Step 2: Reset Password
1. Open the email
2. Click the "Reset Password" button (or copy the link)
3. Enter new password (min 6 characters)
4. Confirm password
5. Click "Reset Password"
6. You'll be automatically logged in and redirected to home

### 4. Test Edge Cases

#### Invalid Email
```bash
curl -X POST http://localhost:8080/api/v1/auth/forgotpassword \
  -H "Content-Type: application/json" \
  -d '{"email": "nonexistent@example.com"}'
```
Expected: `404` - "There is no user with that email"

#### Expired Token
- Wait 10 minutes after requesting reset
- Try to use the link
Expected: `400` - "Invalid token or token has expired"

#### Password Mismatch
- Enter different passwords in the two fields
Expected: Frontend shows error before submitting

---

## 📝 API Documentation

### Request Password Reset

**Endpoint:** `POST /api/v1/auth/forgotpassword`

**Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "msg": "Email sent. Please check your inbox.",
  "data": {}
}
```

**Error Response (404):**
```json
{
  "success": false,
  "msg": "There is no user with that email"
}
```

---

### Reset Password

**Endpoint:** `PUT /api/v1/auth/resetpassword/:resettoken`

**Parameters:**
- `resettoken` - The token from the email URL

**Body:**
```json
{
  "password": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "_id": "user_id",
  "name": "User Name",
  "email": "user@example.com"
}
```

**Error Responses:**

**400 - Invalid/Expired Token:**
```json
{
  "success": false,
  "msg": "Invalid token or token has expired"
}
```

**400 - Password Mismatch:**
```json
{
  "success": false,
  "msg": "Passwords do not match"
}
```

---

## 🎨 Email Template Features

The password reset email includes:
- ✅ Professional gradient header design
- ✅ Clear instructions
- ✅ Prominent "Reset Password" button
- ✅ Fallback text link (for email clients that block buttons)
- ✅ Expiration warning (10 minutes)
- ✅ Security note (ignore if not requested)
- ✅ Responsive design
- ✅ Hotel branding

---

## 🔒 Security Features

1. **Token Hashing:** Reset tokens are hashed before storage (SHA256)
2. **Short Expiration:** Tokens expire after 10 minutes
3. **One-time Use:** Token is deleted after successful reset
4. **Password Validation:** Minimum 6 characters enforced
5. **Secure Transmission:** Tokens sent via email only
6. **No Password Hints:** Email doesn't reveal if account exists (in production, both cases return same message)

---

## 🚨 Important Notes

### For Development
- Use Gmail or Mailtrap for testing
- Keep SMTP credentials secure
- Don't commit `.env` file with real credentials

### For Production
- Use professional email service (SendGrid, AWS SES, Mailgun)
- Enable SSL/TLS
- Use your domain for `FROM_EMAIL`
- Consider rate limiting forgot password requests
- Log password reset attempts for security monitoring
- Update `FRONTEND_URL` in config.env to production URL

---

## 📁 Files Created/Modified

### Backend
- ✅ `backend/models/User.js` - Added reset token methods
- ✅ `backend/utils/sendEmail.js` - Email utility (NEW)
- ✅ `backend/controllers/auth.js` - Forgot & reset password functions
- ✅ `backend/routes/auth.js` - New routes
- ✅ `backend/config/config.env` - Email configuration

### Frontend
- ✅ `frontend/src/pages/ForgotPassword.jsx` - Request reset page (NEW)
- ✅ `frontend/src/pages/ResetPassword.jsx` - Reset password page (NEW)
- ✅ `frontend/src/App.jsx` - Added routes
- ✅ `frontend/src/pages/Login.jsx` - Added forgot password link

---

## 🐛 Troubleshooting

### Email Not Sending
1. Check SMTP credentials in config.env
2. For Gmail: Make sure you're using App Password, not regular password
3. Check backend console for error messages
4. Test SMTP connection with a simple script

### "Invalid token" Error
1. Check if token has expired (10 minutes)
2. Verify token in URL matches what's in database (use MongoDB Compass)
3. Make sure you're using the full token from email

### Password Not Updating
1. Check password meets minimum requirements (6 chars)
2. Verify passwords match
3. Check backend console for save errors

---

## ✅ Feature Complete!

The forgot password feature is now fully implemented and ready to use! Make sure to:
1. Configure email settings in `config.env`
2. Test the complete flow
3. Update security settings for production

Happy coding! 🚀
