export const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
export const MAX_BODY_BYTES = parseInt(process.env.MAX_BODY_KB || '100', 10) * 1024;
export const DEFAULT_RESPONSE_HEADERS = '{"Content-Type":"application/json"}';
export const DEFAULT_RESPONSE_BODY = '{"ok":true}';

export interface CountRow { c: number }
