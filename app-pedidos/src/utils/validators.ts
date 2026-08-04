export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const isValidPhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
};

export const isNonEmptyString = (value: string): boolean => {
    return value.trim().length > 0;
};

export const isValidPostalCode = (postalCode: string): boolean => {
    const postalCodeRegex = /^[0-9]{5}(?:-[0-9]{4})?$/; // US ZIP code format
    return postalCodeRegex.test(postalCode);
};

export const isValidOrderAmount = (amount: number): boolean => {
    return amount > 0;
};