import styles from "./globals.css?url";
import {
    json,
    LoaderFunctionArgs,
    type LinksFunction,
} from "@remix-run/cloudflare";

import {
    isRouteErrorResponse,
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
    useLoaderData,
    useRouteError,
    useRouteLoaderData,
} from "@remix-run/react";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

export const loader = ({ context, request }: LoaderFunctionArgs) => {
    const url = new URL(request.url);
    return json({
        version: context.cloudflare.env.CF_PAGES_COMMIT_SHA,
        origin: url.origin,
        url: request.url,
    });
};

export const Layout = ({ children = [] }: { children: React.ReactNode }) => {
    const data = useRouteLoaderData<typeof loader>("root") ?? {
        version: "unknown",
        origin: "counterscale.dev",
        url: "https://counterscale.dev/",
    };
    // const error = useRouteError();

    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <link rel="icon" type="image/x-icon" href="/favicon.png" />
                <link rel="manifest" href="/app.webmanifest"></link>

                <meta
                    name="theme-color"
                    media="(prefers-color-scheme: light)"
                    content="hsl(42 69% 85%)"
                />
                <meta
                    name="theme-color"
                    media="(prefers-color-scheme: dark)"
                    content="hsl(222.2 84% 3.9%)"
                />
                <meta
                    name="background-color"
                    media="(prefers-color-scheme: light)"
                    content="hsl(42 69% 85%)"
                />
                <meta
                    name="background-color"
                    media="(prefers-color-scheme: dark)"
                    content="hsl(222.2 84% 3.9%)"
                />

                <meta property="og:url" content={data.url} />
                <meta property="og:type" content="website" />
                <meta property="og:title" content="Counterscale" />
                <meta
                    property="og:description"
                    content="Scalable web analytics you run yourself on Cloudflare"
                />
                <meta
                    property="og:image"
                    content={data.origin + "/counterscale-og-large.webp"}
                />

                <meta name="twitter:card" content="summary_large_image" />
                <meta property="twitter:domain" content="counterscale.dev" />
                <meta property="twitter:url" content={data.url} />
                <meta name="twitter:title" content="Counterscale" />
                <meta
                    name="twitter:description"
                    content="Scalable web analytics you run yourself on Cloudflare"
                />
                <meta
                    name="twitter:image"
                    content={data.origin + "/counterscale-og-large.webp"}
                />
                <Meta />
                <Links />
            </head>
            <body>
                <div className="container mx-auto">{children}</div>
                <ScrollRestoration />
                <Scripts />
                <script
                    dangerouslySetInnerHTML={{
                        __html: "window.counterscale = {'q': [['set', 'siteId', 'counterscale-bio.pages.dev'], ['trackPageview']] };",
                    }}
                ></script>
                <script id="counterscale-script" src="/tracker.js"></script>
            </body>
        </html>
    );
};

export default function App() {
    const data = useLoaderData<typeof loader>();
    return (
        <div className="mt-4">
            <header className="border-b-2 mb-6 py-2">
                <nav className="flex justify-between items-center">
                    <div className="flex items-center">
                        <a href="/" className="text-lg font-bold">
                            Counterscale
                        </a>
                        <img
                            className="w-6 ml-1"
                            src="/img/arrow.svg"
                            alt="Counterscale Icon"
                        />
                    </div>
                    <div className="flex items-center font-small font-medium text-md">
                        <a href="/dashboard">Dashboard</a>
                        <a
                            href="/admin-redirect"
                            target="_blank"
                            className="hidden sm:inline-block ml-2"
                        >
                            Admin
                        </a>
                        <a
                            href="https://github.com/qwtel/counterscale"
                            className="w-6 ml-2"
                        >
                            <img
                                src="/github-mark.svg"
                                alt="GitHub Logo"
                                style={{
                                    filter: "invert(21%) sepia(27%) saturate(271%) hue-rotate(113deg) brightness(97%) contrast(97%)",
                                }}
                            />
                        </a>
                    </div>
                </nav>
            </header>
            <main role="main" className="w-full">
                <Outlet />
            </main>

            <div className="py-4"/>
            <div className="sticky bottom-6 border-t-2 z-20 translate-y-[-1px]"></div>
            <div className="py-2"/>

            <footer className="py-1 sticky bottom-0 bg-background flex justify-between text-s z-10">
                <small className="text-muted-foreground">Counterscale: Web Analytics</small>
                <small>
                    <span className="text-muted-foreground">Version</span>
                    {" "}
                    <a
                        href={`https://github.com/qwtel/counterscale/commit/${data.version}`}
                    >
                        {data.version?.slice(0, 7)}
                    </a>
                </small>
            </footer>
            <div className="py-6"/>
        </div>
    );
}

export const ErrorBoundary = () => {
    const error = useRouteError();

    if (isRouteErrorResponse(error)) {
        return (
            <>
                <h1>
                    {error.status} {error.statusText}
                </h1>
                <p>{error.data}</p>
            </>
        );
    }

    return (
        <>
            <h1>Error!</h1>
            <p>{(error as { message?: string })?.message ?? "Unknown error"}</p>
        </>
    );
};
