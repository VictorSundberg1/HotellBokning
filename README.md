deleteBooking: https://oyk1movzhb.execute-api.eu-north-1.amazonaws.com/deleteBookings/{id}

getBookings: https://oyk1movzhb.execute-api.eu-north-1.amazonaws.com/bookings

getRooms: https://oyk1movzhb.execute-api.eu-north-1.amazonaws.com/rooms

getBookingBy year/month: https://oyk1movzhb.execute-api.eu-north-1.amazonaws.com/bookings/2025/11

postBooking: https://oyk1movzhb.execute-api.eu-north-1.amazonaws.com/booking

postCheckout: https://oyk1movzhb.execute-api.eu-north-1.amazonaws.com/checkOut

# API Endpoints
**Base URL:** `https://api.din-domain.com`

# API Documentation

------------------------------------------------------------------------

## Bookings

### **GET /bookings**

Hämta alla bokningar.

**Response**

``` json
[
  {
    "totalPrice": 6000,
    "checkOutDate": "2024-11-17",
    "guestCount": 6,
    "epost": "test@test.com",
    "id": "c6ac647b-90f1-42a4-bc7d-07bc4e43f52e",
    "name": "Test Person",
    "checkInDate": "2024-11-15",
    "bookedRooms": ["20", "19"]
  }
]
```

------------------------------------------------------------------------

### **POST /booking**

Skapa en ny bokning.

**Request**

``` json
{
  "name": "Ann Person",
  "epost": "Ann@test.com",
  "guestCount": 1,
  "bookedRooms": ["3"],
  "checkInDate": "2025-11-30",
  "checkOutDate": "2025-12-07"
}
```

**Response**

``` json
{
  "message": "Bokning skapad!",
  "booking": {
    "id": "38a7ac3a-5b31-45f2-8480-f6b6d4ea5feb",
    "name": "Ann Person",
    "epost": "Ann@test.com",
    "guestCount": 1,
    "bookedRooms": ["3"],
    "checkInDate": "2025-11-30",
    "checkOutDate": "2025-12-07",
    "totalPrice": 3500
  }
}
```

------------------------------------------------------------------------

### **DELETE /deleteBookings/{id}**

Ta bort en bokning.

**Response**

``` json
{
  "success": true,
  "message": "Booking deleted and availability updated"
}
```

------------------------------------------------------------------------

### **GET /bookings/{year}/{month}**

Filtrera bokningar efter månad.

**Response**

``` json
{
  "success": true,
  "year": "2025",
  "month": "12",
  "count": 1,
  "bookings": [
    {
      "totalPrice": 2500,
      "checkOutDate": "2025-12-05",
      "guestCount": 1,
      "epost": "sara@test.com",
      "id": "4cd52faf-d5e7-4e8b-bdfd-516063ff5d3d",
      "name": "sara Person",
      "checkInDate": "2025-11-30",
      "bookedRooms": ["2"]
    }
  ]
}
```

------------------------------------------------------------------------

## Rooms

### **GET /rooms**

Hämta alla rum.

**Response**

``` json
[
  {
    "capacity": 1,
    "id": "1",
    "price": 500,
    "isAvailable": false,
    "type": "single"
  },
  {
    "capacity": 2,
    "id": "16",
    "price": 1000,
    "isAvailable": true,
    "type": "double"
  },
  {
    "capacity": 3,
    "id": "20",
    "price": 1500,
    "isAvailable": true,
    "type": "suite"
  }
]
```
