# eGov API Documentation

This document contains the compiled API documentation for the eGov developer portal, including endpoints for document intelligence, translation, conversational AI, and messaging.

---

## 1. Generate Access Token
Generates a short-lived access token for authenticating with the eGov API Docs. The token is automatically saved to the `access_token` environment variable upon a successful response.

* **Method:** `POST`
* **URL:** `{{base}}/api/v1/egov/integration/token`
* **Content-Type:** `application/json`

### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `access_code` | string | Yes | The unique access code issued to your team for the hackathon. |

**Example Request:**
```json
{
  "access_code": "{{access_code}}"
}
```

**Example Response (200 OK):**
```json
{
  "access_token": "bebaddec-de7e-4d4e-91b1-ae3a73544b22",
  "expires_in_seconds": 28800,
  "credits_total": 200,
  "credits_remaining": 200
}
```

---

## 2. AI Assistant
Generates an AI-powered response to a user's query about eGov services. This endpoint accepts a natural language prompt and a category/country code, then returns a contextually relevant answer scoped to the specified eGov service region.

* **Method:** `POST`
* **URL:** `{{base}}/api/v1/egov/integration/ai_assistant/generate`
* **Authorization:** Bearer Token (`{{hackathon_token}}`)
* **Content-Type:** `application/json`

### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `prompt` | string | Yes | The user's natural language question (e.g., "how can i get my digital tin id here in egov"). |
| `category` | string | Yes | The category or country code (e.g., "PH" for Philippines). |

**Example Request:**
```json
{
    "prompt": "how can i get my digital tin id here in egov",
    "category": "PH"
}
```

**Example Response (200 OK):**
```json
{
  "data": "To obtain your digital Taxpayer Identification Number (TIN) ID through the eGovPH app...",
  "session_id": "b67017a4-da57-40ab-96c9-ca0ccb530ec7"
}
```

---

## 3. Tourism Content Generator
Generates AI-powered tourism and travel content based on a user-provided prompt and a destination category. Returns a detailed, narrative-style response and a session ID for tracking.

* **Method:** `POST`
* **URL:** `{{base}}/api/v1/egov/integration/tourism/generate`
* **Authorization:** Bearer Token (`{{hackathon_token}}`)
* **Content-Type:** `application/json`

### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `prompt` | string | Yes | A natural language instruction describing the tourism content to generate. |
| `category` | string | Yes | A country or region code to scope the response to a specific destination. |

**Example Request:**
```json
{
    "prompt": "Provide travel itinerary for Boracay",
    "category": "PH"
}
```

**Example Response (200 OK):**
```json
{
    "data": "Boracay Island, located in Aklan province in Western Visayas, is renowned globally...",
    "session_id": "525d4e90-245c-4415-91a3-9cc1f1dd4497"
}
```

---

## 4. Laws & Regulations
Generates an AI-powered response related to laws and regulations based on a given prompt and category. Tailored to government regulations.

* **Method:** `POST`
* **URL:** `{{base}}/api/v1/egov/integration/laws_and_regulations/generate`
* **Authorization:** Bearer Token (`{{hackathon_token}}`)
* **Content-Type:** `application/json`

### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `prompt` | string | Yes | A natural language question or instruction related to laws and regulations. |
| `category` | string | Yes | The jurisdiction or category code for the laws to query (e.g., `PH`). |

**Example Request:**
```json
{
  "prompt": "Can you explain your purpose?",
  "category": "PH"
}
```

**Example Response (200 OK):**
```json
{
  "data": "Ako ay isang eGovPH AI Assistant na nilikha upang tulungan ang mga mamamayang Pilipino...",
  "session_id": "6220bc87-0ba9-4fd9-9fda-d5c44b31a061"
}
```

---

## 5. Translator
Translates a given text prompt from one language to another using the eGov Hackathon translation service.

* **Method:** `POST`
* **URL:** `{{base}}/api/v1/egov/integration/translator/generate`
* **Authorization:** Bearer Token (`{{hackathon_token}}`)
* **Content-Type:** `application/json`

### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `prompt` | string | Yes | The text content to be translated. |
| `source_lang` | string | Yes | The ISO 639-1 language code of the input text (e.g., "en"). |
| `target_lang` | string | Yes | The ISO 639-1 language code of the desired output (e.g., "fil"). |

**Example Request:**
```json
{
  "prompt": "How should the education system adapt to prepare future generations to thrive in a world when human AI collaboration is a norm?",
  "source_lang": "en",
  "target_lang": "fil"
}
```

**Example Response (200 OK):**
```json
{
  "original_prompt": "How should the education system adapt...",
  "source_lang": "en",
  "target_lang": "fil",
  "translate_from": {
    "code": "en",
    "label": "English"
  },
  "translated_prompt": "Paano dapat umangkop ang sistema ng edukasyon upang ihanda ang mga susunod na henerasyon..."
}
```

---

## 6. Document Extractor
Extracts structured information from an uploaded document image or file using AI-powered OCR and document analysis.

* **Method:** `POST`
* **URL:** `{{base}}/api/v1/egov/integration/document_extractor/generate`
* **Authorization:** Bearer Token (`{{hackathon_token}}`)
* **Content-Type:** `multipart/form-data`

### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `file` | File | Yes | The document file to be processed (JPEG, PNG, PDF, etc.). |

**Example Response (200 OK):**
```json
{
  "data": "Here's the information extracted from the image:\n\nDocument Type: Philippine Driver's License..."
}
```

---

## 7. Token Credits
Retrieves the current token credit balance associated with the authenticated hackathon participant or team.

* **Method:** `GET`
* **URL:** `{{base}}/api/v1/egov/integration/credits`
* **Authorization:** Bearer Token (`{{hackathon_token}}`)

**Example Response (200 OK):**
```json
{
  "credits_total": 200,
  "credits_used": 5,
  "credits_remaining": 195,
  "expires_at": "2026-07-10T23:33:34.000+08:00"
}
```

---

## 8. Push SMS
Sends an SMS message to a recipient number.

* **Method:** `POST`
* **URL:** `{{base_url}}/messaging/v1/sms/push`
* **Authorization:** `X-EMESSAGE-Auth: {{api_token}}`
* **Content-Type:** `application/json`

### Request Body
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `number` | string | Yes | Recipient mobile number in E.164 format (e.g., `+639090000000`). |
| `message`| string | Yes | The SMS message body. |

**Example Request:**
```json
{
  "number": "+639090000000",
  "message": "Test message"
}
```

**Example Response (201 Created):**
```json
{
  "data": {
    "message": "SMS was successfully created."
  }
}
```
