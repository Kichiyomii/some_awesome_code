/**
 * Маска для инпута карт
 * @return {cardNumber}
 */

export const formatCardNumber = (cardNumber) => String(cardNumber).match(/(\d{4})(\d{4})(\d{4})(\d{4})/)?.slice(1).join(' ') || cardNumber;