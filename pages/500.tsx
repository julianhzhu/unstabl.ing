import Head from "next/head";
import Link from "next/link";

export default function Custom500() {
  return (
    <div className="min-h-screen bg-black font-mono flex items-center justify-center">
      <Head>
        <title>500 - Server Error | unstabl.ing</title>
      </Head>

      <div className="max-w-md w-full mx-4 text-center">
        <div className="bg-black border border-red-600 p-8">
          {/* Terminal Header */}
          <div className="flex items-center justify-center mb-6 border-b border-red-600 pb-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="text-red-500 text-xs font-mono ml-4">
              ERROR_500.TERMINAL
            </div>
          </div>

          <div className="text-6xl mb-4 text-red-500">💥</div>
          <h1 className="text-4xl font-mono text-red-400 mb-4">500</h1>
          <p className="text-red-400 font-mono text-lg mb-2">
            [CRITICAL ERROR] SERVER MELTDOWN
          </p>
          <p className="text-blue-200 mb-6 font-mono">
            {">>>"} The system is experiencing critical failures. Servers are
            unstable.
          </p>

          <div className="space-y-4">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-black border border-red-600 text-red-400 font-mono py-3 px-6 hover:bg-red-600 hover:text-black transition-all duration-200"
            >
              {">"} RETRY_CONNECTION
            </button>

            <Link href="/">
              <button className="w-full bg-black border border-blue-600 text-blue-400 font-mono py-3 px-6 hover:bg-blue-600 hover:text-black transition-all duration-200">
                {">"} RETURN_TO_HOME
              </button>
            </Link>
          </div>

          <div className="mt-8 text-center">
            <p className="text-red-300 text-sm font-mono">
              {">>>"} If this persists, the system administrators need to
              investigate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
