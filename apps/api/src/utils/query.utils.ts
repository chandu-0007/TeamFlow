/**
 * TeamFlow Query Utilities: Pagination, Sorting & Filtering
 * Standardized across all controller listing endpoints.
 */

export interface PaginationParams {
    page: number;
    limit: number;
    skip: number;
    take: number;
}

export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    count: number;
}

/**
 * Parses and bounds page and limit query parameters.
 * - Defaults to page 1, limit 20 (or custom default)
 * - Maximum limit capped at maxLimit (default 100) to protect against DoS
 */
export function parsePagination(
    queryPage: unknown,
    queryLimit: unknown,
    defaultLimit = 20,
    maxLimit = 100
): PaginationParams {
    const page = Math.max(1, parseInt(String(queryPage || "1"), 10) || 1);
    const limit = Math.min(
        maxLimit,
        Math.max(1, parseInt(String(queryLimit || defaultLimit), 10) || defaultLimit)
    );
    const skip = (page - 1) * limit;

    return {
        page,
        limit,
        skip,
        take: limit,
    };
}

/**
 * Safely parses and validates sort field and direction against an allowlist.
 */
export function parseSorting<T extends string>(
    sortByQuery: unknown,
    orderQuery: unknown,
    allowedFields: readonly T[],
    defaultField: T,
    defaultOrder: "asc" | "desc" = "desc"
): { sortBy: T; order: "asc" | "desc" } {
    const sortBy =
        typeof sortByQuery === "string" && (allowedFields as readonly string[]).includes(sortByQuery)
            ? (sortByQuery as T)
            : defaultField;

    const orderLower = typeof orderQuery === "string" ? orderQuery.toLowerCase() : "";
    const order = orderLower === "asc" || orderLower === "desc" ? orderLower : defaultOrder;

    return { sortBy, order };
}

/**
 * Builds standard pagination response metadata.
 */
export function buildPaginationMeta(
    total: number,
    page: number,
    limit: number,
    count: number
): PaginationMeta {
    return {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        count,
    };
}
