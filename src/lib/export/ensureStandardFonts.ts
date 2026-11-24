import fs from 'fs';
import path from 'path';

/**
 * Ensures standard PDFKit fonts (Helvetica, Times-Roman, Courier, etc.) are traced
 * and packaged into Vercel Serverless Function bundles.
 * 
 * Vercel's Node File Trace (NFT) statically evaluates top-level fs.readdirSync to detect
 * and bundle all assets in the target directory including .cjs files and chunks.
 * Note: Kept strictly standard JavaScript without type annotations so Acorn AST parser
 * doesn't abort traversal during Vercel NFT bundling.
 */
try {
  // Explicit top-level static evaluation for NFT AST analyzer
  fs.readdirSync(path.join(process.cwd(), 'node_modules/pdfkit/js/standard-fonts'));
} catch (e) {
  // Graceful fallback for environments where directory is virtualized
}

export function ensureStandardFonts() {
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
  } catch (e) {
    // Graceful fallback for non-Node environments
  }
}

// Execute immediately when imported on server
ensureStandardFonts();
