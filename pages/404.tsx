import Head from "next/head";
import Link from "next/link";

export default function Custom404() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-blue-900 flex items-center justify-center">
      <Head>
        <title>404 - Page Not Found | $USDUC DEGEN IDEAS</title>
      </Head>

      <div className="max-w-md w-full mx-4 text-center">
        <div className="bg-black/30 backdrop-blur-sm border border-red-500/50 rounded-lg p-8">
          <div className="text-6xl mb-4">💥</div>
          <h1 className="text-4xl font-black text-white mb-4">404</h1>
          <p className="text-red-400 font-bold text-lg mb-2">IDEA NOT FOUND!</p>
          <p className="text-white/70 mb-6">
            This DEGEN idea doesn't exist or has been removed.
          </p>

          <div className="space-y-4">
            <Link href="/">
              <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                BACK TO IDEAS
              </button>
            </Link>

            <Link href="/auth/signin">
              <button className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                LOGIN
              </button>
            </Link>
          </div>

          <div className="mt-8 text-center">
            <p className="text-white/50 text-sm">
              Maybe try posting a new DEGEN idea instead?
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
