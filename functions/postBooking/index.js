const { sendResponse } = require('../../responses');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { PutCommand, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

// const roomType = {
//   enkel: { count: 10, price: 500 },
//   dubbel: { count: 8, price: 1000 },
//   svit: { count: 2, price: 1500 }
// };

// const allRooms = [
//   ...Array.from({ length: roomType.enkel.count }, (_, i) => `${i + 1}`),
//   ...Array.from({ length: roomType.dubbel.count }, (_, i) => `${i + 1}`),
//   ...Array.from({ length: roomType.svit.count }, (_, i) => `${i + 1}`)
// ];


exports.handler = async (event) => {
  try {
    const { name, epost, guestCount, bookedRooms, checkInDate, checkOutDate } = JSON.parse(event.body);
    const getRoomsTable = new ScanCommand({ TableName: 'rooms-table' });

    const roomsResult = await db.send(getRoomsTable);
    const allRooms = roomsResult.Items.map(room => room.id);
    console.log(allRooms);

    if (!name || !epost || !bookedRooms || !checkInDate || !checkOutDate) {
      return sendResponse(400, { message: 'Saknas obligatoriska fält.' });
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkOut <= checkIn) {
      return sendResponse(400, { message: 'Utcheckning måste vara efter incheckning.' });
    }

    for (const room of bookedRooms) {
      if (!allRooms.includes(room)) {
        return sendResponse(400, { message: `Rummet ${room} finns inte.` });
      }
    }

    const existing = await db.send(new ScanCommand({ TableName: 'booking-table' }));

    for (const booking of existing.Items) {
      for (const room of bookedRooms) {
        if (booking.bookedRooms && booking.bookedRooms.includes(room)) {
          const existingIn = new Date(booking.checkInDate);
          const existingOut = new Date(booking.checkOutDate);
          const overlap = checkIn < existingOut && checkOut > existingIn;

          if (overlap) {
            return sendResponse(400, {
              message: `Rum ${room} är redan bokat mellan ${booking.checkInDate} och ${booking.checkOutDate}.`
            });
          }
        }
      }
    }

    const numNights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    let totalPrice = 0;

    for (const roomId of bookedRooms) {
      const numericRoomId = roomId.replace(/\D+/g, '');
      const room = roomsResult.Items.find(r => r.id === numericRoomId);
      if (room) {
        totalPrice += room.price * numNights;
      }
    }


    const booking = {
      id: uuidv4(),
      name,
      epost,
      guestCount,
      bookedRooms,
      checkInDate,
      checkOutDate,
      totalPrice
    };

    await db.send(new PutCommand({
      TableName: 'booking-table',
      Item: booking
    }));

    // Uppdatera rummen till unavailable
    const updatePromises = bookedRooms.map((roomId) => {
      // Konvertera enkel1, dubbel2, svit3 till bara siffrorna 1, 2, 3
      const numericRoomId = roomId.replace(/\D+/g, '');
      
      const updateRoomCommand = new UpdateCommand({
        TableName: 'rooms-table',
        Key: { id: numericRoomId },
        UpdateExpression: 'SET isAvailable = :available',
        ExpressionAttributeValues: {
          ':available': false,
        },
      });
      return db.send(updateRoomCommand);
    });
    
    await Promise.all(updatePromises);

    return sendResponse(201, {
      message: 'Bokning skapad!',
      booking
    });

  } catch (error) {
    console.error('Fel vid bokning:', error);
    return sendResponse(500, { message: 'Internt serverfel', error: error.message });
  }
};