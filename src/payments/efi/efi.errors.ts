/**
 * Erros específicos da integração com o EFI Gateway
 */

export class EfiAuthError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'EfiAuthError';
    }
}

export class EfiApiError extends Error {
    constructor(
        message: string,
        public statusCode: number,
        public efiCode: string,
        public efiDescription: string
    ) {
        super(message);
        this.name = 'EfiApiError';
    }
}

export class EfiCertError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'EfiCertError';
    }
}

export class EfiWebhookValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'EfiWebhookValidationError';
    }
}
