/**
 * يحول التاريخ من YYYY-MM-DD إلى DD-MM-YYYY
 */
export const formatDateDisplay = (
    dateString: string | null | undefined,
): string => {
    if (!dateString) {
        return '';
    }

    // إيلا كان التاريخ فيه الوقت (DateTime)، غانخدو غير الجزء الأول
    const pureDate = dateString.split('T')[0];
    const [year, month, day] = pureDate.split('-');

    if (!year || !month || !day) {
        return dateString; // رجع الأصل إيلا كان شي غلط فالفورما
    }

    return `${day}-${month}-${year}`;
};
