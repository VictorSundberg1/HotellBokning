const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: "eu-north-1" });
const dynamodb = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
    try {
        // Path parameter: /bookings/{year}/{month}
        const { year, month } = event.pathParameters;
        
        if (!year || !month) {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    success: false,
                    error: "Year and month required in path. Use format: /bookings/month/2024/11" 
                })
            };
        }
        
        // Validera månad
        const monthNum = parseInt(month);
        if (monthNum < 1 || monthNum > 12) {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    success: false,
                    error: "Month must be between 1 and 12" 
                })
            };
        }
        
        const yearMonth = `${year}-${month.padStart(2, '0')}`;
        
        const command = new ScanCommand({
            TableName: "booking-table",
            FilterExpression: 
                "begins_with(checkInDate, :yearMonth) OR begins_with(checkOutDate, :yearMonth)",
            ExpressionAttributeValues: {
                ":yearMonth": yearMonth
            }
        });
        
        const result = await dynamodb.send(command);
        
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                success: true,
                year: year,
                month: month,
                count: result.Items.length,
                bookings: result.Items
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                success: false,
                error: error.message 
            })
        };
    }
};