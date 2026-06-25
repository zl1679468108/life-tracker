import { generateBarcodeText, validateBarcode } from '../lib/barcode';

describe('barcode utils', () => {
  it('returns the same text for generated barcode', () => {
    expect(generateBarcodeText('1234567890123')).toBe('1234567890123');
  });

  it('accepts common numeric barcode lengths', () => {
    expect(validateBarcode('12345678')).toBe(true);
    expect(validateBarcode('123456789012')).toBe(true);
    expect(validateBarcode('1234567890123')).toBe(true);
    expect(validateBarcode('12345678901234')).toBe(true);
  });

  it('rejects invalid barcode input', () => {
    expect(validateBarcode('')).toBe(false);
    expect(validateBarcode('   ')).toBe(false);
    expect(validateBarcode('123')).toBe(false);
  });
});
