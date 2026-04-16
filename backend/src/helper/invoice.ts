import PDFDocument from "pdfkit";

export const generateInvoicePDF = (order: any): Promise<Buffer> => {
  return new Promise((resolve) => {
    const doc = new PDFDocument();
    const buffers: Uint8Array[] = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    
    doc.fontSize(20).text("Invoice", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Order ID: ${order.id}`);
    doc.text(`Customer: ${order.email}`);
    doc.text(`Total: $${order.total}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);

    doc.moveDown();
    doc.text("Items:");

    order.items.forEach((item: any) => {
      doc.text(`- ${item.name} x${item.quantity} ($${item.price})`);
    });

    doc.end();
  });
};