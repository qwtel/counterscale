import { UAParser } from "ua-parser-js";

import type { Request } from "@cloudflare/workers-types";

// encode 1x1 transparent gif
const gif = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const gifData = atob(gif);

function checkVisitorSession(ifModifiedSince: string | null): {
    newVisitor: boolean;
    newSession: boolean;
} {
    let newVisitor = true;
    let newSession = true;

    const minutesUntilSessionResets = 30;
    if (ifModifiedSince) {
        // check today is a new day vs ifModifiedSince
        const today = new Date();
        const ifModifiedSinceDate = new Date(ifModifiedSince);
        if (
            today.getFullYear() === ifModifiedSinceDate.getFullYear() &&
            today.getMonth() === ifModifiedSinceDate.getMonth() &&
            today.getDate() === ifModifiedSinceDate.getDate()
        ) {
            // if ifModifiedSince is today, this is not a new visitor
            newVisitor = false;
        }

        // check ifModifiedSince is less than 30 mins ago
        if (
            Date.now() - new Date(ifModifiedSince).getTime() <
            minutesUntilSessionResets * 60 * 1000
        ) {
            // this is a continuation of the same session
            newSession = false;
        }
    }

    return { newVisitor, newSession };
}

function extractParamsFromQueryString(url: URL): Record<string, string> {
    return Object.fromEntries(url.searchParams);
}

export async function collectRequestHandler(request: Request, env: Env) {
    const url = new URL(request.url);
    const params = extractParamsFromQueryString(url);

    const userAgent = request.headers.get("user-agent") || undefined;
    const parsedUserAgent = new UAParser(userAgent);

    parsedUserAgent.getBrowser().name;

    const { newVisitor, newSession } = checkVisitorSession(
        request.headers.get("if-modified-since"),
    );

    const search = params.s ? new URLSearchParams(params.s) : undefined;
    let referrer = search?.get("ref") || params.r;

    if (referrer && URL.canParse(referrer)) {
        const url = new URL(referrer);
        if (url.protocol === "http:" || url.protocol === "https:") {
            referrer = url.hostname;
        }
        if (referrer.startsWith("www.")) {
            referrer = referrer.substring(4);
        }
    }

    const data: DataPoint = {
        siteId: params.i ?? params.sid,
        host: params.h,
        path: params.p,
        referrer,
        newVisitor: newVisitor ? 1 : 0,
        newSession: newSession ? 1 : 0,
        // user agent stuff
        userAgent,
        browserName: parsedUserAgent.getBrowser().name,
        deviceModel: parsedUserAgent.getDevice().model,
    };

    // NOTE: location is derived from Cloudflare-specific request properties
    // see: https://developers.cloudflare.com/workers/runtime-apis/request/#incomingrequestcfproperties
    const country = request.cf?.country;
    if (typeof country === "string") {
        data.country = country;
    }
    const city = request.cf?.city;
    if (typeof city === "string") {
        data.city = city;
    }
    const region = request.cf?.region;
    if (typeof region === "string") {
        data.region = region;
    }
    const latitude = request.cf?.latitude
        ? Number(request.cf?.latitude)
        : undefined;
    const longitude = request.cf?.longitude
        ? Number(request.cf?.longitude)
        : undefined;
    if (latitude && longitude && !isNaN(latitude) && !isNaN(longitude)) {
        data.latitude = latitude;
        data.longitude = longitude;
    }

    writeDataPoint(env.WEB_COUNTER_AE, data);

    const gifLength = gifData.length;
    const arrayBuffer = new ArrayBuffer(gifLength);
    const uintArray = new Uint8Array(arrayBuffer);
    for (let i = 0; i < gifLength; i++) {
        uintArray[i] = gifData.charCodeAt(i);
    }

    return new Response(arrayBuffer, {
        headers: {
            "Content-Type": "image/gif",
            Expires: "Mon, 01 Jan 1990 00:00:00 GMT",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            "Last-Modified": new Date().toUTCString(),
            Tk: "N", // not tracking
        },
        status: 200,
    });
}

interface DataPoint {
    // index
    siteId?: string;

    // blobs
    host?: string | undefined;
    userAgent?: string;
    path?: string;
    country?: string;
    region?: string;
    city?: string;
    referrer?: string;
    browserName?: string;
    deviceModel?: string;

    // doubles
    newVisitor: number;
    newSession: number;
    latitude?: number;
    longitude?: number;
}

// NOTE: Cloudflare Analytics Engine has limits on total number of bytes, number of fields, etc.
// More here: https://developers.cloudflare.com/analytics/analytics-engine/limits/

export function writeDataPoint(
    analyticsEngine: AnalyticsEngineDataset,
    data: DataPoint,
) {
    const datapoint = {
        indexes: [data.siteId || ""], // Supply one index
        blobs: [
            data.host || "", // blob1
            data.userAgent || "", // blob2
            data.path || "", // blob3
            data.country || "", // blob4
            data.referrer || "", // blob5
            data.browserName || "", // blob6
            data.deviceModel || "", // blob7
            data.siteId || "", // blob8
            data.region || "", // blob9
            data.city || "", // blob10
        ],
        doubles: [
            data.newVisitor || 0,
            data.newSession || 0,
            data.latitude || 0,
            data.longitude || 0,
        ],
    };

    if (!analyticsEngine) {
        // no-op
        console.log("Can't save datapoint: Analytics unavailable");
        return;
    }

    analyticsEngine.writeDataPoint(datapoint);
}
