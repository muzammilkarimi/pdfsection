// Starter designs for Create PDF. Every piece of text is ordinary editable text;
// square brackets mark what the user should replace.

import { MM, PX, createText, createShape, createPage, cloneDesign, uid } from '@/lib/designModel';
import { DESIGN_VERSION } from '@/lib/designMigrations';

export const TEMPLATE_CATEGORIES = ['Posters', 'Flyers', 'Certificates', 'Invitations', 'Resumes', 'Invoices', 'Menus', 'Social posts'];

const A4 = { width: 210 * MM, height: 297 * MM, unit: 'mm' };
const A4L = { width: 297 * MM, height: 210 * MM, unit: 'mm' };
const A5 = { width: 148 * MM, height: 210 * MM, unit: 'mm' };
const CARD = { width: 5 * 72, height: 7 * 72, unit: 'in' };
const SQUARE = { width: 1080 * PX, height: 1080 * PX, unit: 'px' };

const t = (text, x, y, w, size, props = {}) => createText({ text, x, y, w, size, ...props });
const s = (kind, x, y, w, h, fill, props = {}) => createShape(kind, { x, y, w, h, fill, ...props });
const rule = (x, y, w, stroke, strokeWidth = 1) => createShape('line', { x, y: y - 6, w, stroke, strokeWidth });

function template(id, label, category, sizeLabel, size, background, elements) {
  const page = { ...createPage(background), elements };
  return { id, label, category, sizeLabel, design: { v: DESIGN_VERSION, id: uid(), name: label, ...size, assets: {}, pages: [page] } };
}

const music = template('music-night', 'Music night poster', 'Posters', 'A4', A4, '#1b1f4b', [
  s('ellipse', 280, 76, 420, 420, '#ff7a45'),
  s('ellipse', -56, 324, 196, 196, null, { stroke: '#ffd27a', strokeWidth: 3 }),
  t('CITY ARTS CLUB PRESENTS', 50, 50, 420, 16, { font: 'Inter', bold: true, color: '#ffd27a', letterSpacing: 3 }),
  t('SUMMER\nMUSIC NIGHT', 42, 420, 500, 128, { font: 'Bebas Neue', color: '#ffffff', lineHeight: 0.88 }),
  t('SAT · 14 JUNE · 7 PM', 50, 660, 450, 20, { font: 'Inter', bold: true, color: '#ffd27a', letterSpacing: 1.5 }),
  t('Live bands · Food stalls · Free entry', 50, 694, 450, 16, { font: 'Inter', color: '#d6d8f2' }),
  t('[Venue name, City]', 50, 770, 450, 14, { font: 'Inter', bold: true, color: '#ffffff' }),
]);

const opening = template('grand-opening', 'Grand opening flyer', 'Flyers', 'A5', A5, '#ffd23f', [
  t('NOW OPEN', 30, 30, 360, 11, { font: 'Inter', bold: true, letterSpacing: 2.5 }),
  t('GRAND\nOPENING', 28, 50, 366, 70, { font: 'Inter', bold: true, lineHeight: 0.95, letterSpacing: -1.5 }),
  s('rect', 30, 230, 360, 220, '#141320'),
  t('30% OFF', 30, 300, 360, 62, { font: 'Inter', bold: true, color: '#ffd23f', align: 'center' }),
  t('on everything, this weekend only', 30, 380, 360, 13, { font: 'Inter', color: '#ffffff', align: 'center' }),
  t('[Shop name]', 30, 478, 360, 18, { font: 'Inter', bold: true }),
  t('[Address] · [Phone number]', 30, 504, 360, 12, { font: 'Inter' }),
  s('star', 310, 40, 80, 80, '#141320'),
]);

const certificate = template('certificate', 'Certificate', 'Certificates', 'A4 landscape', A4L, '#fffdf6', [
  s('rect', 24, 24, A4L.width - 48, A4L.height - 48, null, { stroke: '#b08d3c', strokeWidth: 2 }),
  s('rect', 32, 32, A4L.width - 64, A4L.height - 64, null, { stroke: '#b08d3c', strokeWidth: 0.5 }),
  t('Certificate', 60, 90, A4L.width - 120, 62, { font: 'Playfair Display', bold: true, color: '#1b1f4b', align: 'center' }),
  t('OF ACHIEVEMENT', 60, 170, A4L.width - 120, 15, { font: 'Inter', color: '#5f5b73', align: 'center', letterSpacing: 4 }),
  t('This certificate is proudly presented to', 60, 220, A4L.width - 120, 14, { font: 'Inter', color: '#2c2b3d', align: 'center' }),
  t('[Recipient name]', 60, 250, A4L.width - 120, 42, { font: 'Playfair Display', italic: true, align: 'center' }),
  rule(220, 312, A4L.width - 440, '#b08d3c'),
  t('for [reason for the award]', 60, 326, A4L.width - 120, 14, { font: 'Inter', color: '#2c2b3d', align: 'center' }),
  s('ellipse', A4L.width / 2 - 34, 396, 68, 68, '#b08d3c'),
  t('[Date]', 110, 440, 160, 13, { font: 'Inter', align: 'center' }),
  rule(110, 434, 160, '#141320', 0.75),
  t('[Signature]', A4L.width - 270, 440, 160, 13, { font: 'Inter', align: 'center' }),
  rule(A4L.width - 270, 434, 160, '#141320', 0.75),
]);

const wedding = template('wedding', 'Wedding invitation', 'Invitations', '5 × 7 in', CARD, '#f7f1e8', [
  s('rect', 18, 18, CARD.width - 36, CARD.height - 36, null, { stroke: '#7a5c3a', strokeWidth: 0.75 }),
  t('TOGETHER WITH THEIR FAMILIES', 30, 110, CARD.width - 60, 9, { font: 'Inter', color: '#7a5c3a', align: 'center', letterSpacing: 2.5 }),
  t('[Name]\n& [Name]', 30, 150, CARD.width - 60, 46, { font: 'Playfair Display', italic: true, color: '#3d2b1f', align: 'center', lineHeight: 1.1 }),
  rule(CARD.width / 2 - 30, 280, 60, '#7a5c3a'),
  t('request the pleasure of your company', 30, 298, CARD.width - 60, 11, { font: 'Inter', color: '#3d2b1f', align: 'center' }),
  t('[Day, Date]\n[Venue, City]', 30, 334, CARD.width - 60, 13, { font: 'Lora', color: '#3d2b1f', align: 'center', lineHeight: 1.6 }),
]);

const resumeSide = '#1b1f4b';
const resume = template('resume', 'Modern resume', 'Resumes', 'A4', A4, '#ffffff', [
  s('rect', 0, 0, 190, A4.height, resumeSide),
  s('ellipse', 45, 40, 100, 100, '#8a93e6'),
  t('CONTACT', 28, 170, 140, 11, { font: 'Inter', bold: true, color: '#c7cbf5', letterSpacing: 1.5 }),
  t('[Phone]\n[Email]\n[City]', 28, 192, 140, 11, { font: 'Inter', color: '#ffffff', lineHeight: 1.7 }),
  t('SKILLS', 28, 280, 140, 11, { font: 'Inter', bold: true, color: '#c7cbf5', letterSpacing: 1.5 }),
  t('[Skill one]\n[Skill two]\n[Skill three]\n[Skill four]', 28, 302, 140, 11, { font: 'Inter', color: '#ffffff', lineHeight: 1.7 }),
  t('LANGUAGES', 28, 410, 140, 11, { font: 'Inter', bold: true, color: '#c7cbf5', letterSpacing: 1.5 }),
  t('[Language]\n[Language]', 28, 432, 140, 11, { font: 'Inter', color: '#ffffff', lineHeight: 1.7 }),
  t('[Your Name]', 220, 44, 340, 34, { font: 'Inter', bold: true }),
  t('[JOB TITLE]', 220, 88, 340, 12, { font: 'Inter', bold: true, color: '#5e6ad2', letterSpacing: 2 }),
  t('[Two or three lines about who you are and what you are good at.]', 220, 116, 340, 11, { font: 'Inter', color: '#2c2b3d', lineHeight: 1.5 }),
  t('EXPERIENCE', 220, 180, 340, 12, { font: 'Inter', bold: true, letterSpacing: 1.5 }),
  rule(220, 200, 345, '#cfcbdd'),
  t('[Job title], [Company]', 220, 212, 340, 12, { font: 'Inter', bold: true }),
  t('[Start] to [End]', 220, 230, 340, 10, { font: 'Inter', color: '#5f5b73' }),
  t('[What you did and the result it had.]', 220, 248, 340, 11, { font: 'Inter', color: '#2c2b3d', lineHeight: 1.5 }),
  t('[Job title], [Company]', 220, 292, 340, 12, { font: 'Inter', bold: true }),
  t('[Start] to [End]', 220, 310, 340, 10, { font: 'Inter', color: '#5f5b73' }),
  t('[What you did and the result it had.]', 220, 328, 340, 11, { font: 'Inter', color: '#2c2b3d', lineHeight: 1.5 }),
  t('EDUCATION', 220, 390, 340, 12, { font: 'Inter', bold: true, letterSpacing: 1.5 }),
  rule(220, 410, 345, '#cfcbdd'),
  t('[Degree], [College]', 220, 422, 340, 12, { font: 'Inter', bold: true }),
  t('[Year]', 220, 440, 340, 10, { font: 'Inter', color: '#5f5b73' }),
]);

const green = '#00875a';
const invoiceRow = (y, item) => [
  t(item, 44, y, 300, 12, { font: 'Inter' }),
  t('[Qty]', 350, y, 60, 12, { font: 'Inter', align: 'right' }),
  t('[Price]', 420, y, 60, 12, { font: 'Inter', align: 'right' }),
  t('[Total]', 490, y, 60, 12, { font: 'Inter', align: 'right' }),
  rule(36, y + 24, A4.width - 72, '#e4e2ec', 0.75),
];
const invoice = template('invoice', 'Simple invoice', 'Invoices', 'A4', A4, '#ffffff', [
  t('INVOICE', 36, 40, 300, 34, { font: 'Inter', bold: true, color: green }),
  t('[Your business name]\n[Address]\n[Phone · Email]', 340, 44, A4.width - 376, 11, { font: 'Inter', align: 'right', lineHeight: 1.5 }),
  t('BILL TO', 36, 130, 200, 10, { font: 'Inter', bold: true, color: '#5f5b73', letterSpacing: 1 }),
  t('[Customer name]\n[Customer address]', 36, 146, 280, 12, { font: 'Inter', lineHeight: 1.5 }),
  t('Invoice no: [Number]\nDate: [Date]\nDue: [Date]', 340, 130, A4.width - 376, 11, { font: 'Inter', align: 'right', lineHeight: 1.6 }),
  s('rect', 36, 220, A4.width - 72, 28, green),
  t('Item', 44, 227, 300, 12, { font: 'Inter', bold: true, color: '#ffffff' }),
  t('Qty', 350, 227, 60, 12, { font: 'Inter', bold: true, color: '#ffffff', align: 'right' }),
  t('Price', 420, 227, 60, 12, { font: 'Inter', bold: true, color: '#ffffff', align: 'right' }),
  t('Total', 490, 227, 60, 12, { font: 'Inter', bold: true, color: '#ffffff', align: 'right' }),
  ...invoiceRow(262, '[Item or service]'),
  ...invoiceRow(294, '[Item or service]'),
  ...invoiceRow(326, '[Item or service]'),
  s('rect', 350, 370, A4.width - 386, 34, '#dff3ea'),
  t('Total due', 360, 379, 90, 13, { font: 'Inter', bold: true }),
  t('[Amount]', 450, 379, A4.width - 496, 13, { font: 'Inter', bold: true, align: 'right' }),
  t('Thank you for your business.\nPayment details: [Bank or UPI details]', 36, 760, A4.width - 72, 11, { font: 'Inter', color: '#5f5b73', lineHeight: 1.5 }),
]);

const menuRow = (y, name) => [
  t(name, 70, y, 340, 15, { font: 'Lora', color: '#f3e9d7' }),
  t('[Price]', 420, y, 105, 15, { font: 'Lora', color: '#f3e9d7', align: 'right' }),
];
const menu = template('menu', 'Restaurant menu', 'Menus', 'A4', A4, '#22201d', [
  t('Menu', 40, 60, A4.width - 80, 76, { font: 'Playfair Display', bold: true, color: '#f3e9d7', align: 'center' }),
  t('[RESTAURANT NAME]', 40, 160, A4.width - 80, 11, { font: 'Inter', color: '#d9a35b', align: 'center', letterSpacing: 3 }),
  t('STARTERS', 40, 220, A4.width - 80, 13, { font: 'Inter', bold: true, color: '#d9a35b', align: 'center', letterSpacing: 4 }),
  ...menuRow(256, 'Paneer tikka'),
  ...menuRow(290, 'Tomato soup'),
  ...menuRow(324, 'Crispy corn'),
  t('MAINS', 40, 390, A4.width - 80, 13, { font: 'Inter', bold: true, color: '#d9a35b', align: 'center', letterSpacing: 4 }),
  ...menuRow(426, 'Dal makhani'),
  ...menuRow(460, 'Veg biryani'),
  ...menuRow(494, 'Butter naan'),
  t('DESSERTS', 40, 560, A4.width - 80, 13, { font: 'Inter', bold: true, color: '#d9a35b', align: 'center', letterSpacing: 4 }),
  ...menuRow(596, 'Gulab jamun'),
  ...menuRow(630, 'Kulfi'),
  t('[Address] · [Phone number]', 40, 770, A4.width - 80, 11, { font: 'Inter', color: '#d9c9ad', align: 'center' }),
]);

const event = template('event-post', 'Event post', 'Social posts', '1080 × 1080', SQUARE, '#5e6ad2', [
  t('FREE WEBINAR', 60, 60, 600, 24, { font: 'Inter', bold: true, color: '#ffffff', letterSpacing: 4 }),
  t('How to grow a local business', 60, 220, 680, 92, { font: 'Inter', bold: true, color: '#ffffff', lineHeight: 1.05, letterSpacing: -2 }),
  t('[Date · Time]', 60, 700, 400, 26, { font: 'Inter', color: '#ffffff' }),
  s('rounded', 530, 680, 210, 64, '#ffffff', { radius: 32 }),
  t('Register', 530, 696, 210, 26, { font: 'Inter', bold: true, align: 'center' }),
]);

export const TEMPLATES = [music, opening, certificate, wedding, resume, invoice, menu, event];

/** A fresh, independent copy of a template's design. */
export const designFromTemplate = (tpl) => cloneDesign(tpl.design);
