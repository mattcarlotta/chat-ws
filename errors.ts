export type ResponseErrorT = typeof ResponseError;

export class ResponseError extends Error {
    public statusCode: number;
    public error: string;

    constructor(statusCode: number, error = "") {
        super();

        this.statusCode = statusCode;
        this.error = error;
    }
}

export class ValidationError extends ResponseError {
    constructor(error: string) {
        super(400, error);
    }
}

export class AuthValidationError extends ResponseError {
    constructor(error: string) {
        super(403, error);
    }
}

export class ServerError extends ResponseError {
    constructor(error: string) {
        super(500, error);
    }
}
