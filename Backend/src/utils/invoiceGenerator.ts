import PDFDocument from "pdfkit";
import { Response } from "express";
import path from "path";
import fs from "fs";

interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
  weight?: string;
}

interface InvoiceData {
  invoiceNumber: string;
  orderNumber: string;
  date: Date;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
}

// Ensure invoices directory exists
const invoicesDir = path.resolve(process.cwd(), "invoices");
if (!fs.existsSync(invoicesDir)) {
  fs.mkdirSync(invoicesDir, { recursive: true });
}

export const generateInvoice = async (
  invoiceData: InvoiceData,
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: "A4",
      });

      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Header
      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .fillColor("#2563eb")
        .text("ORGOBLOOM", 50, 50);

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#666666")
        .text("Premium Organic Fertilizers", 50, 80)
        .text("Email: support@orgobloom.com", 50, 92)
        .text("Phone: +91 9876543210", 50, 104);

      // Invoice Title
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text("INVOICE", 400, 50, { align: "right" });

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#666666")
        .text(`Invoice #: ${invoiceData.invoiceNumber}`, 400, 75, {
          align: "right",
        })
        .text(`Order #: ${invoiceData.orderNumber}`, 400, 87, {
          align: "right",
        })
        .text(
          `Date: ${invoiceData.date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}`,
          400,
          99,
          { align: "right" },
        );

      // Divider
      doc.moveTo(50, 130).lineTo(550, 130).strokeColor("#e5e7eb").stroke();

      // Bill To Section
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text("Bill To:", 50, 150);

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#333333")
        .text(invoiceData.customerName, 50, 170)
        .text(invoiceData.customerEmail, 50, 182)
        .text(invoiceData.customerPhone || "", 50, 194);

      // Shipping Address
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text("Ship To:", 300, 150);

      doc.fontSize(10).font("Helvetica").fillColor("#333333");
      let addressY = 170;
      doc.text(invoiceData.shippingAddress.addressLine1, 300, addressY);
      if (invoiceData.shippingAddress.addressLine2) {
        addressY += 12;
        doc.text(invoiceData.shippingAddress.addressLine2, 300, addressY);
      }
      addressY += 12;
      doc.text(
        `${invoiceData.shippingAddress.city}, ${invoiceData.shippingAddress.state} ${invoiceData.shippingAddress.pincode}`,
        300,
        addressY,
      );
      addressY += 12;
      doc.text(invoiceData.shippingAddress.country, 300, addressY);

      // Items Table Header
      const tableTop = 260;
      const tableHeaders = ["Item", "Weight", "Qty", "Price", "Total"];
      const tableWidths = [200, 80, 60, 100, 100];

      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#ffffff")
        .rect(50, tableTop, 500, 25)
        .fill("#2563eb");

      let x = 50;
      tableHeaders.forEach((header, i) => {
        doc.text(header, x + 5, tableTop + 7, { width: tableWidths[i] - 10 });
        x += tableWidths[i];
      });

      // Items
      doc.font("Helvetica").fillColor("#333333");
      let y = tableTop + 35;

      invoiceData.items.forEach((item, index) => {
        // Alternate row background
        if (index % 2 === 0) {
          doc
            .rect(50, y - 5, 500, 20)
            .fillColor("#f9fafb")
            .fill();
        }

        doc.fillColor("#333333");
        x = 50;
        doc.text(item.name, x + 5, y, { width: tableWidths[0] - 10 });
        x += tableWidths[0];
        doc.text(item.weight || "1kg", x + 5, y, {
          width: tableWidths[1] - 10,
        });
        x += tableWidths[1];
        doc.text(item.quantity.toString(), x + 5, y, {
          width: tableWidths[2] - 10,
        });
        x += tableWidths[2];
        doc.text(`₹${item.price.toFixed(2)}`, x + 5, y, {
          width: tableWidths[3] - 10,
        });
        x += tableWidths[3];
        doc.text(`₹${(item.price * item.quantity).toFixed(2)}`, x + 5, y, {
          width: tableWidths[4] - 10,
        });

        y += 20;
      });

      // Totals
      y += 20;
      doc.moveTo(50, y).lineTo(550, y).strokeColor("#e5e7eb").stroke();
      y += 15;

      const totalsX = 400;

      doc
        .fontSize(10)
        .font("Helvetica")
        .text("Subtotal:", totalsX, y)
        .text(`₹${invoiceData.subtotal.toFixed(2)}`, 500, y, {
          align: "right",
        });
      y += 15;

      doc
        .text("Tax (18% GST):", totalsX, y)
        .text(`₹${invoiceData.tax.toFixed(2)}`, 500, y, { align: "right" });
      y += 15;

      doc
        .text("Shipping:", totalsX, y)
        .text(`₹${invoiceData.shippingCost.toFixed(2)}`, 500, y, {
          align: "right",
        });
      y += 20;

      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor("#2563eb")
        .text("Total:", totalsX, y)
        .text(`₹${invoiceData.total.toFixed(2)}`, 500, y, { align: "right" });

      // Payment Info
      y += 40;
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#333333")
        .text(`Payment Method: ${invoiceData.paymentMethod}`, 50, y)
        .text(`Payment Status: ${invoiceData.paymentStatus}`, 250, y);

      // Footer
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#666666")
        .text("Thank you for your business!", 50, 750, { align: "center" })
        .text(
          "This is a computer generated invoice and does not require signature.",
          50,
          765,
          { align: "center" },
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Generate and save invoice to file
export const generateAndSaveInvoice = async (
  invoiceData: InvoiceData,
): Promise<string> => {
  const buffer = await generateInvoice(invoiceData);
  const filename = `invoice-${invoiceData.orderNumber}.pdf`;
  const filepath = path.join(invoicesDir, filename);

  fs.writeFileSync(filepath, buffer);
  return filepath;
};

// Stream invoice to response
export const streamInvoice = async (
  res: Response,
  invoiceData: InvoiceData,
): Promise<void> => {
  const buffer = await generateInvoice(invoiceData);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="invoice-${invoiceData.orderNumber}.pdf"`,
  );
  res.setHeader("Content-Length", buffer.length);

  res.send(buffer);
};

export default {
  generateInvoice,
  generateAndSaveInvoice,
  streamInvoice,
};
