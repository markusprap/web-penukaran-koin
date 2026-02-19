import { NextRequest } from 'next/server';
import app from '@/server/app';
import http from 'http';

// Convert Next.js request to Express-compatible request
async function handler(req: NextRequest) {
    return new Promise<Response>((resolve) => {
        const url = new URL(req.url);
        const path = url.pathname;
        const query = url.search;

        // Build headers object
        const headers: Record<string, string> = {};
        req.headers.forEach((value, key) => {
            headers[key] = value;
        });

        // Create a mock IncomingMessage
        const mockReq = new http.IncomingMessage(null as any);
        mockReq.method = req.method;
        mockReq.url = path + query;
        mockReq.headers = headers;

        // Handle body
        const chunks: Buffer[] = [];
        let bodyHandled = false;

        const mockRes = new http.ServerResponse(mockReq);
        const resChunks: Buffer[] = [];
        let statusCode = 200;
        const resHeaders: Record<string, string | string[]> = {};

        // Override ServerResponse methods
        const originalWriteHead = mockRes.writeHead.bind(mockRes);
        mockRes.writeHead = ((code: number, headersOrReason?: any, maybeHeaders?: any) => {
            statusCode = code;
            const h = maybeHeaders || (typeof headersOrReason === 'object' ? headersOrReason : {});
            if (h) {
                Object.entries(h).forEach(([k, v]) => {
                    resHeaders[k] = v as string | string[];
                });
            }
            return originalWriteHead(code, headersOrReason, maybeHeaders);
        }) as any;

        mockRes.setHeader = ((name: string, value: string | string[]) => {
            resHeaders[name.toLowerCase()] = value;
            return mockRes;
        }) as any;

        const originalEnd = mockRes.end.bind(mockRes);
        mockRes.end = ((chunk?: any, encoding?: any, cb?: any) => {
            if (chunk) {
                resChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }
            const body = Buffer.concat(resChunks);
            const responseHeaders = new Headers();
            Object.entries(resHeaders).forEach(([k, v]) => {
                if (Array.isArray(v)) {
                    v.forEach(val => responseHeaders.append(k, val));
                } else if (v) {
                    responseHeaders.set(k, v);
                }
            });
            resolve(new Response(body.length > 0 ? body : null, {
                status: statusCode,
                headers: responseHeaders
            }));
            return originalEnd(chunk, encoding, cb);
        }) as any;

        const originalWrite = mockRes.write.bind(mockRes);
        mockRes.write = ((chunk: any, encodingOrCb?: any, cb?: any) => {
            if (chunk) {
                resChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }
            return true;
        }) as any;

        // Get body and pass to Express
        (async () => {
            if (req.method !== 'GET' && req.method !== 'HEAD') {
                try {
                    const bodyText = await req.text();
                    if (bodyText) {
                        const bodyBuf = Buffer.from(bodyText);
                        // Push body data to the mock request
                        mockReq.push(bodyBuf);
                    }
                } catch (e) {
                    // No body
                }
            }
            mockReq.push(null); // Signal end of body

            // Pass to Express
            (app as any).handle(mockReq, mockRes);
        })();
    });
}

export async function GET(req: NextRequest) {
    return handler(req);
}

export async function POST(req: NextRequest) {
    return handler(req);
}

export async function PUT(req: NextRequest) {
    return handler(req);
}

export async function DELETE(req: NextRequest) {
    return handler(req);
}

export async function PATCH(req: NextRequest) {
    return handler(req);
}
