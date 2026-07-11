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

// Serif for brand + section headers, sans for body, mono for figures/IDs.
const FONT_SERIF = 'InvoiceSerif';
const FONT_BODY = 'InvoiceBody';
const FONT_BOLD = 'InvoiceBold';
const FONT_MONO = 'InvoiceMono';
const FONT_MONO_SB = 'InvoiceMonoSemi';

const COLORS = {
  brand: '#4B3621',
  brandDark: '#3a2a19',
  brandLight: '#5c4530',
  accent: '#7A8F6B',
  gold: '#c4a962',
  text: '#1a1816',
  muted: '#6b6b6b',
  light: '#9a978f',
  border: '#e5e3de',
  surface: '#f7f5f0',
  zebra: '#faf8f5',
  white: '#ffffff',
  paid: '#2d6a4f',
  paidBg: '#e8f5ee',
  pending: '#b8860b',
  pendingBg: '#fef9ec',
  cancelled: '#9b2c2c',
  cancelledBg: '#fdecec',
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

      this.setBody(doc);
      this.drawHeaderBand(doc, store);
      this.drawTitleRow(doc, isPaid ? 'Tax Invoice' : 'Order Summary');
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
        statusSolid: this.statusSolid(order.status),
      });

      this.drawAddressRow(doc, order);
      this.drawLineItemsTable(doc, order);
      this.drawTotalsPanel(doc, order, subtotal, currency);
      this.drawPaymentPanel(doc, order, isPaid);
      this.drawFooter(doc, store);

      doc.end();
    });
  }

  // ---- fonts -------------------------------------------------------------

  private registerFonts(doc: PDFKit.PDFDocument) {
    const fontsDir = path.join(__dirname, 'fonts');
    doc.registerFont(FONT_BODY, path.join(fontsDir, 'Roboto-Regular.ttf'));
    doc.registerFont(FONT_BOLD, path.join(fontsDir, 'Roboto-Bold.ttf'));
    doc.registerFont(FONT_SERIF, path.join(fontsDir, 'IBMPlexSerif-SemiBold.ttf'));
    doc.registerFont(FONT_MONO, path.join(fontsDir, 'IBMPlexMono-Regular.ttf'));
    doc.registerFont(FONT_MONO_SB, path.join(fontsDir, 'IBMPlexMono-SemiBold.ttf'));
    this.setBody(doc);
  }

  private setBody(doc: PDFKit.PDFDocument) {
    doc.font(FONT_BODY);
  }
  private setBold(doc: PDFKit.PDFDocument) {
    doc.font(FONT_BOLD);
  }
  private setSerif(doc: PDFKit.PDFDocument) {
    doc.font(FONT_SERIF);
  }
  private setMono(doc: PDFKit.PDFDocument) {
    doc.font(FONT_MONO);
  }
  private setMonoSemi(doc: PDFKit.PDFDocument) {
    doc.font(FONT_MONO_SB);
  }

  // ---- header ------------------------------------------------------------

  private drawHeaderBand(doc: PDFKit.PDFDocument, store: InvoiceStoreInfo) {
    const bandHeight = 80;
    const website = this.formatWebsite(store.website);

    doc.save();
    const grad = doc.linearGradient(0, 0, 595, bandHeight);
    grad.stop(0, COLORS.brandDark).stop(0.55, COLORS.brand).stop(1, COLORS.brandLight);
    doc.rect(0, 0, 595, bandHeight).fill(grad);
    // thin gold hairline under the band
    doc.rect(0, bandHeight, 595, 2).fill(COLORS.gold);

    this.setSerif(doc);
    doc.fillColor(COLORS.white).fontSize(23).text(store.name, PAGE_LEFT, 18, { width: 380 });

    this.setBody(doc);
    if (store.tagline) {
      doc
        .fontSize(9)
        .fillColor('#d8d2c6')
        .text(store.tagline, PAGE_LEFT, 50, { width: 380, lineGap: 2 });
    }
    if (website) {
      doc
        .fontSize(8.5)
        .fillColor(COLORS.gold)
        .text(website, PAGE_LEFT, store.tagline ? 66 : 52, { width: 380 });
    }
    doc.restore();
    doc.y = 104;
  }

  private drawTitleRow(doc: PDFKit.PDFDocument, title: string) {
    this.setSerif(doc);
    doc.fontSize(21).fillColor(COLORS.text).text(title, PAGE_LEFT, doc.y);
    this.setBody(doc);
    doc.y += 30;
  }

  // ---- meta panel --------------------------------------------------------

  private drawMetaPanel(
    doc: PDFKit.PDFDocument,
    meta: {
      invoiceNo: string;
      orderId: string;
      date: string;
      status: string;
      statusColor: string;
      statusBg: string;
      statusSolid: boolean;
    },
  ) {
    const top = doc.y;
    const panelHeight = 82;
    const midX = PAGE_LEFT + PAGE_WIDTH / 2;
    const leftX = PAGE_LEFT + 18;
    const rightX = midX + 18;
    const colWidth = PAGE_WIDTH / 2 - 34;

    doc.save();
    doc.roundedRect(PAGE_LEFT, top, PAGE_WIDTH, panelHeight, 10).fill(COLORS.surface);
    doc.restore();

    // vertical rule grouping the 2x2 grid
    doc.save();
    doc
      .moveTo(midX, top + 16)
      .lineTo(midX, top + panelHeight - 16)
      .lineWidth(1)
      .strokeColor(COLORS.border)
      .stroke();
    doc.restore();

    const labelY1 = top + 16;
    const valueY1 = top + 29;
    const rowGap = 40;

    this.drawMetaField(doc, 'Invoice Number', meta.invoiceNo, leftX, labelY1, valueY1, colWidth, FONT_MONO_SB);
    this.drawMetaField(doc, 'Order Date', meta.date, rightX, labelY1, valueY1, colWidth, FONT_BODY);
    this.drawMetaField(doc, 'Order ID', meta.orderId, leftX, labelY1 + rowGap, valueY1 + rowGap, colWidth, FONT_MONO);

    // status
    this.drawLabel(doc, 'Status', rightX, labelY1 + rowGap, colWidth);
    this.drawStatusBadge(doc, meta.status, meta.statusColor, meta.statusBg, meta.statusSolid, rightX, valueY1 + rowGap - 3);

    doc.y = top + panelHeight + 26;
  }

  private drawLabel(doc: PDFKit.PDFDocument, label: string, x: number, y: number, width: number) {
    this.setBold(doc);
    doc
      .fontSize(7.5)
      .fillColor(COLORS.light)
      .text(label.toUpperCase(), x, y, { width, characterSpacing: 0.6 });
    this.setBody(doc);
  }

  private drawMetaField(
    doc: PDFKit.PDFDocument,
    label: string,
    value: string,
    x: number,
    labelY: number,
    valueY: number,
    width: number,
    valueFont: string,
  ) {
    this.drawLabel(doc, label, x, labelY, width);
    doc.font(valueFont);
    doc.fontSize(10.5).fillColor(COLORS.text).text(value, x, valueY, { width, lineBreak: false });
    this.setBody(doc);
  }

  private drawStatusBadge(
    doc: PDFKit.PDFDocument,
    label: string,
    color: string,
    bg: string,
    solid: boolean,
    x: number,
    y: number,
  ) {
    this.setBold(doc);
    doc.fontSize(8.5);
    const textWidth = doc.widthOfString(label);
    const badgeWidth = textWidth + 24; // 12px padding each side
    const badgeHeight = 19;

    doc.save();
    if (solid) {
      doc.roundedRect(x, y, badgeWidth, badgeHeight, badgeHeight / 2).fill(color);
      doc.fillColor(COLORS.white);
    } else {
      doc.roundedRect(x, y, badgeWidth, badgeHeight, badgeHeight / 2).fill(bg);
      doc
        .roundedRect(x, y, badgeWidth, badgeHeight, badgeHeight / 2)
        .lineWidth(1)
        .strokeColor(color)
        .stroke();
      doc.fillColor(color);
    }
    doc.text(label, x + 12, y + (badgeHeight - 8.5) / 2 - 0.5, {
      width: badgeWidth - 24,
      align: 'center',
      lineBreak: false,
    });
    doc.restore();
    this.setBody(doc);
  }

  // ---- addresses ---------------------------------------------------------

  private drawAddressRow(doc: PDFKit.PDFDocument, order: InvoiceOrderData) {
    const top = doc.y;
    const gap = 16;
    const boxWidth = (PAGE_WIDTH - gap) / 2;
    const boxHeight = 96;

    this.drawAddressBox(doc, 'Bill To', 'person', PAGE_LEFT, top, boxWidth, boxHeight, [
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

    this.drawAddressBox(doc, 'Ship To', 'pin', PAGE_LEFT + boxWidth + gap, top, boxWidth, boxHeight, shipLines);

    doc.y = top + boxHeight + 26;
  }

  private drawAddressBox(
    doc: PDFKit.PDFDocument,
    title: string,
    icon: 'person' | 'pin',
    x: number,
    y: number,
    width: number,
    height: number,
    lines: string[],
  ) {
    const padX = 16;
    doc.save();
    doc.roundedRect(x, y, width, height, 10).lineWidth(1).strokeColor(COLORS.border).stroke();
    doc.restore();

    // heading with icon
    if (icon === 'person') this.drawPersonIcon(doc, x + padX, y + 14, COLORS.accent);
    else this.drawPinIcon(doc, x + padX, y + 14, COLORS.accent);

    this.setBold(doc);
    doc
      .fontSize(9)
      .fillColor(COLORS.accent)
      .text(title.toUpperCase(), x + padX + 16, y + 15, { width: width - padX - 16, characterSpacing: 0.6 });

    this.setBody(doc);
    doc.fontSize(9.5).fillColor(COLORS.text);

    let lineY = y + 38;
    for (const line of lines.filter(Boolean)) {
      doc.text(line, x + padX, lineY, { width: width - padX * 2, lineGap: 4 });
      lineY = doc.y + 4;
    }
  }

  private drawPersonIcon(doc: PDFKit.PDFDocument, x: number, y: number, color: string) {
    doc.save();
    doc.fillColor(color);
    doc.circle(x + 5, y + 3, 2.6).fill();
    doc
      .moveTo(x, y + 12)
      .quadraticCurveTo(x, y + 7, x + 5, y + 7)
      .quadraticCurveTo(x + 10, y + 7, x + 10, y + 12)
      .lineTo(x, y + 12)
      .fill();
    doc.restore();
  }

  private drawPinIcon(doc: PDFKit.PDFDocument, x: number, y: number, color: string) {
    doc.save();
    doc.fillColor(color);
    doc.circle(x + 5, y + 4, 3.4).fill();
    doc
      .moveTo(x + 1.7, y + 6)
      .lineTo(x + 8.3, y + 6)
      .lineTo(x + 5, y + 12)
      .fill();
    doc.fillColor(COLORS.white).circle(x + 5, y + 4, 1.3).fill();
    doc.restore();
  }

  // ---- line items --------------------------------------------------------

  private drawLineItemsTable(doc: PDFKit.PDFDocument, order: InvoiceOrderData) {
    const cols = {
      num: PAGE_LEFT + 10,
      item: PAGE_LEFT + 30,
      sku: PAGE_LEFT + 232,
      qty: PAGE_LEFT + 300,
      price: PAGE_LEFT + 345,
      amount: PAGE_LEFT + 420,
    };
    const itemWidth = 196;
    const skuWidth = 66;
    const qtyWidth = 40;
    const priceWidth = 72;
    const amountWidth = 79;
    const headerHeight = 26;
    const rowHeight = 28;

    this.ensureSpace(doc, 70);
    const headerY = doc.y;

    doc.save();
    doc.roundedRect(PAGE_LEFT, headerY, PAGE_WIDTH, headerHeight, 5).fill(COLORS.brand);
    this.setBold(doc);
    doc.fillColor(COLORS.white).fontSize(8);
    const hy = headerY + 9;
    doc.text('#', cols.num, hy, { characterSpacing: 0.4 });
    doc.text('PRODUCT', cols.item, hy, { characterSpacing: 0.4 });
    doc.text('SKU', cols.sku, hy, { characterSpacing: 0.4 });
    doc.text('QTY', cols.qty, hy, { width: qtyWidth, align: 'right', characterSpacing: 0.4 });
    doc.text('UNIT PRICE', cols.price, hy, { width: priceWidth, align: 'right', characterSpacing: 0.4 });
    doc.text('AMOUNT', cols.amount, hy, { width: amountWidth, align: 'right', characterSpacing: 0.4 });
    this.setBody(doc);
    doc.restore();

    let y = headerY + headerHeight;
    let row = 0;

    for (const item of order.items) {
      if (y + rowHeight > PAGE_BOTTOM - 130) {
        doc.addPage();
        y = PAGE_LEFT + 16;
      }

      if (row % 2 === 1) {
        doc.save();
        doc.rect(PAGE_LEFT, y, PAGE_WIDTH, rowHeight).fill(COLORS.zebra);
        doc.restore();
      }

      const lineTotal = item.unitPrice * item.quantity;
      const title = item.title.length > 36 ? `${item.title.slice(0, 33)}...` : item.title;
      const textY = y + 9;

      this.setMono(doc);
      doc.fontSize(8.5).fillColor(COLORS.light).text(String(row + 1), cols.num, textY);

      this.setBody(doc);
      doc.fontSize(9.5).fillColor(COLORS.text).text(title, cols.item, textY, { width: itemWidth, lineBreak: false });

      this.setMono(doc);
      doc.fontSize(8).fillColor(COLORS.muted).text(item.sku, cols.sku, textY + 0.5, { width: skuWidth, lineBreak: false });

      doc.fontSize(9).fillColor(COLORS.text).text(String(item.quantity), cols.qty, textY, {
        width: qtyWidth,
        align: 'right',
      });
      doc.text(this.formatMoney(item.unitPrice, order.currency), cols.price, textY, {
        width: priceWidth,
        align: 'right',
      });
      this.setMonoSemi(doc);
      doc.fillColor(COLORS.text).text(this.formatMoney(lineTotal, order.currency), cols.amount, textY, {
        width: amountWidth,
        align: 'right',
      });
      this.setBody(doc);

      // thin row divider
      doc.save();
      doc
        .moveTo(PAGE_LEFT, y + rowHeight)
        .lineTo(PAGE_RIGHT, y + rowHeight)
        .lineWidth(0.5)
        .strokeColor(COLORS.border)
        .stroke();
      doc.restore();

      y += rowHeight;
      row += 1;
    }

    doc.y = y + 24;
  }

  // ---- totals ------------------------------------------------------------

  private drawTotalsPanel(
    doc: PDFKit.PDFDocument,
    order: InvoiceOrderData,
    subtotal: number,
    currency: string,
  ) {
    this.ensureSpace(doc, 110);

    const panelWidth = 250;
    const panelX = PAGE_RIGHT - panelWidth;
    const top = doc.y;
    const labelX = panelX + 4;
    const valueWidth = 110;
    const valueX = panelX + panelWidth - valueWidth;

    // left-side note fills the empty space and keeps the "amounts in" note near totals
    this.setBody(doc);
    doc.fontSize(8.5).fillColor(COLORS.light).text(
      `All amounts shown in ${currency}. Taxes included where applicable.`,
      PAGE_LEFT,
      top + 4,
      { width: panelX - PAGE_LEFT - 24, lineGap: 3 },
    );

    // subtotal
    doc.fontSize(9.5).fillColor(COLORS.muted).text('Subtotal', labelX, top + 4);
    this.setMono(doc);
    doc.fillColor(COLORS.text).text(this.formatMoney(subtotal, order.currency), valueX, top + 4, {
      width: valueWidth,
      align: 'right',
    });
    this.setBody(doc);

    // grand total — colored strip for strong visual weight
    const bandY = top + 26;
    const bandHeight = 36;
    doc.save();
    const grad = doc.linearGradient(panelX, bandY, panelX + panelWidth, bandY);
    grad.stop(0, COLORS.brand).stop(1, COLORS.brandLight);
    doc.roundedRect(panelX, bandY, panelWidth, bandHeight, 8).fill(grad);
    doc.restore();

    this.setSerif(doc);
    doc.fontSize(12).fillColor(COLORS.white).text('Grand Total', labelX + 12, bandY + 12);
    this.setMonoSemi(doc);
    doc.fontSize(14).fillColor(COLORS.white).text(this.formatMoney(order.total, order.currency), valueX - 12, bandY + 10, {
      width: valueWidth,
      align: 'right',
    });
    this.setBody(doc);

    doc.y = bandY + bandHeight + 26;
  }

  // ---- payment -----------------------------------------------------------

  private drawPaymentPanel(doc: PDFKit.PDFDocument, order: InvoiceOrderData, isPaid: boolean) {
    this.ensureSpace(doc, 82);

    const top = doc.y;
    const height = 68;
    doc.save();
    doc.roundedRect(PAGE_LEFT, top, PAGE_WIDTH, height, 10).lineWidth(1).strokeColor(COLORS.border).stroke();
    doc.restore();

    this.setBold(doc);
    doc
      .fontSize(9)
      .fillColor(COLORS.accent)
      .text('PAYMENT DETAILS', PAGE_LEFT + 16, top + 14, { characterSpacing: 0.6 });
    this.setBody(doc);

    const method = order.paymentProvider
      ? order.paymentProvider.charAt(0).toUpperCase() + order.paymentProvider.slice(1)
      : isPaid
        ? 'Online payment'
        : 'Pending';

    const leftX = PAGE_LEFT + 16;
    const rightX = PAGE_LEFT + PAGE_WIDTH / 2 + 8;

    // payment method with a small card icon
    this.drawLabel(doc, 'Payment Method', leftX, top + 34, PAGE_WIDTH / 2 - 24);
    this.drawCardIcon(doc, leftX, top + 47, COLORS.accent);
    this.setBold(doc);
    doc.fontSize(10).fillColor(COLORS.text).text(method, leftX + 26, top + 47, { width: PAGE_WIDTH / 2 - 50 });
    this.setBody(doc);

    if (order.paymentId) {
      this.drawLabel(doc, 'Transaction Reference', rightX, top + 34, PAGE_WIDTH / 2 - 24);
      this.setMono(doc);
      doc
        .fontSize(9)
        .fillColor(COLORS.text)
        .text(order.paymentId, rightX, top + 47, { width: PAGE_WIDTH / 2 - 24, lineBreak: false });
      this.setBody(doc);
    } else {
      this.drawLabel(doc, 'Payment Status', rightX, top + 34, PAGE_WIDTH / 2 - 24);
      this.setBold(doc);
      doc
        .fontSize(10)
        .fillColor(isPaid ? COLORS.paid : COLORS.pending)
        .text(isPaid ? 'Completed' : 'Not yet received', rightX, top + 47);
      this.setBody(doc);
    }

    doc.y = top + height + 24;
  }

  private drawCardIcon(doc: PDFKit.PDFDocument, x: number, y: number, color: string) {
    doc.save();
    doc.roundedRect(x, y, 18, 12, 2).lineWidth(1).strokeColor(color).stroke();
    doc.rect(x, y + 3, 18, 3).fill(color);
    doc.restore();
  }

  // ---- footer ------------------------------------------------------------

  private drawFooter(doc: PDFKit.PDFDocument, store: InvoiceStoreInfo) {
    this.ensureSpace(doc, 70);

    const website = this.formatWebsite(store.website);
    const support = website ? `${website}` : 'hello@terraliving.com';

    doc.moveDown(0.5);
    doc
      .moveTo(PAGE_LEFT, doc.y)
      .lineTo(PAGE_RIGHT, doc.y)
      .lineWidth(1)
      .strokeColor(COLORS.border)
      .stroke();
    doc.moveDown(0.9);

    this.setSerif(doc);
    doc
      .fontSize(12)
      .fillColor(COLORS.brand)
      .text(`Thank you for shopping with ${store.name}`, PAGE_LEFT, doc.y, {
        width: PAGE_WIDTH,
        align: 'center',
      });

    this.setBody(doc);
    doc.moveDown(0.4);
    doc
      .fontSize(8.5)
      .fillColor(COLORS.muted)
      .text(`Questions about your order? Reach us at ${support}`, {
        width: PAGE_WIDTH,
        align: 'center',
      });
    doc.moveDown(0.25);
    doc
      .fontSize(7.5)
      .fillColor(COLORS.light)
      .text(`Computer-generated invoice from ${store.name}. No signature required.`, {
        width: PAGE_WIDTH,
        align: 'center',
      });
  }

  // ---- helpers -----------------------------------------------------------

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
    if (['cancelled', 'refunded'].includes(status)) return COLORS.cancelledBg;
    return COLORS.pendingBg;
  }

  // Solid (filled) badge for success/terminal states; outlined for pending.
  private statusSolid(status: string) {
    return (
      ['paid', 'fulfilled', 'shipped', 'delivered'].includes(status) ||
      ['cancelled', 'refunded'].includes(status)
    );
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
