import { OAuth2ErrorCode } from '../index.js';
export declare class OAuth2Error extends Error {
    code: OAuth2ErrorCode;
    constructor(code: OAuth2ErrorCode, message: string);
}
