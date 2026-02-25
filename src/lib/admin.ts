export const ADMIN_EMAILS = new Set([
    'boutiquecurator.com@gmail.com',
]);

export function isAdminEmail(email: string | null | undefined): boolean {
    if (!email) {
        return false;
    }
    return ADMIN_EMAILS.has(email);
}
