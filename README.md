# Drop Zone

This build contains the customer/admin order workflow and customer funds management.

## Customer
- Dashboard: Total Balance, Total Profit, Active Orders, Completed Orders.
- Total Balance is admin-controlled and reflects all balance movements.
- Total Profit shows cumulative earnings from completed order commissions only.
- Products: 100-product catalog with the supplied product images.
- Orders: orders sent by Admin appear here.
- Grab: deducts only the Order Amount from Total Balance and moves the order to Pending.
- Cancel: available only before Grab.
- Insufficient balance message: `Your balance is insufficient please contact to the customer support`
- Order Status flow: Pending → Handed over to our delivery partner → On the way → Delivered → Completed.
- Completion returns Order Amount + Commission to Total Balance and adds Commission to Total Profit.
- Customer Support supports realtime text + image attachments.

## Admin
- Users: Activate/Suspend/Delete customer accounts.
- Orders: choose a customer, choose one of the 100 products, choose 10–15% commission, and send the order.
- Order Amount is automatically the product catalog price.
- Funds: Add/Deduct customer Total Balance.
- Order status: move each grabbed order through the delivery stages.
- Completing an order returns the Order Amount + Commission to Total Balance and adds Commission to Total Profit.
- Products: view the full 100-product catalog.
- Support: realtime customer conversations with image attachments.

## Product images
Products 11–100 use the supplied product sheets, cropped into individual catalog images.

## Run
```bash
npm.cmd install
npm.cmd run dev
```
Open `http://localhost:3000`.

The application uses `data/db.json` for its local data store.
