/**
 * Validate a FoodFest event's time window.
 *
 * Returns null when valid, or a user-facing error message. Kept pure so the
 * create/update controllers cannot drift apart and the rules are unit-tested.
 */
const parseDate = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

export const validateEventWindow = ({ startTime, endTime, salesStart, salesEnd } = {}) => {
    const start = parseDate(startTime);
    const end = parseDate(endTime);
    const salesFrom = parseDate(salesStart);
    const salesTo = parseDate(salesEnd);

    if (!start || !end || !salesFrom || !salesTo) {
        return 'startTime, endTime, salesStart and salesEnd must be valid dates';
    }
    if (start >= end) {
        return 'startTime must be before endTime';
    }
    if (salesFrom >= salesTo) {
        return 'salesStart must be before salesEnd';
    }
    if (salesTo > end) {
        return 'salesEnd must not be after endTime';
    }
    return null;
};
