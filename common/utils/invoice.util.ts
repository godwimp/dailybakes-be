export class InvoiceUtil {
  static async generateInvoiceNumber(
    prefix: string,
    getCountFn: () => Promise<number>,
  ): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const dateStr = `${year}${month}${day}`;
    const count = await getCountFn();
    const sequence = String(count + 1).padStart(4, '0');

    return `${prefix}/${dateStr}/${sequence}`;
  }

  static parseInvoiceNumber(invoiceNumber: string): {
    prefix: string;
    date: string;
    sequence: string;
  } {
    const parts = invoiceNumber.split('/');
    return {
      prefix: parts[0],
      date: parts[1],
      sequence: parts[2],
    };
  }
}
