export default class InvalidPurchaseException extends Error {
    constructor(message, data) {
        super(message);
        this.name = this.constructor.name;
        this.message = message
        this.data = data;
    }
}
