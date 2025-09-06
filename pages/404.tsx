import Head from "next/head";
import Link from "next/link";

export default function Custom404() {
  return (
    <div className="min-h-screen bg-black font-mono flex items-center justify-center">
      <Head>
        <title>404 - Page Not Found | unstabl.ing</title>
      </Head>

      <div className="max-w-md w-full mx-4 text-center">
        <div className="bg-black border border-blue-600 p-8">
          {/* Terminal Header */}
          <div className="flex items-center justify-center mb-6 border-b border-blue-600 pb-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="text-blue-500 text-xs font-mono ml-4">
              ERROR_404.TERMINAL
            </div>
          </div>

          <div className="text-6xl mb-4 text-red-500">⚠️</div>
          <h1 className="text-4xl font-mono text-blue-400 mb-4">404</h1>
          <p className="text-red-400 font-mono text-lg mb-2">
            [ERROR] PAGE NOT FOUND
          </p>
          <p className="text-blue-200 mb-6 font-mono">
            {">>>"} This page doesn't exist or has been removed from the system.
          </p>

          <div className="space-y-4">
            <Link href="/">
              <button className="w-full bg-black border border-blue-600 text-blue-400 font-mono py-3 px-6 hover:bg-blue-600 hover:text-black transition-all duration-200">
                {">"} RETURN_TO_HOME
              </button>
            </Link>

            <button
              onClick={() => window.history.back()}
              className="w-full bg-black border border-gray-600 text-gray-400 font-mono py-3 px-6 hover:bg-gray-600 hover:text-white transition-all duration-200"
            >
              {">"} GO_BACK
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-blue-300 text-sm font-mono">
              {">>>"} Maybe try posting a new idea instead?
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
