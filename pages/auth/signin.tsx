import { signIn, getSession } from "next-auth/react";
import { GetServerSideProps } from "next";
import Head from "next/head";

export default function SignIn() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Head>
        <title>Sign In - $USDUC IDEAS</title>
      </Head>

      <canvas className="background-graph"></canvas>

      <div className="max-w-md w-full mx-4">
        <div className="bg-white/80 backdrop-blur-sm border-2 border-blue-600 rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-blue-600 mb-4">$USDUC</h1>
            <p className="text-blue-600 font-bold text-xl mb-2">IDEAS</p>
            <p className="text-gray-600">Sign in to post your ideas</p>
          </div>

          <button
            onClick={() => signIn("twitter", { callbackUrl: "/" })}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center justify-center space-x-3"
          >
            <span>🐦</span>
            <span>SIGN IN WITH TWITTER</span>
          </button>

          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm">
              ⚠️ WARNING: This is for DEGENS only ⚠️
            </p>
            <p className="text-gray-500 text-xs mt-2">
              High volatility. No financial advice. Pure chaos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);

  if (session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};
