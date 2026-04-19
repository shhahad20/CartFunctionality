type OrderItem = {
  name: string;
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  email: string;
  amount: number;
  items: OrderItem[];
};

const formatSAR = (amount: number) =>
  (amount / 100).toLocaleString("en-SA", {
    style: "currency",
    currency: "SAR",
  });

  const year = new Date().getFullYear();

export function orderConfirmationTemplate(order: Order): string {
  return `
  <div style="max-width:520px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#ffffff;border-radius:12px;border:1px solid #e5e5e5;overflow:hidden;">

    <div style="padding:2rem;border-bottom:1px solid #e5e5e5;text-align:center; background:black;">
      <img src="https://puakrabhbhosdpyxfsfk.supabase.co/storage/v1/object/public/images/logo-white.svg"/>
    </div>

    <div style="padding:2.5rem 2rem;">
      <p style="font-size:13px;color:#888;margin:0 0 1.5rem;">Hello,</p>

      <p style="font-size:22px;font-weight:500;color:#0a0a0a;margin:0 0 0.75rem;">
        Thank you for your order
      </p>

      <p style="font-size:14px;color:#666;margin:0 0 2rem;">
        We’ve received your order and it’s now being processed.
      </p>

      <div style="margin-bottom:1.5rem;">
        <p style="font-size:13px;color:#888;margin:0;">Order ID</p>
        <p style="font-size:15px;color:#0a0a0a;margin:4px 0 12px;font-weight:500;">
          ${order.id}
        </p>

        <p style="font-size:13px;color:#888;margin:0;">Total</p>
        <p style="font-size:18px;font-weight:600;margin:4px 0;">
          ${formatSAR(order.amount)}
        </p>
      </div>

      <div style="margin-top:2rem;">
        <p style="font-size:14px;font-weight:500;margin:0 0 1rem;">
          Order Items
        </p>

        <div style="border-top:1px solid #eee;">
          ${order.items.map((i) => `
            <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f2f2f2;">
              <span style="padding-right:1rem;">${i.name} × ${i.quantity}</span>
              <span>${i.price * i.quantity}</span>
            </div>
          `).join("")}
        </div>
      </div>

      <p style="font-size:12px;color:#aaa;margin-top:2rem;">
        If you have any questions, just reply to this email.
      </p>
    </div>

    <div style="padding:1.25rem 2rem;border-top:1px solid #e5e5e5;text-align:center;">
      <p style="font-size:12px;color:#aaa;margin:0;">© ${year} Shahad · All rights reserved</p>
    </div>

  </div>
  `;
}