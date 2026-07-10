import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import path from 'path';

export interface InvoiceOrderData {
  id: string;
  status: string;
  total: number;
  currency: string;
  items: { sku: string; title: string; quantity: number; unitPrice: number }[];
  customerName?: string;
  customerEmail?: string;
  shippingAddress?: {
    line1: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  paymentId?: string;
  paymentProvider?: string;
  createdAt?: Date;
}

export interface InvoiceStoreInfo {
  name: string;
  tagline?: string;
  website?: string;
}

const PAGE_LEFT = 48;
const PAGE_RIGHT = 547;
const PAGE_WIDTH = PAGE_RIGHT - PAGE_LEFT;
const PAGE_BOTTOM = 780;

const FONT_BODY = 'InvoiceBody';
const FONT_BOLD = 'InvoiceBold';

const COLORS = {
  brand: '#4B3621',
  accent: '#7A8F6B',
  text: '#1a1816',
  muted: '#6b6b6b',
  light: '#999999',
  border: '#e5e3de',
  surface: '#f7f5f0',
  white: '#ffffff',
  paid: '#2d6a4f',
  paidBg: '#e8f5ee',
  pending: '#b8860b',
  pendingBg: '#fef9ec',
  cancelled: '#9b2c2c',
};

@Injectable()
export class InvoiceService {
  buildInvoicePdf(order: InvoiceOrderData, store: InvoiceStoreInfo): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: PAGE_LEFT, size: 'A4', bufferPages: true });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.registerFonts(doc);

      const orderNo = order.id.slice(-8).toUpperCase();
      const issuedAt = order.createdAt ?? new Date();
      const isPaid = ['paid', 'fulfilled', 'shipped', 'delivered'].includes(order.status);
      const subtotal = order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      const currency = (order.currency || 'INR').toUpperCase();

      this.setBodyFont(doc);
      this.drawHeaderBand(doc, store);
      this.drawTitleRow(doc, isPaid ? 'Tax Invoice' : 'Order Summary', currency);
      this.drawMetaPanel(doc, {
        invoiceNo: `INV-${orderNo}`,
        orderId: this.truncateId(order.id),
        date: issuedAt.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        status: this.formatStatus(order.status),
        statusColor: this.statusColor(order.status),
        statusBg: this.statusBg(order.status),
      });

      doc.moveDown(0.8);
      this.drawAddressRow(doc, order);
      doc.moveDown(1);

      this.drawLineItemsTable(doc, order);
      this.drawTotalsPanel(doc, order, subtotal);
      this.drawPaymentPanel(doc, order, isPaid);
      this.drawFooter(doc, store);

      doc.end();
    });
  }

  private registerFonts(doc: PDFKit.PDFDocument) {
    const fontsDir = path.join(__dirname, 'fonts');
    doc.registerFont(FONT_BODY, path.join(fontsDir, 'Roboto-Regular.ttf'));
    doc.registerFont(FONT_BOLD, path.join(fontsDir, 'Roboto-Bold.ttf'));
    this.setBodyFont(doc);
  }

  private setBodyFont(doc: PDFKit.PDFDocument) {
    doc.font(FONT_BODY);
  }

  private setBoldFont(doc: PDFKit.PDFDocument) {
    doc.font(FONT_BOLD);
  }

  private drawHeaderBand(doc: PDFKit.PDFDocument, store: InvoiceStoreInfo) {
    const y = PAGE_LEFT - 20;
    const website = this.formatWebsite(store.website);

    doc.save();
    doc.rect(0, 0, 595, 92).fill(COLORS.brand);
    this.setBoldFont(doc);
    doc.fillColor(COLORS.white).fontSize(24).text(store.name, PAGE_LEFT, y, { width: 360 });
    this.setBodyFont(doc);
    if (store.tagline) {
      doc.fontSize(9).fillColor('#d4cfc4').text(store.tagline, PAGE_LEFT, y + 30, { width: 360, lineGap: 2 });
    }
    if (website) {
      doc.fontSize(9).fillColor('#c4a962').text(website, PAGE_LEFT, y + (store.tagline ? 52 : 34), { width: 360 });
    }
    doc.restore();
    doc.y = 104;
  }

  private drawTitleRow(doc: PDFKit.PDFDocument, title: string, currency: string) {
    this.setBoldFont(doc);
    doc.fontSize(20).fillColor(COLORS.text).text(title, PAGE_LEFT, doc.y, { align: 'left' });
    this.setBodyFont(doc);
    doc.fontSize(9).fillColor(COLORS.muted).text(`All amounts in ${currency}`, PAGE_LEFT, doc.y + 2, {
      align: 'right',
      width: PAGE_WIDTH,
    });
    doc.y += 28;
  }

  private drawMetaPanel(
    doc: PDFKit.PDFDocument,
    meta: {
      invoiceNo: string;
      orderId: string;
      date: string;
      status: string;
      statusColor: string;
      statusBg: string;
    },
  ) {
    const top = doc.y;
    const panelHeight = 76;
    const colWidth = PAGE_WIDTH / 2 - 8;

    doc.save();
    doc.roundedRect(PAGE_LEFT, top, PAGE_WIDTH, panelHeight, 8).fill(COLORS.surface);
    doc.restore();

    const labelY = top + 14;
    const valueY = top + 28;

    this.drawMetaField(doc, 'Invoice number', meta.invoiceNo, PAGE_LEFT + 16, labelY, valueY, colWidth, true);
    this.drawMetaField(doc, 'Order date', meta.date, PAGE_LEFT + 16 + colWidth + 16, labelY, valueY, colWidth);
    this.drawMetaField(doc, 'Order ID', meta.orderId, PAGE_LEFT + 16, labelY + 38, valueY + 38, colWidth);

    const statusX = PAGE_LEFT + 16 + colWidth + 16;
    doc.fontSize(8).fillColor(COLORS.muted).text('STATUS', statusX, labelY + 38, { width: colWidth });
    this.drawStatusBadge(doc, meta.status, meta.statusColor, meta.statusBg, statusX, valueY + 38);

    doc.y = top + panelHeight + 10;
  }

  private drawStatusBadge(
    doc: PDFKit.PDFDocument,
    label: string,
    color: string,
    bg: string,
    x: number,
    y: number,
  ) {
    const badgeWidth = Math.min(doc.widthOfString(label) + 20, 120);
    doc.save();
    doc.roundedRect(x, y - 2, badgeWidth, 18, 9).fill(bg);
    this.setBoldFont(doc);
    doc.fontSize(9).fillColor(color).text(label, x + 10, y + 1, { width: badgeWidth - 20 });
    this.setBodyFont(doc);
    doc.restore();
  }

  private drawMetaField(
    doc: PDFKit.PDFDocument,
    label: string,
    value: string,
    x: number,
    labelY: number,
    valueY: number,
    width: number,
    bold = false,
  ) {
    doc.fontSize(8).fillColor(COLORS.muted).text(label.toUpperCase(), x, labelY, { width });
    if (bold) this.setBoldFont(doc);
    doc.fontSize(10).fillColor(COLORS.text).text(value, x, valueY, { width });
    if (bold) this.setBodyFont(doc);
  }

  private drawAddressRow(doc: PDFKit.PDFDocument, order: InvoiceOrderData) {
    const top = doc.y;
    const boxWidth = (PAGE_WIDTH - 12) / 2;
    const boxHeight = 100;

    this.drawAddressBox(doc, 'Bill to', PAGE_LEFT, top, boxWidth, boxHeight, [
      order.customerName || 'Customer',
      order.customerEmail ? `Email: ${order.customerEmail}` : '',
    ]);

    const shipLines = order.shippingAddress
      ? [
          order.shippingAddress.line1,
          `${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.pincode}`,
          `Phone: ${order.shippingAddress.phone}`,
        ]
      : ['Same as billing address'];

    this.drawAddressBox(doc, 'Ship to', PAGE_LEFT + boxWidth + 12, top, boxWidth, boxHeight, shipLines);

    doc.y = top + boxHeight + 6;
  }

  private drawAddressBox(
    doc: PDFKit.PDFDocument,
    title: string,
    x: number,
    y: number,
    width: number,
    height: number,
    lines: string[],
  ) {
    doc.save();
    doc.roundedRect(x, y, width, height, 8).lineWidth(1).strokeColor(COLORS.border).stroke();
    doc.restore();

    this.setBoldFont(doc);
    doc.fontSize(9).fillColor(COLORS.accent).text(title.toUpperCase(), x + 14, y + 12, { width: width - 28 });
    this.setBodyFont(doc);
    doc.fontSize(10).fillColor(COLORS.text);

    let lineY = y + 30;
    for (const line of lines.filter(Boolean)) {
      doc.text(line, x + 14, lineY, { width: width - 28, lineGap: 2 });
      lineY += 16;
    }
  }

  private drawLineItemsTable(doc: PDFKit.PDFDocument, order: InvoiceOrderData) {
    const cols = {
      num: PAGE_LEFT + 6,
      item: PAGE_LEFT + 28,
      sku: PAGE_LEFT + 228,
      qty: PAGE_LEFT + 318,
      price: PAGE_LEFT + 358,
      amount: PAGE_LEFT + 448,
    };
    const priceWidth = 82;
    const amountWidth = 90;

    this.ensureSpace(doc, 60);
    const headerY = doc.y;

    doc.save();
    doc.roundedRect(PAGE_LEFT, headerY, PAGE_WIDTH, 24, 4).fill(COLORS.brand);
    this.setBoldFont(doc);
    doc.fillColor(COLORS.white).fontSize(8);
    doc.text('#', cols.num, headerY + 8);
    doc.text('PRODUCT', cols.item, headerY + 8);
    doc.text('SKU', cols.sku, headerY + 8);
    doc.text('QTY', cols.qty, headerY + 8);
    doc.text('UNIT PRICE', cols.price, headerY + 8, { width: priceWidth, align: 'right' });
    doc.text('AMOUNT', cols.amount, headerY + 8, { width: amountWidth, align: 'right' });
    this.setBodyFont(doc);
    doc.restore();

    let y = headerY + 32;
    let row = 0;

    for (const item of order.items) {
      const rowHeight = 24;
      if (y > PAGE_BOTTOM - 130) {
        doc.addPage();
        y = PAGE_LEFT + 16;
      }

      if (row % 2 === 1) {
        doc.save();
        doc.rect(PAGE_LEFT, y - 5, PAGE_WIDTH, rowHeight).fill('#faf8f5');
        doc.restore();
      }

      const lineTotal = item.unitPrice * item.quantity;
      const title = item.title.length > 34 ? `${item.title.slice(0, 31)}...` : item.title;

      doc.fontSize(9).fillColor(COLORS.muted).text(String(row + 1), cols.num, y);
      doc.fillColor(COLORS.text).text(title, cols.item, y, { width: 190 });
      doc.fillColor(COLORS.muted).fontSize(8).text(item.sku, cols.sku, y + 1, { width: 82 });
      doc.fontSize(9).fillColor(COLORS.text).text(String(item.quantity), cols.qty, y);
      doc.text(this.formatMoney(item.unitPrice, order.currency), cols.price, y, {
        width: priceWidth,
        align: 'right',
      });
      this.setBoldFont(doc);
      doc.text(this.formatMoney(lineTotal, order.currency), cols.amount, y, {
        width: amountWidth,
        align: 'right',
      });
      this.setBodyFont(doc);

      y += rowHeight;
      row += 1;
    }

    doc.moveTo(PAGE_LEFT, y + 2).lineTo(PAGE_RIGHT, y + 2).lineWidth(1).strokeColor(COLORS.border).stroke();
    doc.y = y + 14;
  }

  private drawTotalsPanel(doc: PDFKit.PDFDocument, order: InvoiceOrderData, subtotal: number) {
    this.ensureSpace(doc, 100);

    const panelWidth = 232;
    const panelX = PAGE_RIGHT - panelWidth;
    const top = doc.y;

    doc.save();
    doc.roundedRect(panelX, top, panelWidth, 84, 8).fill(COLORS.surface);
    doc.roundedRect(panelX, top, panelWidth, 84, 8).lineWidth(1).strokeColor(COLORS.border).stroke();
    doc.restore();

    const labelX = panelX + 16;
    const valueWidth = 96;
    const valueX = panelX + panelWidth - valueWidth - 16;
    let y = top + 16;

    doc.fontSize(9).fillColor(COLORS.muted).text('Subtotal', labelX, y);
    doc.fillColor(COLORS.text).text(this.formatMoney(subtotal, order.currency), valueX, y, {
      width: valueWidth,
      align: 'right',
    });

    y += 20;
    doc.moveTo(labelX, y).lineTo(panelX + panelWidth - 16, y).strokeColor(COLORS.border).stroke();

    y += 12;
    this.setBoldFont(doc);
    doc.fontSize(11).fillColor(COLORS.text).text('Grand total', labelX, y);
    doc.fontSize(13).fillColor(COLORS.brand).text(this.formatMoney(order.total, order.currency), valueX, y - 1, {
      width: valueWidth,
      align: 'right',
    });
    this.setBodyFont(doc);

    doc.y = top + 96;
  }

  private drawPaymentPanel(doc: PDFKit.PDFDocument, order: InvoiceOrderData, isPaid: boolean) {
    this.ensureSpace(doc, 78);

    const top = doc.y;
    doc.save();
    doc.roundedRect(PAGE_LEFT, top, PAGE_WIDTH, 64, 8).lineWidth(1).strokeColor(COLORS.border).stroke();
    doc.restore();

    this.setBoldFont(doc);
    doc.fontSize(9).fillColor(COLORS.accent).text('PAYMENT DETAILS', PAGE_LEFT + 14, top + 12);
    this.setBodyFont(doc);

    const method = order.paymentProvider
      ? order.paymentProvider.charAt(0).toUpperCase() + order.paymentProvider.slice(1)
      : isPaid
        ? 'Online payment'
        : 'Pending';

    const leftX = PAGE_LEFT + 14;
    const rightX = PAGE_LEFT + PAGE_WIDTH / 2;

    doc.fontSize(10).fillColor(COLORS.muted).text('Payment method', leftX, top + 30);
    this.setBoldFont(doc);
    doc.fillColor(COLORS.text).text(method, leftX, top + 44);
    this.setBodyFont(doc);

    if (order.paymentId) {
      doc.fontSize(10).fillColor(COLORS.muted).text('Transaction reference', rightX, top + 30);
      doc.fillColor(COLORS.text).text(order.paymentId, rightX, top + 44, { width: PAGE_WIDTH / 2 - 28 });
    } else if (!isPaid) {
      doc.fontSize(10).fillColor(COLORS.muted).text('Payment status', rightX, top + 30);
      this.setBoldFont(doc);
      doc.fillColor(COLORS.pending).text('Not yet received', rightX, top + 44);
      this.setBodyFont(doc);
    } else {
      doc.fontSize(10).fillColor(COLORS.muted).text('Payment status', rightX, top + 30);
      this.setBoldFont(doc);
      doc.fillColor(COLORS.paid).text('Completed', rightX, top + 44);
      this.setBodyFont(doc);
    }

    doc.y = top + 76;
  }

  private drawFooter(doc: PDFKit.PDFDocument, store: InvoiceStoreInfo) {
    this.ensureSpace(doc, 56);

    doc.moveDown(1.2);
    doc.moveTo(PAGE_LEFT, doc.y).lineTo(PAGE_RIGHT, doc.y).strokeColor(COLORS.border).stroke();
    doc.moveDown(0.8);

    doc.fontSize(8).fillColor(COLORS.light).text(
      `Computer-generated invoice from ${store.name}. No signature required.`,
      PAGE_LEFT,
      doc.y,
      { width: PAGE_WIDTH, align: 'center' },
    );
    doc.moveDown(0.35);
    doc.text('Thank you for your purchase.', {
      width: PAGE_WIDTH,
      align: 'center',
    });
  }

  private ensureSpace(doc: PDFKit.PDFDocument, needed: number) {
    if (doc.y + needed > PAGE_BOTTOM) {
      doc.addPage();
      doc.y = PAGE_LEFT;
    }
  }

  private formatWebsite(domain?: string) {
    if (!domain || domain === 'localhost') return '';
    if (domain.includes('://')) return domain.replace(/^https?:\/\//, '');
    return domain;
  }

  private truncateId(id: string) {
    if (id.length <= 22) return id;
    return `${id.slice(0, 10)}...${id.slice(-8)}`;
  }

  private formatStatus(status: string) {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private statusColor(status: string) {
    if (['paid', 'fulfilled', 'shipped', 'delivered'].includes(status)) return COLORS.paid;
    if (['cancelled', 'refunded'].includes(status)) return COLORS.cancelled;
    return COLORS.pending;
  }

  private statusBg(status: string) {
    if (['paid', 'fulfilled', 'shipped', 'delivered'].includes(status)) return COLORS.paidBg;
    if (['cancelled', 'refunded'].includes(status)) return '#fdecec';
    return COLORS.pendingBg;
  }

  private formatMoney(amount: number, currency: string) {
    const code = (currency || 'INR').toUpperCase();

    try {
      const formatted = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: code,
        minimumFractionDigits: 0,
        maximumFractionDigits: code === 'INR' ? 0 : 2,
      }).format(amount);

      // Roboto supports INR symbol; fallback if font ever fails.
      if (code === 'INR' && formatted.includes('\uFFFD')) {
        return `Rs. ${this.formatNumber(amount)}`;
      }

      return formatted;
    } catch {
      return `${code} ${this.formatNumber(amount)}`;
    }
  }

  private formatNumber(amount: number) {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }
}
