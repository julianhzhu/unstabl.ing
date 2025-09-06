import { useState } from "react";
import Head from "next/head";

interface UpdateResult {
  success: boolean;
  summary?: {
    totalIdeas: number;
    updated: number;
    errors: number;
    categorizedIdeas: number;
    engagementIdeas: number;
    controversialIdeas: number;
  };
  errorDetails?: string[];
  error?: string;
  details?: string;
}

export default function AdminPage() {
  // This page should only be accessible in development
  if (process.env.NODE_ENV !== "development") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-mono text-red-400 mb-4">
            ACCESS DENIED
          </h1>
          <p className="text-gray-400 font-mono">
            Admin panel is only available in development mode.
          </p>
        </div>
      </div>
    );
  }
  const [loading, setLoading] = useState(false);
  const [indexLoading, setIndexLoading] = useState(false);
  const [result, setResult] = useState<UpdateResult | null>(null);
  const [indexResult, setIndexResult] = useState<any>(null);

  const handleUpdateScores = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/update-scores", {
        method: "POST",
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: "Network error",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIndexes = async () => {
    setIndexLoading(true);
    setIndexResult(null);

    try {
      const response = await fetch("/api/admin/create-indexes", {
        method: "POST",
      });

      const data = await response.json();
      setIndexResult(data);
    } catch (error) {
      setIndexResult({
        success: false,
        error: "Network error",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIndexLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Admin - unstabl.ing</title>
      </Head>

      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-mono font-bold text-blue-400 mb-8">
              ADMIN PANEL
            </h1>

            <div className="bg-gray-900 border border-blue-600 rounded-lg p-6">
              <h2 className="text-xl font-mono text-blue-400 mb-4">
                Update Smart Scores
              </h2>

              <p className="text-gray-300 mb-6 font-mono text-sm">
                This will calculate and update non-time-dependent scores
                (controversial, engagement) and auto-categorize all existing
                ideas. Trending scores are calculated in real-time.
              </p>

              <button
                onClick={handleUpdateScores}
                disabled={loading}
                className={`font-mono px-6 py-3 border transition-all duration-200 ${
                  loading
                    ? "bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed"
                    : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "UPDATING..." : "UPDATE SCORES"}
              </button>

              {result && (
                <div className="mt-6 p-4 border rounded-lg">
                  {result.success ? (
                    <div className="text-green-400">
                      <h3 className="font-mono font-bold text-lg mb-3">
                        ✅ UPDATE COMPLETE
                      </h3>

                      {result.summary && (
                        <div className="font-mono text-sm space-y-1">
                          <div>Total Ideas: {result.summary.totalIdeas}</div>
                          <div>Updated: {result.summary.updated}</div>
                          <div>Errors: {result.summary.errors}</div>
                          <div>
                            Categorized: {result.summary.categorizedIdeas}
                          </div>
                          <div>
                            Engagement: {result.summary.engagementIdeas}
                          </div>
                          <div>
                            Controversial: {result.summary.controversialIdeas}
                          </div>
                        </div>
                      )}

                      {result.errorDetails &&
                        result.errorDetails.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-mono font-bold text-red-400 mb-2">
                              Errors:
                            </h4>
                            <div className="text-red-300 font-mono text-xs space-y-1">
                              {result.errorDetails.map((error, index) => (
                                <div key={index}>{error}</div>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  ) : (
                    <div className="text-red-400">
                      <h3 className="font-mono font-bold text-lg mb-3">
                        ❌ UPDATE FAILED
                      </h3>
                      <div className="font-mono text-sm">
                        <div>Error: {result.error}</div>
                        {result.details && <div>Details: {result.details}</div>}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Create Indexes Section */}
          <div className="bg-gray-900 border border-blue-600 rounded-lg p-6 mt-6">
            <h2 className="text-xl font-mono text-blue-400 mb-4">
              Create Database Indexes
            </h2>

            <p className="text-gray-300 mb-6 font-mono text-sm">
              Create optimized database indexes for better query performance.
              This will speed up trending, controversial, and other sorting
              operations.
            </p>

            <button
              onClick={handleCreateIndexes}
              disabled={indexLoading}
              className={`font-mono px-6 py-3 border transition-all duration-200 ${
                indexLoading
                  ? "bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed"
                  : "bg-green-600 text-white border-green-600 hover:bg-green-700"
              }`}
            >
              {indexLoading ? "CREATING..." : "CREATE INDEXES"}
            </button>

            {indexResult && (
              <div className="mt-6 p-4 border rounded-lg">
                {indexResult.success ? (
                  <div className="text-green-400">
                    <h3 className="font-mono font-bold text-lg mb-3">
                      ✅ INDEXES CREATED
                    </h3>

                    <div className="font-mono text-sm space-y-1">
                      <div>Total Indexes: {indexResult.totalIndexes}</div>
                      <div>
                        Indexes Created: {indexResult.indexesCreated.length}
                      </div>
                    </div>

                    <div className="mt-4">
                      <h4 className="font-mono font-bold text-blue-400 mb-2">
                        Created Indexes:
                      </h4>
                      <div className="text-gray-300 font-mono text-xs space-y-1 max-h-32 overflow-y-auto">
                        {indexResult.indexesCreated.map(
                          (index: string, i: number) => (
                            <div key={i}>{index}</div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-red-400">
                    <h3 className="font-mono font-bold text-lg mb-3">
                      ❌ INDEX CREATION FAILED
                    </h3>
                    <div className="font-mono text-sm">
                      <div>Error: {indexResult.error}</div>
                      {indexResult.details && (
                        <div>Details: {indexResult.details}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
