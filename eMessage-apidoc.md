# eMessage API Documentation

## Overview
Deliver SMS, email, and in-app notices to citizens through a single messaging API.

## Endpoints

### Push SMS
Sends an SMS message to a recipient number.

#### Request Headers
| Header | Description |
| :--- | :--- |
| `Authorization` | eMessage API auth token |

#### Request Body
- **Content-Type**: `RAW` (or `application/json` depending on implementation)

#### Example Request
```http
POST /push-sms
Headers:
  Authorization: <your-auth-token>

Body:
{
  "recipient": "+1234567890",
  "message": "Your notification message here"
}