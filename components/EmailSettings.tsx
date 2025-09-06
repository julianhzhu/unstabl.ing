import React, { useState, useEffect } from "react";

interface EmailSettingsProps {
  userKey: string;
  onClose: () => void;
}

interface NotificationPreferences {
  email: {
    enabled: boolean;
    onVote: boolean;
    onReply: boolean;
    onReplyToVoted: boolean;
    onReplyToReplied: boolean;
  };
}

export default function EmailSettings({
  userKey,
  onClose,
}: EmailSettingsProps) {
  const [email, setEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    email: {
      enabled: false,
      onVote: false,
      onReply: true,
      onReplyToVoted: false,
      onReplyToReplied: true,
    },
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSettings();
  }, [userKey]);

  // Refresh settings when component becomes visible (e.g., after email verification)
  useEffect(() => {
    const handleFocus = () => {
      fetchSettings();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`/api/email/notifications?key=${userKey}`);
      if (response.ok) {
        const data = await response.json();
        setEmail(data.email || "");
        setEmailVerified(data.emailVerified || false);
        setNotifications(data.notifications || notifications);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/email/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: userKey, email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        // Refresh settings to get the latest state
        setTimeout(() => {
          fetchSettings();
        }, 1000);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError("Failed to add email address");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNotifications = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/email/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: userKey, notifications }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Notification preferences updated successfully!");
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError("Failed to update notification preferences");
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = (
    key: keyof NotificationPreferences["email"],
    value: boolean
  ) => {
    setNotifications((prev) => ({
      ...prev,
      email: {
        ...prev.email,
        [key]: value,
      },
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-black border border-blue-600 p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto font-mono">
        <div className="flex justify-between items-center mb-4 border-b border-blue-600 pb-2">
          <h2 className="text-xl font-bold text-blue-400">
            Email & Notifications
          </h2>
          <button
            onClick={onClose}
            className="text-blue-300 hover:text-blue-200 text-2xl"
          >
            ×
          </button>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-green-900/20 border border-green-400 text-green-400 rounded">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-400 text-red-400 rounded">
            {error}
          </div>
        )}

        {/* Email Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-blue-300">
            Email Address
          </h3>

          {!emailVerified ? (
            <form onSubmit={handleAddEmail} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full p-3 bg-black border border-blue-600 text-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-blue-300"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Email Address"}
              </button>
            </form>
          ) : (
            <div className="p-3 bg-green-900/20 border border-green-400 text-green-400 rounded">
              ✓ Email verified: {email}
            </div>
          )}
        </div>

        {/* Notification Preferences */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-blue-300">
            Notification Preferences
          </h3>

          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={notifications.email.enabled}
                onChange={(e) =>
                  handleNotificationChange("enabled", e.target.checked)
                }
                className="mr-3"
                disabled={!emailVerified}
              />
              <span
                className={!emailVerified ? "text-blue-200" : "text-blue-200"}
              >
                Enable email notifications
              </span>
            </label>

            {notifications.email.enabled && emailVerified && (
              <div className="ml-6 space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notifications.email.onVote}
                    onChange={(e) =>
                      handleNotificationChange("onVote", e.target.checked)
                    }
                    className="mr-3"
                  />
                  <span className="text-blue-200">
                    When someone votes on my ideas
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notifications.email.onReply}
                    onChange={(e) =>
                      handleNotificationChange("onReply", e.target.checked)
                    }
                    className="mr-3"
                  />
                  <span className="text-blue-200">
                    When someone replies to my ideas
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notifications.email.onReplyToVoted}
                    onChange={(e) =>
                      handleNotificationChange(
                        "onReplyToVoted",
                        e.target.checked
                      )
                    }
                    className="mr-3"
                  />
                  <span className="text-blue-200">
                    When someone replies to ideas I voted on
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={notifications.email.onReplyToReplied}
                    onChange={(e) =>
                      handleNotificationChange(
                        "onReplyToReplied",
                        e.target.checked
                      )
                    }
                    className="mr-3"
                  />
                  <span className="text-blue-200">
                    When someone replies to ideas I replied to
                  </span>
                </label>
              </div>
            )}
          </div>

          {emailVerified && (
            <button
              onClick={handleUpdateNotifications}
              disabled={loading}
              className="mt-4 w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 font-mono"
            >
              {loading ? "Updating..." : "Update Preferences"}
            </button>
          )}
        </div>

        {!emailVerified && (
          <div className="text-sm bg-gray-800/50 border border-gray-600 p-3 rounded">
            <p className="font-semibold text-gray-200">
              📧 Add and verify your email address to enable notifications.
            </p>
            <p className="mt-1 text-gray-300">
              You'll receive a verification email after adding your address.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
