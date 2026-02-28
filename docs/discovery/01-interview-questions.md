> **Historical document** from the original tulip-farm discovery phase. The platform is now goods-agnostic (krnvchLogistic).

# Stakeholder Interview — Question Guide

**Objective**: Fill critical gaps identified in spec analysis. Understand real operations, validate assumptions, and define MVP scope.
**Format**: Open-ended first, then targeted deep-dives.
**Participants**: PM (leads), BA (captures details), SME (validates domain)

---

## Part 1: The Big Picture (PM leads)

### 1.1 Tell Me About Your Business
- Walk me through your tulip operation: how many people, what's the yearly cycle?
- When does the "season" start and end? Is March 8 the only big delivery or are there others?
- How many years have you been doing this? Has the scale changed?

### 1.2 The Pain
- What is the SINGLE most stressful moment of the delivery day?
- What went wrong last year? Give me a specific story of a mistake or near-miss.
- If you could magically fix one thing about the delivery process, what would it be?
- How much time/money do mistakes cost you? (rough estimate is fine)

### 1.3 Current Solution
- How do you track where boxes are in the trailer RIGHT NOW? Paper? Memory? Nothing?
- Can you show me or describe any notes/sheets/lists you currently use?
- Have you tried any apps or tools for this before?

---

## Part 2: The Operation — Step by Step (BA leads)

### 2.1 Before Loading Day (Orders & Preparation)

- How do orders come in? Phone calls? Messages? In-person?
- When are orders finalized — days before? Night before? Morning of?
- Do orders change after being confirmed? (cancellations, quantity changes, last-minute additions)
- How do you currently record orders? Spreadsheet? Notebook? WhatsApp messages?
- Who enters / manages order information?
- Do you know the pickup order of clients in advance, or do they just show up?

### 2.2 Packing (Tulips into Boxes)

- How many tulips go into one box? Is it always the same number?
- Are all boxes the same physical size, or do they vary?
- Are boxes labeled? (stickers with order number, client name?)
- Who packs them? Same people who load the truck?
- Is packing done before loading day or on the same morning?
- Where are packed boxes stored before loading? (greenhouse, warehouse, cold room?)

### 2.3 Loading the Trailer

- Walk me through loading from start to finish. What happens first?
- How many people load the trailer?
- Who decides which boxes go where? Is there a plan, or is it improvised?
- How long does loading take? (rough: 1 hour? 4 hours? all day?)
- Are boxes loaded in any particular order? (e.g., last-to-deliver loaded first?)
- Can you describe the PHYSICAL trailer:
  - Approximate length? (in meters or "fits X rows of boxes")
  - How many boxes fit side by side (width)?
  - How many boxes can stack on top of each other?
  - Does it have any internal dividers, shelves, or is it an open box?
  - Is it always the same trailer, or do you use different ones?
- Do you ever rearrange boxes DURING loading? ("Wait, move these, we need to fit more here")
- What happens when a box doesn't fit where planned?

### 2.4 Transport

- How far is the drive to the market? How long?
- Does anything happen to the load during transport? (shifting, falling?)
- Is there anything you need to check or do to the load during transport?

### 2.5 At the Market (Unloading & Pickup)

- Walk me through arrival at the market. What happens?
- Do clients come to your truck, or do you unload to a stall/table?
- How do clients identify themselves? (name? order number? they just know each other?)
- How do you FIND the right boxes when a client comes?
- How long does it take to serve one client right now?
- Do all clients come at the same time, or spread over several hours?
- Do clients ever take partial orders? ("I'll take 4 boxes now, send 2 to my other location")
- What happens with unclaimed orders at the end of the day?
- Do you need any paperwork at handover? (receipt, confirmation, payment?)

### 2.6 After Delivery

- Do you track what was delivered to whom? For next year's planning?
- Do you compare actual vs. planned? Review what went well/badly?
- How do you use last year's data? (order sizes, client list, layout)

---

## Part 3: Domain Validation (SME leads)

### 3.1 Physical Constraints
- Tulip boxes — are they standard flower boxes? (approximate dimensions: L x W x H cm)
- Weight per box? Can a person carry one box, or need two people?
- Fragility: can boxes be stacked? How many layers high safely?
- Temperature: do tulips need cold during transport? Is the trailer refrigerated?
- Are there any boxes that CANNOT be stacked on or under? (e.g., fragile arrangements vs. standard bunches)

### 3.2 Operational Constraints
- On loading day, is there reliable internet access at the farm?
- At the wholesale market — is there reliable internet?
- What devices are available? (phone, tablet, laptop)
- Will gloves be worn? Hands dirty/wet? (affects touchscreen usability)
- Is there a quiet place to use the app, or is it noisy/hectic?

### 3.3 Labeling & Identification
- How do you currently identify which box belongs to which order?
- Would you be willing to put a printed label on each box? (the app could generate these)
- Do clients have account numbers or just names?

### 3.4 Scaling Questions
- Could this approach work for other flower farms you know?
- Are there other delivery days during the year, or just March?
- Do you ever deliver to multiple markets on the same day?

---

## Part 4: Product & UX (PM + Designer)

### 4.1 App Usage Scenario
- If you had this app tomorrow, when would you first open it? (night before? morning of loading?)
- Would you have the app open WHILE loading, or prepare a plan and print it?
- At the market, phone in hand or taped to the trailer wall?
- How tech-savvy are the people who would use this? (ages, comfort with apps)

### 4.2 What "Done" Looks Like
- At the end of the day, how would you know the app was helpful?
- What information do you wish you had during loading that you don't have now?
- What information do you wish you had at the market that you don't have now?

### 4.3 Priorities
- Rank these in order of importance:
  1. Knowing where each order is in the trailer
  2. Loading faster
  3. Avoiding mistakes (wrong boxes to wrong client)
  4. Having a record for next year
  5. Reducing stress / feeling organized

### 4.4 Dealbreakers
- What would make you NOT use this app? (too slow? too complex? no internet?)
- What's the maximum amount of setup time you'd tolerate before loading day?

---

## Part 5: Quick Validation Questions (BA + SME)

Answer format: Yes / No / Sometimes / Not sure

| # | Question | Answer |
|---|----------|--------|
| 1 | Is the number of tulips per box always the same? | |
| 2 | Are all boxes the same physical size? | |
| 3 | Are boxes labeled with order numbers before loading? | |
| 4 | Do you know which clients will arrive first at the market? | |
| 5 | Can a client do a partial pickup? | |
| 6 | Is internet reliable at the farm? | |
| 7 | Is internet reliable at the market? | |
| 8 | Would you enter orders into the app yourself? | |
| 9 | Is it always the same trailer? | |
| 10 | Do more than one person need to see the trailer map at the same time? | |
| 11 | Do you use a smartphone comfortably? | |
| 12 | Would you prepare the loading plan the night before? | |
| 13 | Is there only ONE delivery per season, or multiple? | |
| 14 | Do you want to keep data from previous years? | |
| 15 | Is tulip quantity per order relevant during loading, or only box count? | |

---

## Interview Logistics

- **Duration**: 45-60 minutes recommended
- **Format**: Conversational. Answer as much or little as you want. Skip anything not relevant.
- **"I don't know" is a valid answer** — it tells us what to simplify.
- We will follow up on specific areas after the first pass.
