import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function VerifyEmail() {
  const router = useRouter();
  const { token } = router.query;
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (token && typeof token === "string") {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await fetch(
        `/api/email/verify?token=${verificationToken}`
      );
      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage(data.message);
      } else {
        setStatus("error");
        setMessage(data.error);
      }
    } catch (error) {
      setStatus("error");
      setMessage("Failed to verify email address");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="max-w-md w-full bg-black border border-blue-600 rounded-lg p-6 font-mono">
        <div className="text-center">
          {status === "loading" && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h1 className="text-xl font-semibold mb-2 text-blue-400">
                Verifying your email...
              </h1>
              <p className="text-blue-300">
                Please wait while we verify your email address.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="text-green-600 text-6xl mb-4">✓</div>
              <h1 className="text-xl font-semibold mb-2 text-green-400">
                Email Verified!
              </h1>
              <p className="text-blue-300 mb-4">{message}</p>
              <button
                onClick={() => router.push("/")}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-mono"
              >
                Go to Home
              </button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="text-red-600 text-6xl mb-4">✗</div>
              <h1 className="text-xl font-semibold mb-2 text-red-400">
                Verification Failed
              </h1>
              <p className="text-blue-300 mb-4">{message}</p>
              <button
                onClick={() => router.push("/")}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 font-mono"
              >
                Go to Home
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
