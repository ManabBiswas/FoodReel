/**
 * Sort-parameter allowlist.
 *
 * A sort field taken straight from the query string becomes a key in a Mongo
 * sort document. Anything starting with `$` is a server-side operator, not a
 * field, so `?sortBy=$where` reaches the driver as an operator and the query
 * fails — a public endpoint returning 500 on a crafted URL. An allowlist closes
 * it: an unknown field falls back to the default instead of reaching the driver.
 */

const OPERATOR = /^\$/;

/**
 * @param {object}  options
 * @param {string}  options.sortBy      raw, untrusted value from the query
 * @param {string}  options.sortOrder   raw direction from the query
 * @param {string[]} options.allowed    field names this endpoint may sort by
 * @param {string}  options.defaultField
 * @param {'asc'|'desc'} options.defaultOrder
 * @returns {{sort: object, sortBy: string, sortOrder: 'asc'|'desc', rejected: boolean}}
 */
export const resolveSort = ({
    sortBy,
    sortOrder,
    allowed = [],
    defaultField = 'createdAt',
    defaultOrder = 'desc',
}) => {
    const requested = typeof sortBy === 'string' ? sortBy.trim() : '';
    const rejected = !requested || !allowed.includes(requested) || OPERATOR.test(requested);
    const field = rejected ? defaultField : requested;

    const direction =
        String(sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';
    const order = rejected && sortOrder === undefined ? defaultOrder : direction;

    return {
        sort: { [field]: order === 'asc' ? 1 : -1 },
        sortBy: field,
        sortOrder: order,
        rejected,
    };
};

/** Sort fields the public food feed may use. */
export const FOOD_SORT_FIELDS = [
    'createdAt',
    'price',
    'name',
    'trendingScore',
    'totalLikes',
    'averageRating',
];
