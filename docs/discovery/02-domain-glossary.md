# Domain Glossary

All team members must use these terms consistently. Updated as discovery progresses.

---

| Term | Definition | Notes |
|------|-----------|-------|
| **Tulip** | The product. Individual flower stem. | Not directly tracked in the loading app — boxes are the unit |
| **Box** | Physical transport unit. 40cm W x 60cm H x 60cm D. All identical, strong, stackable. Each labeled "Order #N, box X of Y". | The primary unit for trailer placement. ~720 boxes fill one trailer. |
| **Order** | A client's purchase. Defined by: order number, client, tulip quantity, box count. | One order = one client. Can span multiple trailer rows. |
| **Placement** | A record of N boxes from an order placed at a specific trailer location (row). | One order can have multiple placements across different rows |
| **Trailer** | Standard Euro reefer trailer used for delivery. ~30 walls deep, 6 boxes wide, 4 boxes high. | One specific trailer, same every year. Refrigerated for temperature stability during transport. |
| **Wall** | A depth position in the trailer, numbered from the doors (back) to the front. Always holds exactly 24 boxes (6 wide x 4 high). | Wall 1 = closest to doors (first out). Wall 30 = deepest (last out). Called "стенка" or "куб" in Russian. |
| **~~Slot~~** | ~~A position within a wall — left/right or column-based.~~ | **NOT NEEDED** — confirmed: within a wall, left/right position is random and irrelevant. |
| **~~Layer~~** | ~~Vertical stacking level within a wall.~~ | **NOT NEEDED** — confirmed: always 4 high, boxes are strong, no fragility concern. No per-layer tracking. |
| **Shipment** | A single delivery event — one trailer, one day, one destination. | Groups all orders and placements for a delivery day. |
| **Loading** | The process of physically placing boxes into the trailer at the farm. | Progressive — happens over hours. Needs spatial planning. |
| **Pickup** | When a client arrives at the market and receives their boxes. | The high-pressure moment. Speed of finding boxes is critical. |
| **Trailer Map** | The visual representation of the trailer's interior showing all placements. | The core UI element. Like an airplane seat map but for boxes. |
| **Wholesale Market** | The destination where clients come to collect their orders. | A large market venue. Clients arrive over several hours. |
| **March 8** | International Women's Day. The peak demand day for tulips. | Delivery to market happens ~March 1 or a few days before. |
| **Capacity** | Maximum number of boxes a row (or the entire trailer) can hold. | Physical constraint based on trailer dimensions and box size. |
| **LIFO** | Last In, First Out. Boxes loaded last are closest to the doors and unloaded first. | Critical for loading planning — clients arriving first should have boxes near the doors. |

---

## Terminology — Resolved

All confirmed in stakeholder interview:
- **Trailer** = "фура" (fura) in Russian. Use "trailer" in the app.
- **Wall/Row** = "стенка" (wall) or "куб" (cube) in Russian. Use "wall" in the app.
- **Order** = "заказ" (zakaz) in Russian. Use "order" in the app.
- **Box** = "коробка" (korobka) in Russian. Use "box" in the app.
- Walls are referred to by number ("wall 12") and position ("near the doors", "at the back").
