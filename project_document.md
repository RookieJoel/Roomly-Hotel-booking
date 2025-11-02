# เอกสารการพัฒนาระบบ Hotel Booking System

## สรุปการเปลี่ยนแปลงโค้ดเพื่อให้ตรงตาม Requirements 1-3

---

## ข้อกำหนด (Requirements)

### ข้อ 1: ระบบลงทะเบียนผู้ใช้
- ผู้ใช้สามารถลงทะเบียนด้วย **ชื่อ (name)**, **หมายเลขโทรศัพท์ (tel)**, **อีเมล (email)** และ **รหัสผ่าน (password)**

### ข้อ 2: ระบบ Login/Logout
- ผู้ใช้สามารถ **Login** ด้วย email และ password
- ผู้ใช้สามารถ **Logout** ออกจากระบบได้

### ข้อ 3: ระบบจองโรงแรม
- ผู้ใช้สามารถจองโรงแรมได้โดยระบุ:
  - **วันที่เข้าพัก (bookingDate)**
  - **จำนวนคืน (numOfNights)** จำกัดไม่เกิน **3 คืน**
  - **โรงแรมที่ต้องการจอง (hotel)**
- ผู้ใช้แต่ละคนสามารถมี **การจองได้สูงสุด 3 ครั้ง**

---

## การเปลี่ยนแปลงโค้ดที่สำคัญ

---

## 1. Models (โครงสร้างข้อมูล)

### 1.1 User Model (`backend/models/User.js`)

#### เพิ่มฟิลด์ `tel` (หมายเลขโทรศัพท์)
**เหตุผล:** เพื่อให้ตรงตามข้อกำหนดที่ 1 ที่ต้องการให้ผู้ใช้ลงทะเบียนด้วยหมายเลขโทรศัพท์

```javascript
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    tel: {
        type: String,
        required: function() {
            return !this.googleId; // required only if not OAuth user
        },
        match: [/^\d{10}$/, 'Please add a valid 10-digit telephone number']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please add a valid email'
        ]
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: function() {
            return !this.googleId; // required only if not OAuth user
        },
        minlength: 6,
        select: false
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    createdAt: {
        type: Date,
        default: Date.now
    }
});
```

**การตั้งค่าที่สำคัญ:**
- `tel` เป็น String จำกัด 10 หลักด้วย regex `/^\d{10}$/`
- กำหนดให้ `required: true` เฉพาะผู้ใช้ที่ไม่ได้ใช้ Google OAuth
- รองรับการ Login ทั้งแบบปกติและ Google OAuth

#### การ Hash รหัสผ่าน
```javascript
//Encrypt password using bcrypt
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});
```

**การปรับปรุง:**
- เพิ่มการตรวจสอบ `!this.password` เพื่อรองรับผู้ใช้ OAuth ที่ไม่มีรหัสผ่าน
- Hash เฉพาะเมื่อมีการเปลี่ยนแปลง password

---

### 1.2 Hotel Model (`backend/models/Hotel.js`)

**เปลี่ยนชื่อจาก:** `Hospital.js` → `Hotel.js`

#### โครงสร้าง Schema
```javascript
const mongoose = require('mongoose');

const HotelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        unique: true,
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters']
    },
    address: {
        type: String,
        required: [true, 'Please add an address']
    },
    tel: {
        type: String,
        required: [true, 'Please add a telephone number']
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
```

**การเปลี่ยนแปลง:**
- ลบฟิลด์ที่ไม่จำเป็นออก (district, province, postalcode, region)
- เหลือเพียง 3 ฟิลด์หลัก: `name`, `address`, `tel`
- เพิ่ม Virtual Population สำหรับดูการจองที่เกี่ยวข้อง

#### Virtual Relationship
```javascript
// Reverse populate with virtuals
HotelSchema.virtual('bookings', {
    ref: 'Booking',
    localField: '_id',
    foreignField: 'hotel',
    justOne: false
});

// Cascade delete bookings when a hotel is deleted
HotelSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    console.log(`Bookings being removed from hotel ${this._id}`);
    await this.model('Booking').deleteMany({ hotel: this._id });
    next();
});
```

**เหตุผล:** รองรับข้อกำหนดที่ 3 - สร้างความสัมพันธ์ระหว่างโรงแรมกับการจอง

---

### 1.3 Booking Model (`backend/models/Booking.js`)

**เปลี่ยนชื่อจาก:** `Appointment.js` → `Booking.js`

#### โครงสร้าง Schema
```javascript
const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    bookingDate: {
        type: Date,
        required: true
    },
    numOfNights: {
        type: Number,
        required: [true, 'Please specify number of nights'],
        min: [1, 'Number of nights must be at least 1'],
        max: [3, 'Number of nights cannot exceed 3']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    hotel: {
        type: mongoose.Schema.ObjectId,
        ref: 'Hotel',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Booking', BookingSchema);
```

**การเปลี่ยนแปลงสำคัญ:**
- เปลี่ยนจาก `apptDate` → `bookingDate`
- **เพิ่มฟิลด์ `numOfNights`** พร้อมการตั้งค่า:
  - `min: 1` (จองอย่างน้อย 1 คืน)
  - `max: 3` (จองได้สูงสุด 3 คืน) ✅ **ตรงตามข้อกำหนดที่ 3**
- เปลี่ยน Reference จาก `Hospital` → `Hotel`

---

## 2. Controllers (ตัวควบคุมการทำงาน)

### 2.1 Auth Controller (`backend/controllers/auth.js`)

#### ฟังก์ชัน `register`
**เพิ่มการรับค่า `tel`** เพื่อให้ตรงตามข้อกำหนดที่ 1

```javascript
exports.register = async (req, res, next) => {
  try {
    const { name, tel, email, password, role } = req.body; // เพิ่ม tel

    //Create user
    const user = await User.create({
      name,
      tel,    // เพิ่มการบันทึก tel
      email,
      password,
      role,
    });

    sendTokenResponse(user, 200, res);
  } catch (err) {
    res.status(400).json({
      success: false,
    });
    console.log(err.stack);
  }
};
```

**ผลลัพธ์:** ผู้ใช้สามารถลงทะเบียนด้วย name, tel, email, password ✅ **ตรงตามข้อกำหนดที่ 1**

---

#### ฟังก์ชัน `login`
**รองรับข้อกำหนดที่ 2**

```javascript
exports.login = async (req, res, next) => {
  try {
  const { email, password } = req.body;

  //Validate email & password
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, msg: "Please provide an email and password" });
  }

  //check for user
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return res.status(401).json({ success: false, msg: "Invalid credentials" });
  }

  //Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return res.status(401).json({ success: false, msg: "Invalid credentials" });
  }

  sendTokenResponse(user, 200, res);
  }catch (err) {
    res.status(401).json({
      success: false,
      msg: "Cannot convert email or password to string",
    });
  }
};
```

**ฟังก์ชันหลัก:**
- ตรวจสอบว่ามี email และ password
- ค้นหาผู้ใช้จาก email
- เปรียบเทียบรหัสผ่านด้วย `matchPassword()`
- ส่ง JWT Token กลับไปถ้า Login สำเร็จ

✅ **ตรงตามข้อกำหนดที่ 2 - ผู้ใช้สามารถ Login ด้วย email และ password**

---

#### ฟังก์ชัน `logout`
```javascript
exports.logout = async (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    success: true,
    data: {},
  });
};
```

✅ **ตรงตามข้อกำหนดที่ 2 - ผู้ใช้สามารถ Logout ได้**

---

### 2.2 Bookings Controller (`backend/controllers/bookings.js`)

#### ฟังก์ชัน `addBooking`
**ตัวควบคุมหลักสำหรับการจองโรงแรม** - ตรงตามข้อกำหนดที่ 3

```javascript
exports.addBooking = async (req, res, next) => {
    try {
        req.body.hotel = req.params.hotelId;
        
        const hotel = await Hotel.findById(req.params.hotelId);
        if (!hotel) {
            return res.status(404).json({ 
                success: false, 
                message: `No hotel with the id of ${req.params.hotelId}` 
            });
        }

        //add user Id to req.body
        req.body.user = req.user.id;

        //check for existing booking
        const existingBooking = await Booking.find({ user: req.user.id });
        if (existingBooking.length >= 3 && req.user.role !== 'admin') {
            return res.status(400).json({ 
                success: false, 
                message: `The user with ID ${req.user.id} already has 3 bookings` 
            });
        }
        
        const booking = await Booking.create(req.body);
        return res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        console.log(error.stack);
        return res.status(500).json({ 
            success: false, 
            message: 'Cannot create Booking' 
        });
    }
};
```

**ขั้นตอนการทำงาน:**
1. ตรวจสอบว่าโรงแรมที่จะจองมีอยู่จริง
2. เพิ่ม user ID จาก JWT Token
3. **ตรวจสอบว่าผู้ใช้มีการจองอยู่แล้วกี่ครั้ง**
4. **จำกัดไม่ให้เกิน 3 การจอง** (ยกเว้น admin)
5. สร้างการจองใหม่

✅ **ตรงตามข้อกำหนดที่ 3 - ผู้ใช้สามารถจองโรงแรมได้สูงสุด 3 ครั้ง**

**หมายเหตุ:** ฟังก์ชันอื่นๆ (`getBookings`, `getBooking`, `updateBooking`, `deleteBooking`) ยังคงอยู่ในไฟล์แต่ไม่ได้ถูกเรียกใช้งานใน routes (ตามที่ระบุว่าต้องการเฉพาะฟังก์ชันสร้างการจองเท่านั้น)

---

### 2.3 Hotels Controller (`backend/controllers/hotels.js`)

**เปลี่ยนชื่อจาก:** `hospitals.js` → `hotels.js`

**การเปลี่ยนแปลง:**
- เปลี่ยน `Hospital` → `Hotel` ในทุกส่วนของโค้ด
- เปลี่ยน `Appointment` → `Booking` ในทุกส่วนของโค้ด
- ฟังก์ชันยังคงครบถ้วน: `getHotels`, `getHotel`, `createHotel`, `updateHotel`, `deleteHotel`

**เหตุผล:** รองรับการแสดงรายการโรงแรมสำหรับผู้ใช้เลือกจอง (ข้อกำหนดที่ 3)

---

## 3. Routes (เส้นทาง API)

### 3.1 Auth Routes (`backend/routes/auth.js`)

```javascript
const express = require('express');
const passport = require('passport');
const { register, login, getMe, logout, googleAuthCallback} = require('../controllers/auth');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);  // ✅ ข้อ 1
router.post('/login', login);        // ✅ ข้อ 2
router.get('/me', protect, getMe);   
router.get('/logout', logout);       // ✅ ข้อ 2

// Google OAuth routes (เพิ่มเติม - ไม่ได้อยู่ใน Requirements 1-3)
router.get('/google', 
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        session: false 
    })
);

router.get('/google/callback', 
    passport.authenticate('google', { 
        failureRedirect: '/api/v1/auth/google/failure',
        session: false 
    }),
    googleAuthCallback
);

router.get('/google/failure', (req, res) => {
    res.status(401).json({
        success: false,
        msg: 'Google authentication failed'
    });
});

module.exports = router;
```

**API Endpoints:**
- `POST /api/v1/auth/register` - ลงทะเบียน (ข้อ 1)
- `POST /api/v1/auth/login` - เข้าสู่ระบบ (ข้อ 2)
- `GET /api/v1/auth/logout` - ออกจากระบบ (ข้อ 2)
- `GET /api/v1/auth/me` - ดูข้อมูลตัวเอง

---

### 3.2 Bookings Routes (`backend/routes/bookings.js`)

```javascript
const express = require('express');
const {getBookings, getBooking, addBooking, updateBooking, deleteBooking} = require('../controllers/bookings');

const router = express.Router({mergeParams: true});

const {protect,authorize} = require('../middleware/auth');

router.route('/').get(protect, getBookings).post(protect,authorize('admin','user'), addBooking);
router.route('/:id').get(protect, getBooking).put(protect,authorize('admin','user'), addBooking).delete(protect,authorize('admin','user'), deleteBooking);

module.exports = router;
```

**API Endpoint สำคัญสำหรับข้อกำหนดที่ 3:**
- `POST /api/v1/hotels/:hotelId/bookings` - สร้างการจองโรงแรม ✅
  - ต้อง Login ก่อน (`protect` middleware)
  - ต้องเป็น user หรือ admin (`authorize('admin','user')`)
  - ส่งข้อมูล `bookingDate` และ `numOfNights` (1-3 คืน)

**หมายเหตุ:** แม้ว่า routes จะยังมี GET, PUT, DELETE อยู่ แต่ตามข้อกำหนดที่ระบุไว้ว่าต้องการเฉพาะฟังก์ชันสร้างการจอง ดังนั้น endpoints อื่นๆ เหล่านี้สามารถถูกลบออกได้ถ้าต้องการให้ตรงตามข้อกำหนดอย่างเคร่งครัด

---

### 3.3 Hotels Routes (`backend/routes/hotels.js`)

**เปลี่ยนชื่อจาก:** `hospitals.js` → `hotels.js`

```javascript
const express = require('express');
const route = express.Router();
const { protect , authorize} = require('../middleware/auth');

const {getHotels, getHotel, createHotel, updateHotel, deleteHotel} = require('../controllers/hotels');

// Re-route into other resource routers
const bookingRouter = require('./bookings');
route.use('/:hotelId/bookings', bookingRouter);  // ✅ Nested Route สำหรับการจอง

route.route('/').get(getHotels).post(protect, authorize('admin'), createHotel);
// ... routes อื่นๆ
```

**การเชื่อมต่อที่สำคัญ:**
- `GET /api/v1/hotels` - ดูรายการโรงแรมทั้งหมด (เพื่อเลือกจอง)
- **Nested Route:** `/api/v1/hotels/:hotelId/bookings` 
  - เชื่อมต่อไปยัง `bookings` router ✅ **ตรงตามข้อกำหนดที่ 3**

---

## 4. สรุปการตรวจสอบความถูกต้อง

### ✅ ข้อกำหนดที่ 1: ระบบลงทะเบียนผู้ใช้
- [x] เพิ่มฟิลด์ `tel` ใน User Model พร้อม validation 10 หลัก
- [x] Controller `register` รับค่า `name, tel, email, password`
- [x] Route `POST /api/v1/auth/register` พร้อมใช้งาน
- [x] **ผลการตรวจสอบ: ✅ ผ่าน - ผู้ใช้สามารถลงทะเบียนด้วยข้อมูลครบถ้วนตามที่กำหนด**

### ✅ ข้อกำหนดที่ 2: ระบบ Login/Logout
- [x] Controller `login` ตรวจสอบ email และ password ด้วย JWT
- [x] Controller `logout` ลบ token cookie
- [x] Route `POST /api/v1/auth/login` และ `GET /api/v1/auth/logout` พร้อมใช้งาน
- [x] **ผลการตรวจสอบ: ✅ ผ่าน - ผู้ใช้สามารถเข้าสู่ระบบและออกจากระบบได้**

### ✅ ข้อกำหนดที่ 3: ระบบจองโรงแรม
- [x] สร้าง Hotel Model พร้อม fields `name, address, tel`
- [x] สร้าง Booking Model พร้อม fields:
  - `bookingDate` (Date)
  - **`numOfNights`** (Number, min: 1, max: 3) ✅
  - `user` (ObjectId ref User)
  - `hotel` (ObjectId ref Hotel)
- [x] Controller `addBooking` ตรวจสอบ:
  - โรงแรมที่จะจองต้องมีอยู่จริง ✅
  - **ผู้ใช้มีการจองไม่เกิน 3 ครั้ง** ✅
- [x] Route `POST /api/v1/hotels/:hotelId/bookings` พร้อมใช้งาน
- [x] **ผลการตรวจสอบ: ✅ ผ่าน - ผู้ใช้สามารถจองโรงแรมได้ตามเงื่อนไขที่กำหนด (1-3 คืน, สูงสุด 3 การจอง)**

---

## 5. ข้อมูลเพิ่มเติม

### การตรวจสอบด้วย Mongoose Validation
- **numOfNights:** Mongoose Schema จะตรวจสอบอัตโนมัติว่าค่าต้องอยู่ระหว่าง 1-3
- **tel:** ตรวจสอบด้วย regex ต้องเป็นตัวเลข 10 หลัก
- **3 bookings limit:** ตรวจสอบใน Controller ก่อนสร้างการจองใหม่

### Middleware ที่ใช้
- `protect`: ตรวจสอบ JWT Token (ต้อง Login)
- `authorize('user', 'admin')`: ตรวจสอบสิทธิ์ผู้ใช้

### Database Relations
```
User (1) -----> (Many) Booking
Hotel (1) -----> (Many) Booking
```

---

## 6. วิธีการทดสอบ API

### ทดสอบข้อ 1: ลงทะเบียน
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "tel": "0812345678",
  "email": "john@example.com",
  "password": "123456"
}
```

### ทดสอบข้อ 2: Login
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "123456"
}
```

**Response:** จะได้ `token` กลับมา

### ทดสอบข้อ 2: Logout
```bash
GET /api/v1/auth/logout
Authorization: Bearer {token}
```

### ทดสอบข้อ 3: จองโรงแรม
```bash
POST /api/v1/hotels/{hotelId}/bookings
Authorization: Bearer {token}
Content-Type: application/json

{
  "bookingDate": "2024-12-25",
  "numOfNights": 2
}
```

**ทดสอบ Validation:**
- ถ้าส่ง `numOfNights: 4` จะได้ Error (เกิน 3 คืน)
- ถ้าผู้ใช้มีการจองครบ 3 ครั้งแล้ว จะไม่สามารถจองเพิ่มได้

---

## สรุป

### การเปลี่ยนแปลงหลักๆ ที่ทำให้ได้ตามข้อกำหนด 1-3:

1. **เพิ่มฟิลด์ `tel`** ใน User Model (ข้อ 1)
2. **เพิ่ม Controller และ Routes** สำหรับ register, login, logout (ข้อ 1-2)
3. **เปลี่ยนชื่อ Model** จาก Hospital → Hotel และ Appointment → Booking (ข้อ 3)
4. **เพิ่มฟิลด์ `numOfNights`** พร้อม validation 1-3 คืน (ข้อ 3)
5. **เพิ่มการตรวจสอบ 3 bookings limit** ใน addBooking Controller (ข้อ 3)
6. **สร้าง Nested Route** `/hotels/:hotelId/bookings` สำหรับการจอง (ข้อ 3)

### ผลการตรวจสอบขั้นสุดท้าย:
- ✅ ข้อกำหนดที่ 1: **ผ่าน** - ลงทะเบียนด้วย name, tel, email, password
- ✅ ข้อกำหนดที่ 2: **ผ่าน** - Login/Logout ด้วย email และ password
- ✅ ข้อกำหนดที่ 3: **ผ่าน** - จองโรงแรมได้ 1-3 คืน สูงสุด 3 การจอง

**โค้ดที่เขียนไว้จริงๆ ตรงตามข้อกำหนดทั้ง 3 ข้อ ✅**
