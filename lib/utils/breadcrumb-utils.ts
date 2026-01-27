/**
 * Breadcrumb Utilities
 * 
 * Centralized utilities for breadcrumb formatting, decoding, and label generation.
 */

/**
 * Decodes a URI-encoded label, returning the original value on failure
 */
export function decodeLabel(value: string): string {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
}

/**
 * Extracts the ID from a slug by finding the longest alphanumeric segment (>15 chars)
 * Example: "project-name-kd7418m7pjppaghd9ghb8sv8x5801c9r" -> "kd7418m7pjppaghd9ghb8sv8x5801c9r"
 */
export function extractIdFromSlug(slug: string): string {
    const parts = slug.split('-');
    for (let i = parts.length - 1; i >= 0; i--) {
        const part = parts[i];
        if (part.length > 15 && /^[a-z0-9]+$/i.test(part)) {
            return part;
        }
    }
    return parts[parts.length - 1];
}

/**
 * Extracts clean display name from a slug by removing the ID suffix
 * Example: "project-name-kd7418m7pjppaghd9ghb8sv8x5801c9r" -> "project-name"
 */
export function extractCleanNameFromSlug(slug: string): string {
    const parts = slug.split('-');
    const cleanParts: string[] = [];

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        // Stop when we hit the ID (long alphanumeric segment >15 chars)
        if (part.length > 15 && /^[a-z0-9]+$/i.test(part)) {
            break;
        }
        cleanParts.push(part);
    }

    return cleanParts.join('-') || slug;
}

/**
 * Maps particular ID to full name
 */
export function getParticularFullName(particular: string): string {
    const mapping: { [key: string]: string } = {
        GAD: "Gender and Development (GAD)",
        LDRRMP: "Local Disaster Risk Reduction and Management Plan",
        LDRRMF: "Local Disaster Risk Reduction and Management Plan",
        LCCAP: "Local Climate Change Action Plan",
        LCPC: "Local Council for the Protection of Children",
        SCPD: "Sectoral Committee for Persons with Disabilities",
        POPS: "Provincial Operations",
        CAIDS: "Community Affairs and Information Development Services",
        LNP: "Local Nutrition Program",
        PID: "Provincial Information Department",
        ACDP: "Agricultural Competitiveness Development Program",
        LYDP: "Local Youth Development Program",
        "20%_DF": "20% Development Fund",
    };
    return mapping[particular] || particular;
}

/**
 * Capitalizes the first letter of a string
 * Example: "budget" -> "Budget"
 */
export function formatYearLabel(year: string): string {
    if (!year) return year;
    return year.charAt(0).toUpperCase() + year.slice(1);
}
