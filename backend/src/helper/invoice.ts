// import PDFDocument from "pdfkit";

// export const generateInvoicePDF = (order: any): Promise<Buffer> => {
//   return new Promise((resolve) => {
//     const doc = new PDFDocument();
//     const buffers: Uint8Array[] = [];

//     doc.on("data", buffers.push.bind(buffers));
//     doc.on("end", () => {
//       const pdfData = Buffer.concat(buffers);
//       resolve(pdfData);
//     });

//     doc.fontSize(20).text("Invoice", { align: "center" });
//     doc.moveDown();

//     doc.fontSize(12).text(`Order ID: ${order.id}`);
//     doc.text(`Customer: ${order.email}`);
//     doc.text(`Total: SAR ${order.total}`);
//     doc.text(`Date: ${new Date().toLocaleDateString()}`);

//     doc.moveDown();
//     doc.text("Items:");

//     order.items.forEach((item: any) => {
//       doc.text(`- ${item.name} x${item.quantity} (SAR ${item.price})`);
//     });

//     doc.end();
//   });
// };

import PDFDocument from "pdfkit";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  name: string;
  quantity: number;
  price: number; // unit price in SAR
}

interface Order {
  id: string;
  email: string;
  amount: number;
  items: OrderItem[];
  createdAt?: Date;
  phone?: string;
  address_line1?: string;
  city?: string;
  country?: string;
  postal_code?: string;
}

// ─── Design Tokens ────────────────────────────────────────────────────────────

const COLORS = {
  brand: "#1e1e1e", // deep navy — header background
  brandAccent: "rgba(255, 255, 255, 0.04)", // electric blue — accent line & highlights
  surface: "#f5f5f5", // near-white page background
  tableHeader: "#1e1e1e", // dark slate for table header row
  rowAlt: "rgba(255, 255, 255, 0.68)", // very light blue-grey alternate row
  border: "#f5f5f5", // subtle border
  textPrimary: "#1e1e1e", // near-black body text
  textMuted: "rgba(255, 255, 255, 0.68)", // secondary text
  textOnDark: "#FFFFFF", // white text on dark backgrounds
  green: "#16A34A", // paid badge
  totalBg: "#1e1e1e", // total row background
};

const FONT = {
  regular: "Helvetica",
  bold: "Helvetica-Bold",
  oblique: "Helvetica-Oblique",
};

// Page geometry
const PAGE_WIDTH = 595.28; // A4 points
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

// ─── Helper: draw a filled rectangle ─────────────────────────────────────────

function fillRect(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  doc.save().rect(x, y, w, h).fill(color).restore();
}

// ─── Helper: horizontal rule ──────────────────────────────────────────────────

function hRule(
  doc: PDFKit.PDFDocument,
  y: number,
  color = COLORS.border,
  thickness = 0.5,
) {
  doc
    .save()
    .moveTo(MARGIN, y)
    .lineTo(PAGE_WIDTH - MARGIN, y)
    .lineWidth(thickness)
    .stroke(color)
    .restore();
}

// ─── Section: Header band ─────────────────────────────────────────────────────

function drawHeader(doc: PDFKit.PDFDocument, order: Order): number {
  const HEADER_HEIGHT = 110;

  // Background
  fillRect(doc, 0, 0, PAGE_WIDTH, HEADER_HEIGHT, COLORS.brand);

  // Accent stripe at the very top
  fillRect(doc, 0, 0, PAGE_WIDTH, 4, COLORS.brandAccent);

  // Company / store name (left)
  doc
    .font(FONT.bold)
    .fontSize(22)
    .fillColor(COLORS.textOnDark)
    .text("Shahad", MARGIN, 28, { lineBreak: false });

  // "INVOICE" label (right)
  doc
    .font(FONT.bold)
    .fontSize(28)
    .fillColor(COLORS.brandAccent)
    .text("INVOICE", 0, 22, {
      align: "right",
      width: PAGE_WIDTH - MARGIN,
      lineBreak: false,
    });

  // Tagline under company name
  doc
    .font(FONT.oblique)
    .fontSize(9)
    .fillColor("#94A3B8")
    .text("Your trusted online shop", MARGIN, 54, { lineBreak: false });

  // Invoice number + date (bottom of header)
  const invoiceDate = order.createdAt
    ? order.createdAt.toLocaleDateString("en-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("en-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  doc
    .font(FONT.regular)
    .fontSize(9)
    .fillColor("#CBD5E1")
    .text(`Invoice #${order.id.toUpperCase()}`, MARGIN, 78, {
      lineBreak: false,
    });

  doc
    .font(FONT.regular)
    .fontSize(9)
    .fillColor("#CBD5E1")
    .text(`Date: ${invoiceDate}`, 0, 78, {
      align: "right",
      width: PAGE_WIDTH - MARGIN,
      lineBreak: false,
    });

  return HEADER_HEIGHT;
}

// ─── Section: Bill-to / meta info ────────────────────────────────────────────

function drawMeta(doc: PDFKit.PDFDocument, order: Order, y: number): number {
  const startY = y + 32;

  // Left: Bill To
  doc
    .font(FONT.bold)
    .fontSize(8)
    .fillColor(COLORS.textMuted)
    .text("BILL TO", MARGIN, startY);

  doc
    .font(FONT.bold)
    .fontSize(12)
    .fillColor(COLORS.textPrimary)
    .text(order.email, MARGIN, startY + 14);

  if (order.address_line1) {
    doc
      .font(FONT.regular)
      .fontSize(10)
      .fillColor(COLORS.textMuted)
      .text(order.address_line1, MARGIN, startY + 30);
  }
  if (order.postal_code) {
    doc
      .font(FONT.regular)
      .fontSize(10)
      .fillColor(COLORS.textMuted)
      .text(order.postal_code, MARGIN, startY + 30);
  }

  if (order.city || order.country) {
    doc
      .font(FONT.regular)
      .fontSize(10)
      .fillColor(COLORS.textMuted)
      .text(
        [order.city, order.country].filter(Boolean).join(", "),
        MARGIN,
        startY + 44,
      );
  }

  doc
    .font(FONT.regular)
    .fontSize(10)
    .fillColor(COLORS.textMuted)
    .text(order.email, MARGIN, startY + (order.address_line1 ? 58 : 30));

  // Right: Payment status badge
  const badgeX = PAGE_WIDTH - MARGIN - 70;
  const badgeY = startY;
  fillRect(doc, badgeX, badgeY, 70, 22, "#DCFCE7");
  doc
    .font(FONT.bold)
    .fontSize(9)
    .fillColor(COLORS.green)
    .text("✓  PAID", badgeX, badgeY + 6, {
      width: 70,
      align: "center",
      lineBreak: false,
    });

  // Right: Invoice details
  const detailsX = PAGE_WIDTH - MARGIN - 180;
  const labels = ["Order ID", "Payment Method", "Currency"];
  const values = [order.id.slice(-8).toUpperCase(), "Stripe", "SAR"];

  labels.forEach((label, i) => {
    const rowY = startY + 32 + i * 18;
    doc
      .font(FONT.bold)
      .fontSize(9)
      .fillColor(COLORS.textMuted)
      .text(label, detailsX, rowY, { width: 90, lineBreak: false });
    doc
      .font(FONT.regular)
      .fontSize(9)
      .fillColor(COLORS.textPrimary)
      .text(values[i], detailsX + 95, rowY, { lineBreak: false });
  });

  hRule(doc, startY + 100, COLORS.border);

  return startY + 112;
}

// ─── Section: Line-items table ────────────────────────────────────────────────

const COL = {
  item: { x: MARGIN, width: 220 },
  qty: { x: MARGIN + 230, width: 60 },
  unit: { x: MARGIN + 300, width: 100 },
  subtotal: { x: MARGIN + 410, width: 90 },
};

function drawTableHeader(doc: PDFKit.PDFDocument, y: number) {
  fillRect(doc, MARGIN, y, CONTENT_WIDTH, 28, COLORS.tableHeader);

  const textY = y + 8;
  const headers: [keyof typeof COL, string, "left" | "right"][] = [
    ["item", "ITEM DESCRIPTION", "left"],
    ["qty", "QTY", "right"],
    ["unit", "UNIT PRICE", "right"],
    ["subtotal", "SUBTOTAL", "right"],
  ];

  headers.forEach(([key, label, align]) => {
    const col = COL[key];
    doc
      .font(FONT.bold)
      .fontSize(8)
      .fillColor(COLORS.textOnDark)
      .text(label, col.x + (align === "right" ? 0 : 8), textY, {
        width: col.width - (align === "right" ? 8 : 8),
        align,
        lineBreak: false,
      });
  });

  return y + 28;
}

function drawTableRows(
  doc: PDFKit.PDFDocument,
  items: OrderItem[],
  startY: number,
): { y: number; subtotal: number } {
  let y = startY;
  let subtotal = 0;
  const ROW_HEIGHT = 34;

  items.forEach((item, i) => {
    const lineTotal = item.quantity * item.price;
    subtotal += lineTotal;
    const isAlt = i % 2 === 1;

    // Row background
    fillRect(
      doc,
      MARGIN,
      y,
      CONTENT_WIDTH,
      ROW_HEIGHT,
      isAlt ? COLORS.rowAlt : "#FFFFFF",
    );

    // Left accent stripe for alternating rows
    if (isAlt) {
      fillRect(doc, MARGIN, y, 3, ROW_HEIGHT, COLORS.brandAccent);
    }

    const textY = y + 10;

    // Item name
    doc
      .font(FONT.bold)
      .fontSize(10)
      .fillColor(COLORS.textPrimary)
      .text(item.name, COL.item.x + 8, textY, {
        width: COL.item.width - 10,
        lineBreak: false,
      });

    // Quantity
    doc
      .font(FONT.regular)
      .fontSize(10)
      .fillColor(COLORS.textPrimary)
      .text(String(item.quantity), COL.qty.x, textY, {
        width: COL.qty.width - 8,
        align: "right",
        lineBreak: false,
      });

    // Unit price
    doc
      .font(FONT.regular)
      .fontSize(10)
      .fillColor(COLORS.textPrimary)
      .text(`SAR ${item.price}`, COL.unit.x, textY, {
        width: COL.unit.width - 8,
        align: "right",
        lineBreak: false,
      });

    // Subtotal
    doc
      .font(FONT.bold)
      .fontSize(10)
      .fillColor(COLORS.textPrimary)
      .text(`SAR ${lineTotal}`, COL.subtotal.x, textY, {
        width: COL.subtotal.width - 8,
        align: "right",
        lineBreak: false,
      });

    y += ROW_HEIGHT;
  });

  // Bottom border on table
  hRule(doc, y, COLORS.border);

  return { y: y + 1, subtotal };
}

// ─── Section: Totals ──────────────────────────────────────────────────────────

function drawTotals(
  doc: PDFKit.PDFDocument,
  y: number,
  subtotal: number,
  grandTotal: number,
): number {
  const totalsX = PAGE_WIDTH - MARGIN - 240;
  const labelW = 130;
  const valueW = 100;
  const valueX = totalsX + labelW;
  const formatSAR = (amount: number) => (amount / 100).toFixed(2);

  const vat = grandTotal - subtotal; // derive VAT from provided total
  const rows: [string, number, boolean][] = [
    ["Subtotal", subtotal, false],
    // ["VAT (15%)", vat >= 0 ? vat : 0, false],
    ["TOTAL DUE", grandTotal, true],
  ];

  let curY = y + 16;

  rows.forEach(([label, amount, isBold]) => {
    if (isBold) {
      // Grand total row — dark background
      fillRect(
        doc,
        totalsX - 12,
        curY - 6,
        labelW + valueW + 20,
        32,
        COLORS.totalBg,
      );
      doc
        .font(FONT.bold)
        .fontSize(11)
        .fillColor(COLORS.textOnDark)
        .text(label, totalsX - 4, curY + 4, {
          width: labelW,
          lineBreak: false,
        });
      doc
        .font(FONT.bold)
        .fontSize(13)
        .fillColor(COLORS.brandAccent)
        .text(`SAR ${amount}`, valueX, curY + 2, {
          width: valueW,
          align: "right",
          lineBreak: false,
        });
      curY += 32;
    } else {
      doc
        .font(FONT.regular)
        .fontSize(10)
        .fillColor(COLORS.textMuted)
        .text(label, totalsX, curY, { width: labelW, lineBreak: false });
      doc
        .font(FONT.regular)
        .fontSize(10)
        .fillColor(COLORS.textPrimary)
        .text(`SAR ${formatSAR(amount)}`, valueX, curY, {
          width: valueW,
          align: "right",
          lineBreak: false,
        });
      curY += 20;
      hRule(doc, curY - 4, COLORS.border, 0.5);
    }
  });

  return curY;
}

// ─── Section: Footer ─────────────────────────────────────────────────────────

function drawFooter(doc: PDFKit.PDFDocument) {
  const footerY = PAGE_HEIGHT - 56;

  // Top border of footer
  fillRect(doc, 0, footerY, PAGE_WIDTH, 1, COLORS.brandAccent);
  fillRect(doc, 0, footerY + 1, PAGE_WIDTH, 55, COLORS.brand);

  doc
    .font(FONT.regular)
    .fontSize(8.5)
    .fillColor("#94A3B8")
    .text(
      "Thank you for your purchase! For support, contact us at support@mystore.com",
      MARGIN,
      footerY + 14,
      { width: CONTENT_WIDTH, align: "center", lineBreak: false },
    );

  doc
    .font(FONT.regular)
    .fontSize(7.5)
    .fillColor("#475569")
    .text(
      "Shahad · Hail, Saudi Arabia · VAT #300XXXXXXXXX · www.shahadaltharwa.com",
      MARGIN,
      footerY + 30,
      { width: CONTENT_WIDTH, align: "center", lineBreak: false },
    );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export const generateInvoicePDF = (order: Order): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      info: {
        Title: `Invoice #${order.id}`,
        Author: "Shahad Online Store",
        Subject: `Order invoice for ${order.email}`,
      },
    });

    const buffers: Uint8Array[] = [];
    doc.on("data", (chunk) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    // Page background
    fillRect(doc, 0, 0, PAGE_WIDTH, PAGE_HEIGHT, COLORS.surface);

    // ── Draw sections in order ───────────────────────────────────────────────
    let cursor = drawHeader(doc, order);
    cursor = drawMeta(doc, order, cursor);

    // Table section label
    doc
      .font(FONT.bold)
      .fontSize(9)
      .fillColor(COLORS.textMuted)
      .text("ORDER ITEMS", MARGIN, cursor);
    cursor += 14;

    cursor = drawTableHeader(doc, cursor);
    const { y: afterRows, subtotal } = drawTableRows(doc, order.items, cursor);
    drawTotals(doc, afterRows, subtotal, order.amount);
    drawFooter(doc);

    doc.end();
  });
};

// ─── Quick test harness ───────────────────────────────────────────────────────

// import fs from "fs";

// const sampleOrder: Order = {
//   id: "ord_8f3k2mxp91",
//   email: "customer@example.com",
//   total: 689.25,
//   createdAt: new Date(),
//   billingAddress: {
//     name: "Ahmad Al-Rashidi",
//     line1: "123 King Fahd Road",
//     city: "Riyadh",
//     country: "Saudi Arabia",
//   },
//   items: [
//     { name: "Wireless Noise-Cancelling Headphones", quantity: 1, price: 349.00 },
//     { name: "USB-C Charging Cable (2m)",            quantity: 3, price: 29.00  },
//     { name: "Phone Case — Midnight Black",          quantity: 1, price: 55.00  },
//     { name: "Screen Protector (2-pack)",            quantity: 2, price: 25.00  },
//   ],
// };

// generateInvoicePDF(sampleOrder).then((buf) => {
//   fs.writeFileSync("/home/claude/invoice-gen/sample_invoice.pdf", buf);
//   console.log("✅ Invoice generated: sample_invoice.pdf");
// });
