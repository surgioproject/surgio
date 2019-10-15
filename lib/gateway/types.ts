import { Readable } from 'stream';

export interface FcRequest {
  readonly headers: Record<string, string>;
  readonly path: string;
  readonly queries: Record<string, string>;
  readonly method: string;
  readonly clientIP: string;
  readonly url: string;
}

export interface FcResponse {
  readonly setStatusCode: (statusCode: number) => void;
  readonly setHeader: (key: string, value: string) => void;
  readonly deleteHeader: (key: string) => void;
  readonly send: (body: Buffer|Readable|string) => void;
}
