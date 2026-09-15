const generateInvoiceNumber = () => {
    const timestamp = Date.now();

    return `INV-${timestamp}`;
};

module.exports = {
    generateInvoiceNumber
};