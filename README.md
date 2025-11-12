<!--
title: 'AWS Simple HTTP Endpoint example in NodeJS'
description: 'This template demonstrates how to make a simple HTTP API with Node.js running on AWS Lambda and API Gateway using the Serverless Framework.'
layout: Doc
framework: v4
platform: AWS
language: nodeJS
authorLink: 'https://github.com/serverless'
authorName: 'Serverless, Inc.'
authorAvatar: 'https://avatars1.githubusercontent.com/u/13742415?s=200&v=4'
-->

# Serverless Framework Node HTTP API on AWS

This template demonstrates how to make a simple HTTP API with Node.js running on AWS Lambda and API Gateway using the Serverless Framework.

This template does not include any kind of persistence (database). For more advanced examples, check out the [serverless/examples repository](https://github.com/serverless/examples/) which includes Typescript, Mongo, DynamoDB and other examples.

## Usage

### Deployment

In order to deploy the example, you need to run the following command:

```
serverless deploy
```

After running deploy, you should see output similar to:

```
Deploying "serverless-http-api" to stage "dev" (us-east-1)

✔ Service deployed to stack serverless-http-api-dev (91s)

endpoint: GET - https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/
functions:
  hello: serverless-http-api-dev-hello (1.6 kB)
```

_Note_: In current form, after deployment, your API is public and can be invoked by anyone. For production deployments, you might want to configure an authorizer. For details on how to do that, refer to [HTTP API (API Gateway V2) event docs](https://www.serverless.com/framework/docs/providers/aws/events/http-api).

### Invocation

After successful deployment, you can call the created application via HTTP:

```
curl https://xxxxxxx.execute-api.us-east-1.amazonaws.com/
```

Which should result in response similar to:

```json
{ "message": "Go Serverless v4! Your function executed successfully!" }
```

### Local development

The easiest way to develop and test your function is to use the `dev` command:

```
serverless dev
```

This will start a local emulator of AWS Lambda and tunnel your requests to and from AWS Lambda, allowing you to interact with your function as if it were running in the cloud.

Now you can invoke the function as before, but this time the function will be executed locally. Now you can develop your function locally, invoke it, and see the results immediately without having to re-deploy.

When you are done developing, don't forget to run `serverless deploy` to deploy the function to the cloud.

room:
id: 1
type: Enkel
capacity: 1
price: 500kr
available: True

GET rooms
GET bookings

DELETE
Sätter room.availability till true

POST booking
bookingNr: uuid
namn:
epost:
antal gäster: 3
bokade rum: {"1", "2"}
Datum in: 2025-11-10
Datum ut: 2025-11-14




# API Endpoints
**Base URL:** `https://api.din-domain.com`

## Bookings
- `GET /bookings` - Get all bookings
**Response** 
[
  {
		"totalPrice": 6000,
		"checkOutDate": "2024-11-17",
		"guestCount": 6,
		"epost": "test@test.com",
		"id": "c6ac647b-90f1-42a4-bc7d-07bc4e43f52e",
		"name": "Test Person",
		"checkInDate": "2024-11-15",
		"bookedRooms": [
			"20",
			"19"
		]
	}
]

- `POST /booking` - Create a new booking
**Request**
{
  "name": "Ann Person",
  "epost": "Ann@test.com", 
  "guestCount": 1,
  "bookedRooms": ["3"],
  "checkInDate": "2025-11-30",
  "checkOutDate": "2025-12-07"
}
**Response**
{
	"message": "Bokning skapad!",
	"booking": {
		"id": "38a7ac3a-5b31-45f2-8480-f6b6d4ea5feb",
		"name": "Ann Person",
		"epost": "Ann@test.com",
		"guestCount": 1,
		"bookedRooms": [
			"3"
		],
		"checkInDate": "2025-11-30",
		"checkOutDate": "2025-12-07",
		"totalPrice": 3500
	}
}

- `DELETE /deleteBookings/{id}` - Delete a booking
**Response**
{
	"success": true,
	"message": "Booking deleted and availability updated"
}

- `GET /bookings/{year}/{month}` - Filter bookings by month
**Response**
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
			"bookedRooms": [
				"2"
			]
		}
  ]
}

## Rooms
- `GET /rooms` - Get all rooms
**Response**
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

