const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
    PutCommand,
    ScanCommand,
    UpdateCommand,
} = require('@aws-sdk/lib-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');


const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

exports.handler = async(event) => {
    try{
    //checka ut med  bokningsnummer 
    const {bookingNr} = JSON.parse(event.body)
    
    //utchecknigsdatum blir dagens datum
    const today = new Date();
    const checkOutDate = today.toISOString().split('T')[0];
    
    

    if(!bookingNr ){
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    success: false,
                    error: "bokingsnummer måste anges för att checka ut" 
                })
            };
        }
/*Sök efter bokningen */
        const command = new ScanCommand({
            TableName: "booking-table",
            FilterExpression:
            "id = :inputBookingNr",
            ExpressionAttributeValues: {
                ":inputBookingNr": bookingNr
            }
        });

        const result = await db.send(command)

        if(!result.Items || result.Items.length === 0){
        
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Hittar inte bokningen" })
    };
}

const booking = result.Items[0];




/** Sätt rummet /rummen till tillgängliga */
try {
const updateRoomPromises = booking.bookedRooms.map((roomId) => {

    const setStatusCommand = new UpdateCommand({
        TableName: 'rooms-table',
				Key: { id: roomId },
				UpdateExpression: 'SET isAvailable = :available',
				ExpressionAttributeValues: {
					':available': true,
				},
    });

    return db.send(setStatusCommand)

});
await Promise.all(updateRoomPromises)

}catch (error) {
    console.error("Kunde inte uppdatera rum:", error);
    throw error; 
}
/** Retunera info om bokningen antal dagar, pris mm. */
        
        const numberOfDays = Math.floor((today - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24));

        return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: booking.name,
            epost: booking.epost,
            Ankomst_Datum: booking.checkInDate,
            Utcheckad_Datum: checkOutDate,
            Antal_personer: booking.guestCount,
            Antal_dagar: numberOfDays,
            Antal_Bokade_rum: booking.bookedRooms.length,
           
           
            
            
        })
    };

    } catch(error){
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                success: false,
                error: error.message 
            })
        };

    }

    }

