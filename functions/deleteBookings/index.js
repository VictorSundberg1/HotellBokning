const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const db = DynamoDBDocumentClient.from(client);

exports.handler = async (event, context) => {
	const { bookingNr } = event.pathParameters;

	try {
		const getBookingCommand = new GetCommand({
			TableName: 'booking-table',
			Key: { id: bookingNr },
		});

		const result = await db.send(getBookingCommand);

		if (!result.Item) {
			return {
				statusCode: 404,
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					success: false,
					message: 'Booking not found',
				}),
			};
		}
		// Plockar ut listan av bookedRooms ur booking eller defaultar till tom lista
		const bookedRooms = result.Item.bookedRooms || [];

		if (bookedRooms.length === 0) {
			return {
				statusCode: 404,
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					success: false,
					message: 'Rooms not found',
				}),
			};
		}

		const checkInDate = new Date(result.Item.checkInDate);
		const todaysDate = new Date();

		const lastAllowedDate = new Date(todaysDate);
		lastAllowedDate.setDate(todaysDate.getDate() + 1);

		if (checkInDate <= lastAllowedDate) {
			return {
				statusCode: 400,
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					success: false,
					message:
						'Bookings needs to be refunded atleast 2 days before check-in',
				}),
			};
		}

		const deleteCommand = new DeleteCommand({
			TableName: 'booking-table',
			Key: { id: bookingNr },
		});

		await db.send(deleteCommand);

		// Loopar igenom och Uppdaterar alla roomIds som plockats ut och sätter available till true
		const updatePromises = bookedRooms.map((roomId) => {
			const updateRoomCommand = new UpdateCommand({
				TableName: 'rooms-table',
				Key: { id: roomId },
				UpdateExpression: 'SET isAvailable = :available',
				ExpressionAttributeValues: {
					':available': true,
				},
			});
			return db.send(updateRoomCommand);
		});
		//Väntar på att alla uppdateringar är klara
		await Promise.all(updatePromises);

		return {
			statusCode: 200,
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				success: true,
				message: 'Booking deleted and availability updated',
			}),
		};
	} catch (error) {
		console.error('Error:', error);
		return {
			statusCode: 500,
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				success: false,
				error: error.message,
			}),
		};
	}
};
