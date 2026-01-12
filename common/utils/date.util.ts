export class DateUtil {
  static getStartOfDay(date: Date = new Date()): Date {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  }

  static getEndOfDay(date: Date = new Date()): Date {
    const newDate = new Date(date);
    newDate.setHours(23, 59, 59, 999);
    return newDate;
  }

  static getStartOfMonth(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  static getEndOfMonth(date: Date = new Date()): Date {
    return new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
  }

  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  static addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  static formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day);
  }
}
