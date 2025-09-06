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

  const isServerError = statusCode === 500;
  const isNotFound = statusCode === 404;
  const borderColor = isServerError
    ? "border-red-600"
    : isNotFound
    ? "border-yellow-600"
    : "border-blue-600";
  const textColor = isServerError
    ? "text-red-400"
    : isNotFound
    ? "text-yellow-400"
    : "text-blue-400";
  const headerColor = isServerError
    ? "text-red-500"
    : isNotFound
    ? "text-yellow-500"
    : "text-blue-500";

  return (
    <div className="min-h-screen bg-black font-mono flex items-center justify-center">
      <Head>
        <title>Error {statusCode} | unstabl.ing</title>
      </Head>

      <div className="max-w-md w-full mx-4 text-center">
        <div className={`bg-black border ${borderColor} p-8`}>
          {/* Terminal Header */}
          <div
            className={`flex items-center justify-center mb-6 border-b ${borderColor} pb-4`}
          >
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className={`${headerColor} text-xs font-mono ml-4`}>
              ERROR_{statusCode || "UNKNOWN"}.TERMINAL
            </div>
          </div>

          <div className="text-6xl mb-4 text-red-500">⚠️</div>
          <h1 className={`text-4xl font-mono ${textColor} mb-4`}>
            {statusCode || "ERROR"}
          </h1>
          <p className={`${textColor} font-mono text-lg mb-2`}>
            [ERROR] SYSTEM FAILURE
          </p>
          <p className="text-blue-200 mb-6 font-mono">
            {statusCode === 404
              ? ">>> This page doesn't exist in the system."
              : statusCode === 500
              ? ">>> The system is experiencing critical failures."
              : ">>> An unexpected error occurred in the system."}
          </p>

          <div className="space-y-4">
            <Link href="/">
              <button className="w-full bg-black border border-blue-600 text-blue-400 font-mono py-3 px-6 hover:bg-blue-600 hover:text-black transition-all duration-200">
                {">"} RETURN_TO_HOME
              </button>
            </Link>

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-black border border-gray-600 text-gray-400 font-mono py-3 px-6 hover:bg-gray-600 hover:text-white transition-all duration-200"
            >
              {">"} RETRY_CONNECTION
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-blue-300 text-sm font-mono">
              {statusCode === 404
                ? ">>> Maybe try posting a new idea instead?"
                : ">>> If this persists, contact the system administrators"}
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
