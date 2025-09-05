import { NextPageContext } from "next";
import Head from "next/head";
import Link from "next/link";

interface ErrorProps {
  statusCode?: number;
  hasGetInitialPropsRun?: boolean;
  err?: Error;
}

export default function Error({
  statusCode,
  hasGetInitialPropsRun,
  err,
}: ErrorProps) {
  if (!hasGetInitialPropsRun && err) {
    // getInitialProps is not called in case of
    // https://github.com/vercel/next.js/issues/8592. As a workaround, we pass
    // err via _app.js so it can be captured
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-blue-900 flex items-center justify-center">
      <Head>
        <title>Error {statusCode} | $USDUC DEGEN IDEAS</title>
      </Head>

      <div className="max-w-md w-full mx-4 text-center">
        <div className="bg-black/30 backdrop-blur-sm border border-red-500/50 rounded-lg p-8">
          <div className="text-6xl mb-4">💥</div>
          <h1 className="text-4xl font-black text-white mb-4">
            {statusCode || "ERROR"}
          </h1>
          <p className="text-red-400 font-bold text-lg mb-2">
            SOMETHING WENT WRONG!
          </p>
          <p className="text-white/70 mb-6">
            {statusCode === 404
              ? "This DEGEN idea doesn't exist."
              : statusCode === 500
              ? "The servers are having a meltdown."
              : "An unexpected error occurred."}
          </p>

          <div className="space-y-4">
            <Link href="/">
              <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                BACK TO IDEAS
              </button>
            </Link>

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              TRY AGAIN
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-white/50 text-sm">
              {statusCode === 404
                ? "Maybe try posting a new DEGEN idea instead?"
                : "If this keeps happening, contact the DEGEN team"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode, hasGetInitialPropsRun: true };
};
