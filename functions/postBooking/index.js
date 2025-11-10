
const { sendResponse } = require('../../responses');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { PutCommand, ScanCommand, GetCommand, DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

// Room configurations
const ROOM_CONFIGS = {
    'Enkel': { capacity: 1, price: 500 },
    'Dubbel': { capacity: 2, price: 1000 },
    'Svit': { capacity: 3, price: 1500 }
};

exports.handler = async (event, context) => {
    try {
        const bookingData = JSON.parse(event.body);
        
        // 1. Validate input
        const validation = validateBookingInput(bookingData);
        if (!validation.isValid) {
            return sendResponse(400, { success: false, message: validation.error });
        }

        const { namn, epost, antalGaster, bokadeRum, datumIn, datumUt } = bookingData;

        // 2. Get all rooms to validate room types and availability
        const allRooms = await getAllRooms();
        
        // 3. Validate room numbers exist
        const invalidRooms = bokadeRum.filter(roomId => !allRooms.find(room => room.id === roomId));
        if (invalidRooms.length > 0) {
            return sendResponse(400, { 
                success: false, 
                message: `Följande rum existerar inte: ${invalidRooms.join(', ')}` 
            });
        }

        // 4. Get selected rooms details
        const selectedRooms = bokadeRum.map(roomId => allRooms.find(room => room.id === roomId));
        
        // 5. Validate room capacity matches guest count
        const capacityValidation = validateRoomCapacity(selectedRooms, antalGaster);
        if (!capacityValidation.isValid) {
            return sendResponse(400, { success: false, message: capacityValidation.error });
        }

        // 6. Check room availability for the dates
        const availabilityCheck = await checkRoomAvailability(bokadeRum, datumIn, datumUt);
        if (!availabilityCheck.isAvailable) {
            return sendResponse(400, { 
                success: false, 
                message: `Följande rum är inte tillgängliga för valda datum: ${availabilityCheck.unavailableRooms.join(', ')}` 
            });
        }

        // 7. Calculate total cost
        const totalCost = calculateTotalCost(selectedRooms, datumIn, datumUt);

        // 8. Generate booking number (1-20)
        const bookingNr = await generateBookingNumber();
        if (!bookingNr) {
            return sendResponse(400, { 
                success: false, 
                message: 'Alla bokningsnummer (1-20) är upptagna. Försök igen senare.' 
            });
        }

        // 9. Create booking object
        const booking = {
            id: bookingNr.toString(),
            bookingNr,
            namn,
            epost,
            antalGaster,
            bokadeRum,
            datumIn,
            datumUt,
            totalKostnad: totalCost,
            skapad: new Date().toISOString()
        };

        // 10. Save booking to database
        const putCommand = new PutCommand({
            TableName: 'booking-table',
            Item: booking
        });

        await db.send(putCommand);

        // 11. Return confirmation
        return sendResponse(200, {
            success: true,
            bokning: {
                bokningsnummer: bookingNr,
                antalGaster,
                antalRum: bokadeRum.length,
                totalSumma: `${totalCost} kr`,
                datumIn,
                datumUt,
                namn
            }
        });

    } catch (error) {
        console.error('Error creating booking:', error);
        return sendResponse(500, { 
            success: false, 
            message: 'Ett fel uppstod vid skapande av bokning' 
        });
    }
};

// Validation functions
function validateBookingInput(data) {
    if (!data.namn || typeof data.namn !== 'string' || data.namn.trim().length === 0) {
        return { isValid: false, error: 'Namn är obligatoriskt' };
    }

    if (!data.epost || !isValidEmail(data.epost)) {
        return { isValid: false, error: 'Giltig e-postadress krävs' };
    }

    if (!data.antalGaster || !Number.isInteger(data.antalGaster) || data.antalGaster < 1) {
        return { isValid: false, error: 'Antal gäster måste vara ett positivt heltal' };
    }

    if (!data.bokadeRum || !Array.isArray(data.bokadeRum) || data.bokadeRum.length === 0) {
        return { isValid: false, error: 'Minst ett rum måste bokas' };
    }

    if (!data.datumIn || !data.datumUt) {
        return { isValid: false, error: 'In- och utcheckningsdatum krävs' };
    }

    const checkIn = new Date(data.datumIn);
    const checkOut = new Date(data.datumUt);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
        return { isValid: false, error: 'Ogiltigt datumformat' };
    }

    if (checkIn < today) {
        return { isValid: false, error: 'Incheckning kan inte vara i det förflutna' };
    }

    if (checkOut <= checkIn) {
        return { isValid: false, error: 'Utcheckningsdatum måste vara efter incheckningsdatum' };
    }

    return { isValid: true };
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateRoomCapacity(rooms, guestCount) {
    const totalCapacity = rooms.reduce((sum, room) => {
        const config = ROOM_CONFIGS[room.type];
        return sum + (config ? config.capacity : 0);
    }, 0);

    if (totalCapacity < guestCount) {
        return { 
            isValid: false, 
            error: `Valda rum har endast plats för ${totalCapacity} gäster, men ${guestCount} gäster angavs` 
        };
    }

    return { isValid: true };
}

async function getAllRooms() {
    const command = new ScanCommand({
        TableName: 'rooms-table'
    });
    
    const { Items } = await db.send(command);
    return Items || [];
}

async function generateBookingNumber() {
    // Get all existing bookings
    const command = new ScanCommand({
        TableName: 'booking-table'
    });
    
    const { Items: bookings } = await db.send(command);
    
    // Get all used booking numbers
    const usedNumbers = bookings.map(booking => parseInt(booking.bookingNr)).filter(num => !isNaN(num));
    
    // Find first available number between 1-20
    for (let i = 1; i <= 20; i++) {
        if (!usedNumbers.includes(i)) {
            return i;
        }
    }
    
    return null; // All numbers 1-20 are taken
}

async function checkRoomAvailability(roomIds, checkIn, checkOut) {
    // Get all existing bookings
    const command = new ScanCommand({
        TableName: 'booking-table'
    });
    
    const { Items: bookings } = await db.send(command);
    
    const unavailableRooms = [];
    
    for (const roomId of roomIds) {
        // Check if this room is booked during the requested period
        const isRoomBooked = bookings.some(booking => {
            if (!booking.bokadeRum || !booking.bokadeRum.includes(roomId)) {
                return false;
            }
            
            const bookingStart = new Date(booking.datumIn);
            const bookingEnd = new Date(booking.datumUt);
            const requestStart = new Date(checkIn);
            const requestEnd = new Date(checkOut);
            
            // Check for date overlap
            return requestStart < bookingEnd && requestEnd > bookingStart;
        });
        
        if (isRoomBooked) {
            unavailableRooms.push(roomId);
        }
    }
    
    return {
        isAvailable: unavailableRooms.length === 0,
        unavailableRooms
    };
}

function calculateTotalCost(rooms, checkIn, checkOut) {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    const totalPerNight = rooms.reduce((sum, room) => {
        const config = ROOM_CONFIGS[room.type];
        return sum + (config ? config.price : 0);
    }, 0);
    
    return totalPerNight * nights;
}