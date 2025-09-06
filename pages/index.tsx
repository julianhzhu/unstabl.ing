import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Head from "next/head";
import { IIdea } from "@/models/Idea";
import EmailSettings from "@/components/EmailSettings";

interface IdeaWithReplies extends Omit<IIdea, "replies"> {
  replies?: IdeaWithReplies[];
  userVote?: "stable" | "unstable" | null;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [ideas, setIdeas] = useState<IdeaWithReplies[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPostForm, setShowPostForm] = useState(false);
  const [newIdea, setNewIdea] = useState({ title: "", content: "", tags: [] });
  const [sortBy, setSortBy] = useState("score");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [anonymousUser, setAnonymousUser] = useState<{
    id: string;
    name: string;
    key?: string;
  } | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showRecoverModal, setShowRecoverModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEmailSettings, setShowEmailSettings] = useState(false);
  const [recoverKey, setRecoverKey] = useState("");

  // Fallback copy function for older browsers
  const fallbackCopy = (
    text: string,
    button: HTMLButtonElement,
    originalText: string
  ) => {
    // Create a temporary textarea element
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand("copy");
      if (successful) {
        button.textContent = "> COPIED!";
        button.className =
          "w-full bg-green-600 text-white font-mono py-2 px-4 transition-all duration-200";
        setTimeout(() => {
          button.textContent = originalText;
          button.className =
            "w-full bg-black border border-green-600 text-green-400 font-mono py-2 px-4 hover:bg-green-600 hover:text-white transition-all duration-200";
        }, 2000);
      } else {
        throw new Error("Copy command failed");
      }
    } catch (err) {
      button.textContent = "> COPY FAILED - KEY SHOWN BELOW";
      button.className =
        "w-full bg-red-600 text-white font-mono py-2 px-4 transition-all duration-200";
      setTimeout(() => {
        button.textContent = originalText;
        button.className =
          "w-full bg-black border border-green-600 text-green-400 font-mono py-2 px-4 hover:bg-green-600 hover:text-white transition-all duration-200";
      }, 3000);
    } finally {
      document.body.removeChild(textArea);
    }
  };

  // Initialize anonymous user
  useEffect(() => {
    const initializeAnonymousUser = async () => {
      if (status === "unauthenticated") {
        let user = localStorage.getItem("usduc_anonymous_user");
        if (!user) {
          const anonymousId = "anon_" + Math.random().toString(36).substr(2, 9);

          // Generate a unique name
          let anonymousName =
            "DEGEN_" + Math.random().toString(36).substr(2, 4).toUpperCase();
          let attempts = 0;
          let nameAvailable = false;

          while (!nameAvailable && attempts < 10) {
            try {
              const response = await fetch("/api/users/check-name", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: anonymousName,
                  currentUserId: null,
                }),
              });

              const data = await response.json();
              if (data.available) {
                nameAvailable = true;
              } else {
                // Generate a new name if taken
                anonymousName =
                  "DEGEN_" +
                  Math.random().toString(36).substr(2, 4).toUpperCase();
                attempts++;
              }
            } catch (error) {
              console.error("Error checking name during creation:", error);
              // If API fails, just use the generated name
              nameAvailable = true;
            }
          }

          const userKey = Math.random()
            .toString(36)
            .substr(2, 12)
            .toUpperCase();
          const userData = {
            id: anonymousId,
            name: anonymousName,
            key: userKey,
          };

          localStorage.setItem(
            "usduc_anonymous_user",
            JSON.stringify(userData)
          );
          setAnonymousUser(userData);

          // Store user data on server with key (async, don't wait)
          fetch("/api/users/key", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: userKey, userData }),
          }).catch(console.error);
        } else {
          const existingUser = JSON.parse(user);

          // If existing user doesn't have a key, generate one
          if (!existingUser.key) {
            const newKey = Math.random()
              .toString(36)
              .substr(2, 12)
              .toUpperCase();
            const updatedUser = {
              ...existingUser,
              key: newKey,
            };

            // Store updated user data on server
            fetch("/api/users/key", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key: newKey, userData: updatedUser }),
            }).catch(console.error);

            localStorage.setItem(
              "usduc_anonymous_user",
              JSON.stringify(updatedUser)
            );
            setAnonymousUser(updatedUser);
          } else {
            // User has a key, but let's make sure it's stored on the server
            fetch("/api/users/key", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                key: existingUser.key,
                userData: existingUser,
              }),
            }).catch(console.error);

            setAnonymousUser(existingUser);
          }
        }
      }
    };

    initializeAnonymousUser();
  }, [status]);

  useEffect(() => {
    console.log(
      "useEffect triggered - sortBy:",
      sortBy,
      "page:",
      page,
      "anonymousUser:",
      anonymousUser?.id
    );
    if (status !== "loading" && anonymousUser) {
      fetchIdeas();
    }
  }, [sortBy, page, status, anonymousUser]);

  const fetchIdeas = async () => {
    try {
      console.log("Fetching ideas...");
      const response = await fetch(
        `/api/ideas?page=${page}&sort=${sortBy}&limit=10`
      );

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched data:", data);
      console.log("Ideas count:", data.ideas?.length);

      // Add userVote information to each idea
      const ideasWithUserVotes = (data.ideas || []).map((idea: any) => {
        if (!anonymousUser) {
          return { ...idea, userVote: null };
        }

        const hasVotedStable = idea.votes.stable.includes(anonymousUser.id);
        const hasVotedUnstable = idea.votes.unstable.includes(anonymousUser.id);

        let userVote: "stable" | "unstable" | null = null;
        if (hasVotedStable) userVote = "stable";
        else if (hasVotedUnstable) userVote = "unstable";

        return { ...idea, userVote };
      });

      if (page === 1) {
        setIdeas(ideasWithUserVotes);
      } else {
        setIdeas((prev) => [...prev, ...ideasWithUserVotes]);
      }

      setHasMore(data.pagination?.page < data.pagination?.pages);
    } catch (error) {
      console.error("Error fetching ideas:", error);
      setIdeas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (ideaId: string, vote: "stable" | "unstable") => {
    try {
      if (!anonymousUser) return;

      const response = await fetch(`/api/ideas/${ideaId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vote,
          userId: anonymousUser.id,
          userName: anonymousUser.name,
          isAnonymous: true,
        }),
      });

      if (response.ok) {
        // Instead of complex state updates, just refresh the data from server
        // This ensures we get the correct state and avoid data corruption
        await fetchIdeas();

        // Track vote in localStorage
        const votes = JSON.parse(localStorage.getItem("usduc_votes") || "{}");
        votes[ideaId] = vote;
        localStorage.setItem("usduc_votes", JSON.stringify(votes));
      }
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  const handleReplyAdded = async (parentId: string, newReply: any) => {
    // Instead of complex state updates, just refresh the data from server
    // This ensures we get the correct state and avoid duplicates
    await fetchIdeas();
  };

  const handleSubmitIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!anonymousUser) return;

      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newIdea,
          author: {
            userId: anonymousUser.id,
            name: anonymousUser.name,
            twitterHandle: anonymousUser.name,
            isAnonymous: true,
          },
        }),
      });

      if (response.ok) {
        const idea = await response.json();
        setIdeas((prev) => [idea, ...prev]);
        setNewIdea({ title: "", content: "", tags: [] });
        setShowPostForm(false);

        // Track post in localStorage
        const posts = JSON.parse(localStorage.getItem("usduc_posts") || "[]");
        posts.push(idea._id);
        localStorage.setItem("usduc_posts", JSON.stringify(posts));
      }
    } catch (error) {
      console.error("Error posting idea:", error);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono">
        <div className="text-center">
          <div className="text-blue-400 text-2xl font-mono mb-4">
            {">"} Initializing USDUC protocol...
          </div>
          <div className="text-blue-300 text-sm font-mono animate-pulse">
            [LOADING] Connecting to DEGEN network...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black font-mono">
      <Head>
        <title>unstabl.ing - DEGEN IDEAS</title>
        <meta
          name="description"
          content="Post your DEGEN ideas for $USDUC - A cypherpunk discussion forum for the USDUC community"
        />
        <meta
          name="keywords"
          content="USDUC, crypto, ideas, discussion, cypherpunk, blockchain"
        />
        <meta name="author" content="USDUC Community" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Open Graph */}
        <meta property="og:title" content="unstabl.ing - DEGEN IDEAS" />
        <meta
          property="og:description"
          content="Post your DEGEN ideas for $USDUC - A cypherpunk discussion forum"
        />
        <meta property="og:type" content="website" />
        <meta
          property="og:url"
          content={process.env.NEXT_PUBLIC_APP_URL || "https://unstabl.ing"}
        />

        {/* Twitter */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="unstabl.ing - DEGEN IDEAS" />
        <meta
          name="twitter:description"
          content="Post your DEGEN ideas for $USDUC - A cypherpunk discussion forum"
        />

        {/* Favicon */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </Head>

      {/* Header - Minimal */}
      <header className="bg-black border-b border-blue-600 px-4 py-1 font-mono">
        <div className="flex items-center justify-between">
          <div className="text-blue-400 text-xs">
            unstabl.ing{" "}
            <span className="text-green-400 animate-pulse">[ACTIVE]</span>
          </div>
          {anonymousUser && (
            <button
              onClick={() => setShowUserModal(true)}
              className="text-blue-300 hover:text-blue-200 text-xs underline decoration-dotted"
            >
              user@{anonymousUser.name}
            </button>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-4">
        {/* Post Idea Button */}
        {anonymousUser && (
          <div className="mb-6">
            <button
              onClick={() => setShowPostForm(!showPostForm)}
              className="bg-black border border-blue-600 text-blue-400 font-mono px-6 py-3 hover:bg-blue-600 hover:text-black transition-all duration-200"
            >
              {">"} {showPostForm ? "cancel" : "new_idea --create"}
            </button>
          </div>
        )}

        {/* Post Form */}
        {showPostForm && (
          <div className="bg-black border border-blue-600 p-6 mb-6 font-mono">
            <div className="flex items-center justify-between mb-4 border-b border-blue-600 pb-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="text-blue-500 text-xs font-mono">
                new_idea.txt
              </div>
            </div>
            <form onSubmit={handleSubmitIdea} className="space-y-4">
              <div>
                <div className="text-blue-500 font-mono text-sm mb-2">
                  {">"} echo "Enter idea title:"
                </div>
                <input
                  type="text"
                  value={newIdea.title}
                  onChange={(e) =>
                    setNewIdea((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full bg-black border border-blue-600 px-3 py-2 text-blue-200 font-mono focus:outline-none focus:border-blue-400"
                  placeholder="YOUR_DEGEN_IDEA_TITLE..."
                  maxLength={200}
                  required
                />
              </div>

              <div>
                <div className="text-blue-500 font-mono text-sm mb-2">
                  {">"} echo "Enter idea description:"
                </div>
                <textarea
                  value={newIdea.content}
                  onChange={(e) =>
                    setNewIdea((prev) => ({ ...prev, content: e.target.value }))
                  }
                  className="w-full bg-black border border-blue-600 px-3 py-2 text-blue-200 font-mono focus:outline-none focus:border-blue-400 h-24 resize-none"
                  placeholder="DESCRIBE_YOUR_DEGEN_IDEA..."
                  maxLength={600}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-black border border-blue-600 text-blue-400 font-mono py-3 px-4 hover:bg-blue-600 hover:text-black transition-all duration-200"
              >
                {">"} submit --idea
              </button>
            </form>
          </div>
        )}

        {/* Sort Controls */}
        <div className="flex justify-center mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setSortBy("score");
                setPage(1);
              }}
              className={`font-mono text-sm px-4 py-2 border transition-all duration-200 ${
                sortBy === "score"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-black text-blue-400 border-blue-600 hover:bg-blue-600 hover:text-white"
              }`}
            >
              {">"} sort --hot
            </button>
            <button
              onClick={() => {
                setSortBy("new");
                setPage(1);
              }}
              className={`font-mono text-sm px-4 py-2 border transition-all duration-200 ${
                sortBy === "new"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-black text-blue-400 border-blue-600 hover:bg-blue-600 hover:text-white"
              }`}
            >
              {">"} sort --new
            </button>
          </div>
        </div>

        {/* Ideas List */}
        <div className="w-full max-w-4xl mx-auto space-y-6 px-2">
          {loading ? (
            <div className="text-blue-400 text-xl font-mono">
              {">"} Loading DEGEN ideas... [PENDING]
            </div>
          ) : ideas.length === 0 ? (
            <div className="text-blue-300 text-xl font-mono">
              {">"} No ideas found. Be the first to post!
            </div>
          ) : (
            ideas.map((idea) => (
              <IdeaCard
                key={idea._id}
                idea={idea}
                onVote={handleVote}
                anonymousUser={anonymousUser}
                onReplyAdded={handleReplyAdded}
              />
            ))
          )}
        </div>

        {/* Load More */}
        {hasMore && !loading && (
          <div className="mt-4">
            <button
              onClick={() => setPage((prev) => prev + 1)}
              className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              LOAD MORE
            </button>
          </div>
        )}
      </div>

      {/* User Settings Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-black border border-blue-600 p-6 max-w-md w-full mx-4 font-mono">
            <div className="flex items-center justify-between mb-4 border-b border-blue-600 pb-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="text-blue-500 text-xs font-mono">
                user_settings.txt
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-blue-500 text-sm mb-2">
                {">"} User Profile:
              </div>

              <div className="p-3 bg-gray-900 border border-blue-600">
                <div className="text-blue-400 text-xs mb-1">Name:</div>
                <div className="text-blue-200 font-mono text-sm">
                  {anonymousUser?.name}
                </div>
                <div className="text-blue-400 text-xs mb-1 mt-2">User ID:</div>
                <div className="text-blue-200 font-mono text-xs">
                  {anonymousUser?.id}
                </div>
                <div className="text-blue-400 text-xs mb-1 mt-2">
                  Recovery Key:
                </div>
                <div className="text-blue-200 font-mono text-xs">
                  {anonymousUser?.key ? "✓ Generated" : "✗ Not available"}
                </div>
              </div>

              {anonymousUser?.key && (
                <div className="p-3 bg-yellow-900/30 border border-yellow-600 rounded">
                  <div className="text-yellow-400 text-xs font-bold mb-1">
                    ⚠️ IMPORTANT WARNING:
                  </div>
                  <div className="text-yellow-200 text-xs leading-relaxed">
                    If you lose your recovery key or clear browser data, you
                    will <strong>permanently lose access</strong> to this user
                    account, including all your posts and votes. Save your
                    recovery key somewhere safe!
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={async () => {
                    const newName = prompt(
                      "Enter new name:",
                      anonymousUser?.name
                    );
                    if (newName && newName.trim()) {
                      const trimmedName = newName.trim();

                      // Check if name is available
                      try {
                        const response = await fetch("/api/users/check-name", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            name: trimmedName,
                            currentUserId: anonymousUser?.id,
                          }),
                        });

                        const data = await response.json();

                        if (!data.available) {
                          alert(
                            `Name "${trimmedName}" is already taken. Please choose a different name.`
                          );
                          return;
                        }

                        // Name is available, proceed with update
                        const updatedUser = {
                          ...anonymousUser!,
                          name: trimmedName,
                        };

                        // Update user data on server
                        if (anonymousUser?.key) {
                          fetch("/api/users/key", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              key: anonymousUser.key,
                              userData: updatedUser,
                            }),
                          }).catch(console.error);
                        }

                        localStorage.setItem(
                          "usduc_anonymous_user",
                          JSON.stringify(updatedUser)
                        );
                        setAnonymousUser(updatedUser);
                        setShowUserModal(false);
                      } catch (error) {
                        console.error("Error checking name:", error);
                        alert(
                          "Error checking name availability. Please try again."
                        );
                      }
                    }
                  }}
                  className="w-full bg-black border border-blue-600 text-blue-400 font-mono py-2 px-4 hover:bg-blue-600 hover:text-white transition-all duration-200"
                >
                  {">"} Rename User
                </button>

                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setShowKeyModal(true);
                  }}
                  className="w-full bg-black border border-green-600 text-green-400 font-mono py-2 px-4 hover:bg-green-600 hover:text-white transition-all duration-200"
                >
                  {">"} Manage Recovery Key
                </button>

                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setShowEmailSettings(true);
                  }}
                  className="w-full bg-black border border-blue-600 text-blue-400 font-mono py-2 px-4 hover:bg-blue-600 hover:text-white transition-all duration-200"
                >
                  {">"} Email & Notifications
                </button>
              </div>

              <button
                onClick={() => setShowUserModal(false)}
                className="w-full bg-black border border-gray-600 text-gray-400 font-mono py-2 px-4 hover:bg-gray-600 hover:text-white transition-all duration-200"
              >
                {">"} Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-black border border-blue-600 p-6 max-w-md w-full mx-4 font-mono">
            <div className="flex items-center justify-between mb-4 border-b border-blue-600 pb-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="text-blue-500 text-xs font-mono">
                key_manager.txt
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-blue-500 text-sm mb-2">
                {">"} Key Management:
              </div>
              <div className="text-blue-400 text-xs mb-4 leading-relaxed">
                Your recovery key lets you restore your user identity if you
                lose localStorage or switch devices. Save it somewhere safe!
              </div>

              <div className="p-3 bg-red-900/30 border border-red-600 rounded">
                <div className="text-red-400 text-xs font-bold mb-1">
                  🚨 CRITICAL WARNING:
                </div>
                <div className="text-red-200 text-xs leading-relaxed">
                  <strong>
                    Without your recovery key, you will permanently lose access
                    to:
                  </strong>
                  <br />• Your user identity and posts
                  <br />• All your votes and interactions
                  <br />• Your account if you clear browser data or switch
                  devices
                  <br />
                  <br />
                  <strong>Save your key in a secure location!</strong>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={async (e) => {
                    if (anonymousUser?.key) {
                      const button = e.target as HTMLButtonElement;
                      const originalText = button.textContent;

                      // Check if clipboard API is available
                      if (navigator.clipboard && window.isSecureContext) {
                        try {
                          await navigator.clipboard.writeText(
                            anonymousUser.key
                          );
                          // Show success message
                          button.textContent = "> COPIED!";
                          button.className =
                            "w-full bg-green-600 text-white font-mono py-2 px-4 transition-all duration-200";
                          setTimeout(() => {
                            button.textContent = originalText;
                            button.className =
                              "w-full bg-black border border-green-600 text-green-400 font-mono py-2 px-4 hover:bg-green-600 hover:text-white transition-all duration-200";
                          }, 2000);
                        } catch (error) {
                          // Fallback to manual selection
                          fallbackCopy(
                            anonymousUser.key,
                            button,
                            originalText || ""
                          );
                        }
                      } else {
                        // Fallback to manual selection
                        fallbackCopy(
                          anonymousUser.key,
                          button,
                          originalText || ""
                        );
                      }
                    }
                  }}
                  className="w-full bg-black border border-green-600 text-green-400 font-mono py-2 px-4 hover:bg-green-600 hover:text-white transition-all duration-200"
                >
                  {">"} Copy Recovery Key
                </button>

                <button
                  onClick={() => {
                    setShowKeyModal(false);
                    setShowRecoverModal(true);
                  }}
                  className="w-full bg-black border border-blue-600 text-blue-400 font-mono py-2 px-4 hover:bg-blue-600 hover:text-white transition-all duration-200"
                >
                  {">"} Restore User with Key
                </button>
              </div>

              {anonymousUser?.key && (
                <div className="mt-4 p-3 bg-gray-900 border border-blue-600">
                  <div className="text-blue-500 text-xs mb-1">
                    {">"} Your recovery key:
                  </div>
                  <div className="text-blue-200 font-mono text-sm break-all">
                    {anonymousUser.key}
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowKeyModal(false)}
                className="w-full bg-black border border-gray-600 text-gray-400 font-mono py-2 px-4 hover:bg-gray-600 hover:text-white transition-all duration-200"
              >
                {">"} Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recover Modal */}
      {showRecoverModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-black border border-blue-600 p-6 max-w-md w-full mx-4 font-mono">
            <div className="flex items-center justify-between mb-4 border-b border-blue-600 pb-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="text-blue-500 text-xs font-mono">
                recovery.txt
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-blue-500 text-sm mb-2">
                {">"} Restore User Identity:
              </div>
              <div className="text-blue-400 text-xs mb-4 leading-relaxed">
                Enter your recovery key to restore your user identity, posts,
                and votes from a previous session.
              </div>

              <input
                type="text"
                value={recoverKey}
                onChange={(e) => setRecoverKey(e.target.value)}
                className="w-full bg-black border border-blue-600 px-3 py-2 text-blue-200 font-mono focus:outline-none focus:border-blue-400"
                placeholder="Paste your recovery key here..."
              />

              <div className="flex space-x-2">
                <button
                  onClick={async () => {
                    if (recoverKey.trim()) {
                      try {
                        const response = await fetch(
                          `/api/users/key?key=${encodeURIComponent(
                            recoverKey.trim()
                          )}`
                        );
                        const data = await response.json();

                        if (data.userData) {
                          localStorage.setItem(
                            "usduc_anonymous_user",
                            JSON.stringify(data.userData)
                          );
                          setAnonymousUser(data.userData);
                          setShowRecoverModal(false);
                          setRecoverKey("");
                          alert(
                            `User restored successfully!\nName: ${data.userData.name}`
                          );
                        } else {
                          alert(
                            "Invalid recovery key. Please check and try again."
                          );
                        }
                      } catch (error) {
                        console.error("Recovery error:", error);
                        alert("Error recovering user. Please try again.");
                      }
                    }
                  }}
                  className="flex-1 bg-black border border-green-600 text-green-400 font-mono py-2 px-4 hover:bg-green-600 hover:text-white transition-all duration-200"
                >
                  {">"} Restore User
                </button>

                <button
                  onClick={() => {
                    setShowRecoverModal(false);
                    setRecoverKey("");
                  }}
                  className="flex-1 bg-black border border-gray-600 text-gray-400 font-mono py-2 px-4 hover:bg-gray-600 hover:text-white transition-all duration-200"
                >
                  {">"} Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Settings Modal */}
      {showEmailSettings && anonymousUser?.key && (
        <EmailSettings
          userKey={anonymousUser.key}
          onClose={() => setShowEmailSettings(false)}
        />
      )}
    </div>
  );
}

// Helper function to count all nested replies
const countAllReplies = (replies: any[]): number => {
  if (!replies || replies.length === 0) return 0;

  let total = replies.length;
  replies.forEach((reply) => {
    if (reply.replies && reply.replies.length > 0) {
      total += countAllReplies(reply.replies);
    }
  });
  return total;
};

function IdeaCard({
  idea,
  onVote,
  anonymousUser,
  onReplyAdded,
}: {
  idea: IdeaWithReplies;
  onVote: (id: string, vote: "stable" | "unstable") => void;
  anonymousUser: { id: string; name: string; key?: string } | null;
  onReplyAdded: (ideaId: string, newReply: any) => void;
}) {
  const [showReplies, setShowReplies] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [visibleReplies, setVisibleReplies] = useState(5); // Show first 5 replies initially

  // Reset visible replies when showReplies changes
  useEffect(() => {
    if (showReplies) {
      setVisibleReplies(5);
    }
  }, [showReplies]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !anonymousUser) return;

    setSubmittingReply(true);
    try {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Reply to: ${idea.title}`,
          content: replyContent,
          parentId: idea._id,
          author: {
            userId: anonymousUser.id,
            name: anonymousUser.name,
            twitterHandle: anonymousUser.name,
            isAnonymous: true,
          },
        }),
      });

      if (response.ok) {
        const newReply = await response.json();
        setReplyContent("");
        setShowReplies(true);
        // Use callback to update parent idea's replies array
        onReplyAdded(idea._id!, newReply);
      }
    } catch (error) {
      console.error("Error posting reply:", error);
    } finally {
      setSubmittingReply(false);
    }
  };

  const stableVotes = idea.votes.stable.length;
  const unstableVotes = idea.votes.unstable.length;
  const totalVotes = stableVotes + unstableVotes;

  return (
    <div className="bg-black border border-blue-600 p-4 sm:p-6 font-mono w-full shadow-lg shadow-blue-900/20">
      {/* Terminal Header */}
      <div className="flex items-center justify-between mb-4 border-b border-blue-600 pb-2">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm shadow-red-500/30"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-sm shadow-yellow-500/30"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm shadow-green-500/30 animate-pulse"></div>
        </div>
        <div className="text-blue-500 text-xs font-mono tracking-wider">
          idea_{idea._id?.slice(-8)}.txt
        </div>
      </div>

      {/* Author Info */}
      <div className="mb-4 text-left">
        <div className="text-blue-500 font-mono text-sm mb-1">
          user@{idea.author.twitterHandle || "DEGEN"}:
        </div>
        <div className="text-blue-400/70 text-xs font-mono">
          {new Date(idea.createdAt!).toLocaleDateString()}
        </div>
      </div>

      {/* Content */}
      <div className="mb-6">
        <h3 className="text-blue-100 font-mono text-lg mb-3 font-semibold text-left">
          {idea.title}
        </h3>
        <div className="text-blue-700 font-mono text-xs mb-1 opacity-50 text-left">
          {">"} desc:
        </div>
        <p className="text-blue-200 font-mono leading-relaxed whitespace-pre-wrap text-left">
          {idea.content}
        </p>
      </div>

      {/* Voting */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => onVote(idea._id!, "unstable")}
          disabled={!anonymousUser}
          className={`font-mono text-xs px-1 sm:px-2 py-1 transition-all duration-200 border border-transparent hover:border-green-500/30 ${
            idea.userVote === "unstable"
              ? "text-green-300 bg-green-900/30 border-green-500/50"
              : anonymousUser
              ? "text-green-500 hover:text-green-300 hover:bg-green-900/20"
              : "text-gray-500 cursor-not-allowed"
          }`}
        >
          <span className="hidden sm:inline">UNSTABLE </span>+
          {idea.votes.unstable.length}
        </button>

        <button
          onClick={() => onVote(idea._id!, "stable")}
          disabled={!anonymousUser}
          className={`font-mono text-xs px-1 sm:px-2 py-1 transition-all duration-200 border border-transparent hover:border-red-500/30 ${
            idea.userVote === "stable"
              ? "text-red-300 bg-red-900/30 border-red-500/50"
              : anonymousUser
              ? "text-red-500 hover:text-red-300 hover:bg-red-900/20"
              : "text-gray-500 cursor-not-allowed"
          }`}
        >
          <span className="hidden sm:inline">STABLE </span>-
          {idea.votes.stable.length}
        </button>
      </div>

      {/* Reply Section */}
      <div className="border-t border-blue-400 pt-4">
        <button
          onClick={() => setShowReplies(!showReplies)}
          className="text-blue-200 hover:text-white font-bold mb-2 font-mono tracking-wider border border-transparent hover:border-blue-400/30 px-2 py-1 transition-all duration-200"
        >
          {countAllReplies(idea.replies || [])} REPLIES
        </button>

        {/* Display Replies */}
        {showReplies && idea.replies && idea.replies.length > 0 && (
          <div className="mt-4 space-y-2">
            {idea.replies
              .slice(0, visibleReplies)
              .map((reply: any, index: number) => (
                <ReplyCard
                  key={reply._id || index}
                  reply={reply}
                  anonymousUser={anonymousUser}
                  onVote={onVote}
                  onReplyAdded={onReplyAdded}
                  depth={0}
                />
              ))}

            {/* Load More Button */}
            {idea.replies && idea.replies.length > visibleReplies && (
              <div className="mt-4 text-center">
                <button
                  onClick={() =>
                    setVisibleReplies((prev) =>
                      Math.min(prev + 5, idea.replies?.length || 0)
                    )
                  }
                  className="text-blue-400 hover:text-blue-300 text-xs font-mono bg-blue-900/30 hover:bg-blue-900/50 px-3 py-1 rounded border border-blue-600 transition-colors"
                >
                  LOAD MORE ({(idea.replies?.length || 0) - visibleReplies}{" "}
                  remaining)
                </button>
              </div>
            )}
          </div>
        )}

        {showReplies && anonymousUser && (
          <div className="mt-4 space-y-4">
            <form onSubmit={handleReply} className="space-y-2">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="w-full bg-blue-800/50 border-2 border-blue-400 rounded-lg px-3 py-2 text-white placeholder-blue-300 focus:outline-none focus:border-blue-300 focus:shadow-lg focus:shadow-blue-500/20 resize-none font-mono"
                placeholder="ADD YOUR REPLY..."
                rows={3}
                maxLength={1000}
              />
              <button
                type="submit"
                disabled={submittingReply || !replyContent.trim()}
                className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition-colors font-mono tracking-wider shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
              >
                {submittingReply ? "POSTING..." : "POST REPLY"}
              </button>
            </form>
          </div>
        )}

        {showReplies && !anonymousUser && (
          <div className="mt-4 p-4 bg-blue-800/30 rounded-lg text-center border border-blue-400">
            <p className="text-blue-200 mb-2">
              Initialize user to reply to this idea
            </p>
            <div className="text-blue-300 text-sm">
              User initialization in progress...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Reddit-style Reply Card Component
function ReplyCard({
  reply,
  anonymousUser,
  onVote,
  onReplyAdded,
  depth = 0,
}: {
  reply: any;
  anonymousUser: { id: string; name: string; key?: string } | null;
  onVote: (id: string, vote: "stable" | "unstable") => void;
  onReplyAdded: (ideaId: string, newReply: any) => void;
  depth?: number;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [visibleNestedReplies, setVisibleNestedReplies] = useState(3); // Show first 3 nested replies initially

  // Calculate user vote for this reply
  const hasVotedStable = reply.votes?.stable?.includes(anonymousUser?.id);
  const hasVotedUnstable = reply.votes?.unstable?.includes(anonymousUser?.id);
  const userVote = hasVotedStable
    ? "stable"
    : hasVotedUnstable
    ? "unstable"
    : null;

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !anonymousUser) return;

    setSubmittingReply(true);
    try {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Reply to: ${reply.title}`,
          content: replyContent,
          parentId: reply._id,
          author: {
            userId: anonymousUser.id,
            name: anonymousUser.name,
            twitterHandle: anonymousUser.name,
            isAnonymous: true,
          },
        }),
      });

      if (response.ok) {
        const newReply = await response.json();
        setReplyContent("");
        setShowReplyForm(false);
        // Use callback to update the current reply's replies array
        onReplyAdded(reply._id, newReply);
      }
    } catch (error) {
      console.error("Error posting reply:", error);
    } finally {
      setSubmittingReply(false);
    }
  };

  const maxDepth = 5; // Limit nesting depth like Reddit
  const maxVisualDepth = 2; // Maximum visual indentation depth for mobile
  const shouldShowReplyButton = depth < maxDepth;

  // Mobile-friendly threading: flatten visual hierarchy after depth 2
  const isMobileThread = depth > maxVisualDepth;

  // Responsive indentation: less aggressive on mobile
  const getIndentationClass = () => {
    if (depth === 0) return "";
    if (depth <= maxVisualDepth) {
      return "ml-4 sm:ml-6 border-l-2 border-blue-600 pl-3 sm:pl-4"; // Responsive indentation
    }
    return "ml-2"; // Minimal indentation for deep threads
  };

  return (
    <div className={getIndentationClass()}>
      {/* Mobile-friendly thread indicator */}
      {isMobileThread && (
        <div className="text-xs text-blue-400/70 mb-2 font-mono bg-blue-900/20 px-2 py-1 rounded border border-blue-600/30">
          ↳ Thread continuation (level {depth})
        </div>
      )}

      {/* Reply Content */}
      <div
        className={`${
          isMobileThread
            ? "bg-blue-900/10 border-blue-600/30"
            : "bg-blue-800/20 border-blue-500/50"
        } border rounded-lg p-3 mb-2`}
      >
        {/* Author Info */}
        <div className="mb-2 text-left">
          <div className="flex items-center space-x-2 mb-1">
            <div className="text-blue-200 text-xs font-mono">
              @{reply.author?.name || "DEGEN"}
            </div>
            {/* Reply context for deep threads */}
            {isMobileThread && (
              <div className="text-blue-400/60 text-xs font-mono">
                (reply to thread)
              </div>
            )}
          </div>
          <div className="text-blue-400/70 text-xs">
            {new Date(reply.createdAt).toLocaleDateString()}
          </div>
        </div>

        {/* Reply Text */}
        <p className="text-blue-100 text-sm whitespace-pre-wrap mb-3 text-left">
          {reply.content}
        </p>

        {/* Voting and Actions */}
        <div className="flex items-center space-x-4">
          {/* UNSTABLE Vote */}
          <button
            onClick={() => onVote(reply._id, "unstable")}
            disabled={!anonymousUser}
            className={`font-mono text-xs px-1 sm:px-2 py-1 transition-all duration-200 ${
              userVote === "unstable"
                ? "text-green-300 bg-green-900/30"
                : anonymousUser
                ? "text-green-500 hover:text-green-300 hover:bg-green-900/20"
                : "text-gray-500 cursor-not-allowed"
            }`}
          >
            <span className="hidden sm:inline">UNSTABLE </span>+
            {reply.votes?.unstable?.length || 0}
          </button>

          {/* STABLE Vote */}
          <button
            onClick={() => onVote(reply._id, "stable")}
            disabled={!anonymousUser}
            className={`font-mono text-xs px-1 sm:px-2 py-1 transition-all duration-200 ${
              userVote === "stable"
                ? "text-red-300 bg-red-900/30"
                : anonymousUser
                ? "text-red-500 hover:text-red-300 hover:bg-red-900/20"
                : "text-gray-500 cursor-not-allowed"
            }`}
          >
            <span className="hidden sm:inline">STABLE </span>-
            {reply.votes?.stable?.length || 0}
          </button>

          {/* Reply Button */}
          {shouldShowReplyButton && anonymousUser && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-blue-400 hover:text-blue-300 text-xs font-mono"
            >
              Reply
            </button>
          )}
        </div>
      </div>

      {/* Reply Form */}
      {showReplyForm && shouldShowReplyButton && (
        <div className="mb-4">
          <form onSubmit={handleReply} className="space-y-3">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="w-full bg-black border border-blue-600 px-3 py-2 text-blue-200 font-mono focus:outline-none focus:border-blue-400 h-20 resize-none text-sm"
              placeholder="Reply to this comment..."
              maxLength={600}
              required
            />
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={submittingReply || !replyContent.trim()}
                className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 disabled:bg-gray-400 text-white font-bold py-1 px-3 rounded text-sm transition-colors"
              >
                {submittingReply ? "POSTING..." : "POST REPLY"}
              </button>
              <button
                type="button"
                onClick={() => setShowReplyForm(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Nested Replies */}
      {reply.replies && reply.replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {reply.replies
            .slice(0, visibleNestedReplies)
            .map((nestedReply: any, index: number) => (
              <ReplyCard
                key={nestedReply._id || index}
                reply={nestedReply}
                anonymousUser={anonymousUser}
                onVote={onVote}
                onReplyAdded={onReplyAdded}
                depth={depth + 1}
              />
            ))}

          {/* Load More Nested Replies */}
          {reply.replies && reply.replies.length > visibleNestedReplies && (
            <div className="mt-2 text-center">
              <button
                onClick={() =>
                  setVisibleNestedReplies((prev) =>
                    Math.min(prev + 3, reply.replies?.length || 0)
                  )
                }
                className="text-blue-500 hover:text-blue-400 text-xs font-mono bg-blue-900/20 hover:bg-blue-900/40 px-2 py-1 rounded border border-blue-700 transition-colors"
              >
                +{(reply.replies?.length || 0) - visibleNestedReplies} more
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
