import { useRouter } from "next/router";
import Head from "next/head";

export default function AuthError() {
  const router = useRouter();
  const { error } = router.query;

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case "AccessDenied":
        return "Access denied. You need to be approved to join the DEGEN community.";
      case "Configuration":
        return "Server configuration error. Please try again later.";
      case "Verification":
        return "Verification failed. Please try again.";
      default:
        return "An error occurred during authentication. Please try again.";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-purple-900 to-blue-900 flex items-center justify-center">
      <Head>
        <title>Auth Error - $USDUC DEGEN IDEAS</title>
      </Head>

      <div className="max-w-md w-full mx-4">
        <div className="bg-black/30 backdrop-blur-sm border border-red-500/50 rounded-lg p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">💥</div>
            <h1 className="text-3xl font-black text-white mb-4">AUTH ERROR</h1>
            <p className="text-red-400 font-bold text-lg mb-2">
              Something went wrong!
            </p>
          </div>

          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
            <p className="text-white text-center">
              {getErrorMessage(error as string)}
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => router.push("/auth/signin")}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              TRY AGAIN
            </button>

            <button
              onClick={() => router.push("/")}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              GO BACK HOME
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-white/50 text-sm">
              If this problem persists, contact the DEGEN team
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

