# Postman API Exercises — Grida Platform

> A collection of ready-to-run API requests for exploring how the Grida platform works.
> Copy the JSON bodies into Postman, adjust IDs where noted, and hit Send.

## Prerequisites

- Postman workspace "Grida" with environment "Grida — dev" active
- Variables set: `supabase_url`, `supabase_anon_key`, `access_token`

**IMPORTANT: Before every session, run the "Sign In (Operator)" request first.** Tokens expire after 1 hour. If you get `401 Unauthorized` with `"JWT expired"` — just sign in again. The post-response script automatically saves a fresh token to `{{access_token}}`.

## Common Headers

All REST API requests need these headers:

| Header | Value |
|--------|-------|
| `apikey` | `{{supabase_anon_key}}` |
| `Authorization` | `Bearer {{access_token}}` |

For POST/PATCH requests, also add:

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `Prefer` | `return=representation` |

---

## Exercise 1 — Full Shipment Lifecycle

This exercise walks through the complete lifecycle of a shipment: create it, add orders, place boxes on walls, mark orders as done, and close the shipment.

### 1.1 Create a new shipment

```
POST {{supabase_url}}/rest/v1/shipments
```
```json
{
  "name": "Munich Express — April 9",
  "trailer_walls": 30,
  "boxes_per_wall": 24,
  "status": "active"
}
```

> Save the returned `id` — you'll need it for the next requests.
> Notice: `created_by` is auto-filled with your email, `created_at` and `updated_at` are auto-generated.

### 1.2 Add orders to the shipment

Replace `SHIPMENT_ID` with the ID from step 1.1.

**Order 1 — normal priority, large order:**
```
POST {{supabase_url}}/rest/v1/orders
```
```json
{
  "order_number": "MUN-001",
  "client_name": "Hofbräuhaus München",
  "box_count": 24,
  "item_count": 480,
  "shipment_id": "SHIPMENT_ID",
  "priority": "normal",
  "description": "Weekly beer garden supply"
}
```

**Order 2 — urgent priority:**
```
POST {{supabase_url}}/rest/v1/orders
```
```json
{
  "order_number": "MUN-002",
  "client_name": "Viktualienmarkt Deli",
  "box_count": 8,
  "item_count": 160,
  "shipment_id": "SHIPMENT_ID",
  "priority": "urgent",
  "description": "Perishable — deliver before noon"
}
```

**Order 3 — with pickup time:**
```
POST {{supabase_url}}/rest/v1/orders
```
```json
{
  "order_number": "MUN-003",
  "client_name": "Marienplatz Blumen",
  "box_count": 5,
  "item_count": 200,
  "shipment_id": "SHIPMENT_ID",
  "priority": "normal",
  "pickup_time": "2026-04-09T08:00:00+00:00"
}
```

> Try listing all orders for this shipment:
> `GET {{supabase_url}}/rest/v1/orders?shipment_id=eq.SHIPMENT_ID&select=*&order=pickup_time.asc.nullslast`
> Notice: orders are sorted by pickup time with nulls at the end — same as the app UI.

### 1.3 Place boxes on walls

This is what happens when a warehouse worker assigns boxes from an order to a specific wall in the trailer.

Replace `ORDER_1_ID` and `ORDER_2_ID` with IDs from step 1.2.

**Place Order 1 across two walls (large order, 24 boxes split):**
```
POST {{supabase_url}}/rest/v1/placements
```
```json
{
  "order_id": "ORDER_1_ID",
  "shipment_id": "SHIPMENT_ID",
  "wall_number": 1,
  "box_count": 14
}
```

```
POST {{supabase_url}}/rest/v1/placements
```
```json
{
  "order_id": "ORDER_1_ID",
  "shipment_id": "SHIPMENT_ID",
  "wall_number": 2,
  "box_count": 10
}
```

**Place Order 2 on wall 3 (urgent, all at once):**
```
POST {{supabase_url}}/rest/v1/placements
```
```json
{
  "order_id": "ORDER_2_ID",
  "shipment_id": "SHIPMENT_ID",
  "wall_number": 3,
  "box_count": 8
}
```

> Check all placements:
> `GET {{supabase_url}}/rest/v1/placements?shipment_id=eq.SHIPMENT_ID&select=*`
> You'll see 3 placements — Order 1 split across walls 1 and 2, Order 2 on wall 3.

### 1.4 Mark an order as done

```
PATCH {{supabase_url}}/rest/v1/orders?id=eq.ORDER_2_ID
```
```json
{
  "is_done": true
}
```

> Look at the response: `is_done` is now `true` and `updated_at` changed.
> In the app, this order would now show a green checkmark.

### 1.5 Undo — mark it back as not done

```
PATCH {{supabase_url}}/rest/v1/orders?id=eq.ORDER_2_ID
```
```json
{
  "is_done": false
}
```

> This is the "Undo" button in the app — workers can toggle this.

### 1.6 Complete the shipment

```
PATCH {{supabase_url}}/rest/v1/shipments?id=eq.SHIPMENT_ID
```
```json
{
  "status": "completed"
}
```

> Shipment is now closed. In the app, it moves to the "Completed" section.

### 1.7 Reopen the shipment

```
PATCH {{supabase_url}}/rest/v1/shipments?id=eq.SHIPMENT_ID
```
```json
{
  "status": "active"
}
```

---

## Exercise 2 — Filtering & Querying

These GET requests show how Supabase PostgREST filtering works. Same pattern the app uses internally.

### 2.1 Filter orders by priority

```
GET {{supabase_url}}/rest/v1/orders?priority=eq.urgent&select=order_number,client_name,priority
```

> Only returns urgent orders. The `select` parameter limits which columns come back — like SQL's SELECT clause.

### 2.2 Filter orders that are done

```
GET {{supabase_url}}/rest/v1/orders?is_done=eq.true&select=order_number,client_name,done_at
```

### 2.3 Filter orders with high box count

```
GET {{supabase_url}}/rest/v1/orders?box_count=gte.20&select=order_number,client_name,box_count&order=box_count.desc
```

> `gte` = greater than or equal. Sorted descending by box count.

### 2.4 Search orders by client name (partial match)

```
GET {{supabase_url}}/rest/v1/orders?client_name=ilike.*markt*&select=order_number,client_name
```

> `ilike` = case-insensitive pattern match. `*` = wildcard. Finds any client with "markt" in the name.

### 2.5 Get shipment with related orders count

```
GET {{supabase_url}}/rest/v1/shipments?select=name,status,orders(count)
```

> This uses PostgREST's embedded resources — it joins shipments with orders and returns the count. The same concept behind the order counter badges in the app UI.

### 2.6 Pagination

```
GET {{supabase_url}}/rest/v1/orders?select=*&order=created_at.desc&limit=5&offset=0
```

> First page (5 items). Change `offset=5` for page 2, `offset=10` for page 3, etc.

---

## Exercise 3 — Auth & Roles

### 3.1 Sign in as Operator

```
POST {{supabase_url}}/auth/v1/token?grant_type=password
```
```json
{
  "email": "admin@tulip.app",
  "password": "YOUR_PASSWORD"
}
```

> Operator has full access: create, edit, delete shipments and orders.

### 3.2 Sign in as Worker

```
POST {{supabase_url}}/auth/v1/token?grant_type=password
```
```json
{
  "email": "user@tulip.app",
  "password": "YOUR_PASSWORD"
}
```

> Worker has read-only access + can toggle Done/Undo on orders. Try creating a shipment with a worker token — what happens?

### 3.3 Inspect your user profile

```
GET {{supabase_url}}/auth/v1/user
```

> Look at `user_metadata` in the response. You'll see: `role`, `first_name`, `last_name`, `theme`, `locale`. This is where the app reads your display name and preferences.

### 3.4 Test without auth (what happens?)

Try any GET request but **remove the Authorization header**. Keep only `apikey`.

```
GET {{supabase_url}}/rest/v1/shipments?select=*
```

> What do you get back? This shows how RLS (Row Level Security) works — without a valid JWT, the database returns empty results or an error. The `apikey` alone gets you through the door, but without `Authorization`, Supabase doesn't know who you are.

---

## Exercise 4 — Edge Functions

### 4.1 Submit a suggestion

```
POST {{supabase_url}}/functions/v1/create-suggestion
```

Headers: only `Authorization` + `Content-Type` (no `apikey` needed for Edge Functions).

```json
{
  "text": "It would be great to see a dashboard with daily shipment statistics and box counts per wall",
  "userRole": "operator",
  "page": "shipments"
}
```

> This creates a real issue in the Linear "User Suggestions" project. The Edge Function extracts a title from the first sentence, adds metadata (role, page, timestamp), and calls Linear's GraphQL API. Delete the issue in Linear after testing.

### 4.2 Test validation — text too short

```json
{
  "text": "Hi",
  "userRole": "operator",
  "page": "shipments"
}
```

> Should return an error — minimum 10 characters. This is server-side validation in the Edge Function.

### 4.3 Test validation — invalid role

```json
{
  "text": "This is a valid length suggestion text",
  "userRole": "admin",
  "page": "shipments"
}
```

> Should return an error — only "operator" and "worker" are accepted. This is input validation.

### 4.4 Test without auth

Remove the `Authorization` header and send any valid body.

> What happens? Edge Functions deployed with `--no-verify-jwt` don't check the token, but the function code itself may check CORS origin. From Postman (no origin header), it should still work — highlighting a security consideration.

---

## Exercise 5 — Destructive Operations (Cleanup)

Use these to clean up after exercises. Replace IDs accordingly.

### 5.1 Delete all placements for a shipment

```
DELETE {{supabase_url}}/rest/v1/placements?shipment_id=eq.SHIPMENT_ID
```

> Deletes ALL placements matching the filter — not just one. Be careful with DELETE without a specific `id=eq.` filter.

### 5.2 Delete all orders for a shipment

```
DELETE {{supabase_url}}/rest/v1/orders?shipment_id=eq.SHIPMENT_ID
```

> Must delete placements first (foreign key constraint). If you try deleting orders that still have placements, you'll get a 409 Conflict.

### 5.3 Delete the shipment

```
DELETE {{supabase_url}}/rest/v1/shipments?id=eq.SHIPMENT_ID
```

> Must delete orders first (foreign key constraint). The deletion order matters: placements → orders → shipment.

---

## Quick Reference — PostgREST Filter Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `eq` | equals | `?status=eq.active` |
| `neq` | not equals | `?status=neq.completed` |
| `gt` | greater than | `?box_count=gt.10` |
| `gte` | greater than or equal | `?box_count=gte.20` |
| `lt` | less than | `?box_count=lt.5` |
| `lte` | less than or equal | `?box_count=lte.3` |
| `like` | pattern match (case-sensitive) | `?name=like.*Express*` |
| `ilike` | pattern match (case-insensitive) | `?client_name=ilike.*hotel*` |
| `in` | in list | `?priority=in.(urgent,normal)` |
| `is` | is null / is true | `?done_at=is.null` |
| `not` | negate | `?is_done=not.eq.true` |
| `order` | sort | `?order=created_at.desc` |
| `limit` | max rows | `?limit=10` |
| `offset` | skip rows | `?offset=5` |
