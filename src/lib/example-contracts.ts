export const exampleBaseline = `openapi: 3.0.3
info:
  title: Acme Payments API
  version: 1.4.0
paths:
  /legacy:
    get:
      responses:
        "200":
          description: Legacy health response
  /payments:
    post:
      requestBody:
        required: false
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/PaymentRequest"
      responses:
        "201":
          description: Payment created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/PaymentCreated"
  /payments/{id}:
    get:
      responses:
        "200":
          description: Payment found
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Payment"
        "404":
          description: Payment not found
components:
  schemas:
    PaymentRequest:
      type: object
      required: [amount, currency]
      properties:
        amount: { type: number }
        currency:
          type: string
          enum: [CAD, USD]
        note: { type: string }
    PaymentCreated:
      type: object
      required: [id]
      properties:
        id: { type: string }
    Payment:
      type: object
      required: [id, status, amount]
      properties:
        id: { type: string }
        status:
          type: string
          enum: [pending, settled, failed]
        amount: { type: number }
`;

export const exampleCandidate = `openapi: 3.1.0
info:
  title: Acme Payments API
  version: 2.0.0
paths:
  /payments:
    post:
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/PaymentRequest"
      responses:
        "201":
          description: Payment created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/PaymentCreated"
        "202":
          description: Payment accepted for asynchronous processing
  /payments/{id}:
    get:
      responses:
        "200":
          description: Payment found
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Payment"
  /refunds:
    post:
      responses:
        "202":
          description: Refund accepted
components:
  schemas:
    PaymentRequest:
      type: object
      required: [amount, currency, idempotencyKey]
      properties:
        amount: { type: string }
        currency:
          type: string
          enum: [USD]
        idempotencyKey: { type: string }
        metadata: { type: object }
    PaymentCreated:
      type: object
      required: [id]
      properties:
        id: { type: string }
    Payment:
      type: object
      required: [id, status]
      properties:
        id: { type: string }
        status:
          type: string
          enum: [pending, settled, reversed]
        total: { type: number }
`;
