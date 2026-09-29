// Builds a "click to send" WhatsApp link (wa.me) that opens WhatsApp with a
// pre-filled message. No SMTP/SMS provider or API key needed - the teacher's
// own WhatsApp sends it with one tap.
//
// wa.me links need the FULL international number with no leading 0 and no
// symbols, e.g. "94771234567" for a Sri Lankan number stored as "0771234567".
// Change DEFAULT_COUNTRY_CODE below if your teachers are in a different country.
const DEFAULT_COUNTRY_CODE = '94'; // Sri Lanka

export function formatPhoneForWhatsApp(rawPhone, countryCode = DEFAULT_COUNTRY_CODE) {
    if (!rawPhone) return null;
    const digitsOnly = rawPhone.replace(/\D/g, '');
    if (!digitsOnly) return null;

    // Already has a country code (longer than a typical 10-digit local number)
    if (digitsOnly.length > 10) return digitsOnly;

    // Local format starting with a trunk "0" (e.g. 0771234567) -> drop the 0, add country code
    if (digitsOnly.startsWith('0')) return countryCode + digitsOnly.slice(1);

    return countryCode + digitsOnly;
}

export function buildPaymentReminderLink(student, { month, year } = {}) {
    const phone = formatPhoneForWhatsApp(student.contactPhone);
    if (!phone) return null;

    const period = month && year ? `${month} ${year}` : 'this month';
    const message =
        `Hi, this is a reminder from ${student.location || 'your tuition class'} that the ` +
        `${period} tuition fee for ${student.name} (${student.grade || ''}) is still pending. ` +
        `Please settle at your earliest convenience. Thank you!`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
