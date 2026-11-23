/**
 * Ensures standard PDFKit fonts (Helvetica, Times-Roman, Courier, etc.) are traced
 * and packaged into Vercel Serverless Function bundles.
 * 
 * Vercel's Node File Trace (NFT) strips non-statically imported files by default.
 * These static imports guarantee that standard-fonts/*.cjs are bundled on AWS Lambda.
 */
export function ensureStandardFonts(): void {
  try {
    require('pdfkit/standard-fonts/Helvetica');
    require('pdfkit/standard-fonts/HelveticaBold');
    require('pdfkit/standard-fonts/HelveticaOblique');
    require('pdfkit/standard-fonts/HelveticaBoldOblique');
    require('pdfkit/standard-fonts/TimesRoman');
    require('pdfkit/standard-fonts/TimesBold');
    require('pdfkit/standard-fonts/TimesItalic');
    require('pdfkit/standard-fonts/TimesBoldItalic');
    require('pdfkit/standard-fonts/Courier');
    require('pdfkit/standard-fonts/CourierBold');
    require('pdfkit/standard-fonts/Symbol');
    require('pdfkit/standard-fonts/ZapfDingbats');
  } catch {
    // Graceful fallback for non-Node environments
  }
}

// Execute immediately when imported on server
ensureStandardFonts();
