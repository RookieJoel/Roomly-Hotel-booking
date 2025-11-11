# 📧 Gmail Setup for Forgot Password Feature

## Quick Setup (5 minutes)

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account: https://myaccount.google.com/
2. Click on "Security" in the left sidebar
3. Under "How you sign in to Google", click on "2-Step Verification"
4. Follow the steps to enable it (if not already enabled)

### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
   - Or: Google Account → Security → 2-Step Verification → App passwords
2. In "Select app" dropdown, choose "Mail"
3. In "Select device" dropdown, choose "Other (Custom name)"
4. Type: "Hotel Booking App"
5. Click "Generate"
6. **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)
   - ⚠️ Save this password! You won't be able to see it again

### Step 3: Update config.env

Open: `backend/config/config.env`

Replace these lines:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_NAME=Hotel Booking System
FROM_EMAIL=noreply@hotelbooking.com
```

With your actual values:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your-actual-gmail@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop
FROM_NAME=Hotel Booking System
FROM_EMAIL=your-actual-gmail@gmail.com
```

**Example:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=john.doe@gmail.com
SMTP_PASSWORD=wxyz abcd 1234 5678
FROM_NAME=Hotel Booking System
FROM_EMAIL=john.doe@gmail.com
```

### Step 4: Save and Restart
1. Save the config.env file
2. Backend will auto-restart (if using nodemon)
3. If not, restart manually: `npm run dev`

---

## ✅ Test It!

### Option 1: Use the Frontend UI
1. Go to: http://localhost:5173/login
2. Click "Forgot Password?"
3. Enter your email (a registered user's email)
4. Check your inbox for the reset email

### Option 2: Use curl (command line)
```bash
curl -X POST http://localhost:8080/api/v1/auth/forgotpassword \
  -H "Content-Type: application/json" \
  -d '{"email":"testforgot@example.com"}'
```

---

## 🔍 What to Expect

### Success Response:
```json
{
  "success": true,
  "msg": "Email sent. Please check your inbox.",
  "data": {}
}
```

### Email You'll Receive:
- **Subject:** Password Reset Request - Hotel Booking System
- **From:** Hotel Booking System
- **Contains:** 
  - Beautiful HTML template
  - "Reset Password" button
  - Link valid for 10 minutes
  - Security notice

### Email Link Format:
```
http://localhost:5173/reset-password/abc123def456...
```

---

## 🐛 Troubleshooting

### "Email could not be sent"
**Possible causes:**
1. **Wrong credentials** → Double-check email and app password
2. **App password not generated** → Make sure you created it (not regular password)
3. **2FA not enabled** → Must enable 2-Step Verification first
4. **Typo in config.env** → Check for extra spaces or quotes

### "There is no user with that email"
- Make sure the user is registered in the database
- Check the email spelling

### Email not arriving
1. **Check spam folder**
2. **Wait a minute** (Gmail can be slow sometimes)
3. **Check backend console** for error messages
4. **Verify SMTP credentials** are correct

### "Invalid credentials" from Gmail
- You might be using your regular Gmail password instead of the App Password
- Generate a new App Password and try again

---

## 📝 Important Notes

### Security
- ✅ Never commit config.env to Git (it's in .gitignore)
- ✅ App passwords are safer than regular passwords
- ✅ You can revoke App passwords anytime from Google Account settings

### Gmail Sending Limits
- **Personal Gmail:** 500 emails/day
- **Google Workspace:** 2,000 emails/day
- Good enough for development and small apps

### For Production
Consider using:
- **SendGrid** (12,000 free emails/month)
- **AWS SES** (62,000 free emails/month for 12 months)
- **Mailgun** (5,000 free emails/month)

---

## 🎯 Quick Commands

### Create test user:
```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","tel":"0812345678","email":"your-email@gmail.com","password":"password123"}'
```

### Request password reset:
```bash
curl -X POST http://localhost:8080/api/v1/auth/forgotpassword \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com"}'
```

### Reset password (get token from email):
```bash
curl -X PUT http://localhost:8080/api/v1/auth/resetpassword/YOUR_TOKEN_HERE \
  -H "Content-Type: application/json" \
  -d '{"password":"newpassword123","confirmPassword":"newpassword123"}'
```

---

## ✨ You're Ready!

Once you've updated the config.env with your Gmail credentials, the forgot password feature will work with real emails! 🎉
