import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function apiRequest(path, token, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
      ...(options.headers || {}),
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.message || `HTTP ${response.status}`
    );
  }

  return result;
}

function App() {
  // ==========================================
  // AUTH STATE
  // ==========================================

  const [token, setToken] = useState(
    () => localStorage.getItem("chatToken") || ""
  );

  const [user, setUser] = useState(() => {
    try {
      return (
        JSON.parse(
          localStorage.getItem("chatUser")
        ) || null
      );
    } catch {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState("login");

  const [authForm, setAuthForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  // ==========================================
  // CHAT STATE
  // ==========================================

  const [conversations, setConversations] =
    useState([]);

  const [conversation, setConversation] =
    useState(null);

  const [messages, setMessages] = useState([]);

  const [messageText, setMessageText] =
    useState("");

  const [search, setSearch] = useState("");

  const [users, setUsers] = useState([]);

  const [loading, setLoading] =
    useState(false);

  const [messagesLoading, setMessagesLoading] =
    useState(false);

  const [searchLoading, setSearchLoading] =
    useState(false);

  const [error, setError] = useState("");

  const [status, setStatus] = useState(
    "Backend-ə qoşulmayıb"
  );

  const [mobileSidebar, setMobileSidebar] =
    useState(false);

  // ==========================================
  // REFS
  // ==========================================

  const socketRef = useRef(null);

  const conversationRef = useRef(null);

  const userRef = useRef(null);

  const bottomRef = useRef(null);

  // ==========================================
  // SYNC REFS
  // ==========================================

  useEffect(() => {
    conversationRef.current =
      conversation;
  }, [conversation]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // ==========================================
  // HELPERS
  // ==========================================

  const getId = (value) => {
    if (!value) return "";

    if (typeof value === "string") {
      return value;
    }

    return (
      value._id ||
      value.id ||
      ""
    );
  };

  const getUserName = (value) => {
    if (!value) return "Unknown";

    return (
      value.username ||
      value.name ||
      value.email ||
      "Unknown"
    );
  };

  const getMessageText = (message) => {
    return (
      message?.text ||
      message?.content ||
      message?.message ||
      ""
    );
  };

  const formatTime = (date) => {
    if (!date) return "";

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
      return "";
    }

    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const showError = (message) => {
    setError(
      message || "Naməlum xəta baş verdi"
    );
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const logout = useCallback(() => {
    socketRef.current?.disconnect();

    socketRef.current = null;

    setToken("");
    setUser(null);

    setConversations([]);
    setConversation(null);
    setMessages([]);
    setUsers([]);

    setMessageText("");
    setSearch("");
    setError("");

    localStorage.removeItem("chatToken");
    localStorage.removeItem("chatUser");
  }, []);

  // ==========================================
  // LOGIN / REGISTER
  // ==========================================

  const handleAuthSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const path =
        authMode === "login"
          ? "/api/auth/login"
          : "/api/auth/register";

      const body =
        authMode === "login"
          ? {
              email: authForm.email,
              password:
                authForm.password,
            }
          : {
              username:
                authForm.username,
              email: authForm.email,
              password:
                authForm.password,
            };

      const result = await apiRequest(
        path,
        "",
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );

      /*
       * Backend response strukturuna görə
       * mümkün variantları dəstəkləyirik.
       */

      const receivedToken =
        result.token ||
        result.accessToken ||
        result.data?.token;

      const receivedUser =
        result.user ||
        result.data?.user;

      if (!receivedToken) {
        throw new Error(
          "Backend token göndərmədi"
        );
      }

      setToken(receivedToken);

      setUser(receivedUser || null);

      localStorage.setItem(
        "chatToken",
        receivedToken
      );

      if (receivedUser) {
        localStorage.setItem(
          "chatUser",
          JSON.stringify(receivedUser)
        );
      }

      setAuthForm({
        username: "",
        email: "",
        password: "",
      });
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // GET CONVERSATIONS
  //
  // GET /api/conversations
  // ==========================================

  const loadConversations =
    useCallback(async () => {
      if (!token) return;

      try {
        const result =
          await apiRequest(
            "/api/conversations",
            token
          );

        const list =
          result.conversations ||
          result.data ||
          result ||
          [];

        setConversations(
          Array.isArray(list)
            ? list
            : []
        );
      } catch (err) {
        showError(err.message);
      }
    }, [token]);

  // ==========================================
  // INITIAL DATA
  // ==========================================

  useEffect(() => {
    if (!token || !user) return;

    loadConversations();
  }, [
    token,
    user,
    loadConversations,
  ]);

  // ==========================================
  // USER SEARCH
  //
  // GET /api/users/search?search=...
  // ==========================================

  useEffect(() => {
    if (!token) return;

    const query = search.trim();

    if (!query) {
      setUsers([]);
      return;
    }

    const timer = setTimeout(
      async () => {
        setSearchLoading(true);

        try {
          const result =
            await apiRequest(
              `/api/users/search?search=${encodeURIComponent(
                query
              )}`,
              token
            );

          const list =
            result.users ||
            result.data ||
            result ||
            [];

          setUsers(
            Array.isArray(list)
              ? list
              : []
          );
        } catch (err) {
          showError(err.message);
        } finally {
          setSearchLoading(false);
        }
      },
      400
    );

    return () =>
      clearTimeout(timer);
  }, [search, token]);

  // ==========================================
  // SOCKET CONNECTION
  // ==========================================

  useEffect(() => {
    if (!token || !user) return;

    const socket = io(API, {
      auth: {
        token,
      },
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus("Backend-ə qoşulub");
      setError("");
    });

    socket.on("disconnect", () => {
      setStatus(
        "Backend-ə qoşulmayıb"
      );
    });

    socket.on(
      "connect_error",
      (err) => {
        setStatus(
          "Socket qoşulma xətası"
        );

        setError(err.message);
      }
    );

    socket.on(
      "conversation:joined",
      ({ conversationId }) => {
        console.log(
          "Conversation-a qoşuldun:",
          conversationId
        );
      }
    );

    socket.on(
      "message:new",
      (message) => {
        const active =
          conversationRef.current;

        if (!active) return;

        const messageConversation =
          getId(
            message.conversation
          );

        if (
          String(messageConversation) ===
          String(getId(active))
        ) {
          setMessages((previous) => {
            const exists =
              previous.some(
                (item) =>
                  String(item._id) ===
                  String(message._id)
              );

            if (exists) {
              return previous;
            }

            return [
              ...previous,
              message,
            ];
          });

          setTimeout(() => {
            bottomRef.current?.scrollIntoView(
              {
                behavior: "smooth",
              }
            );
          }, 50);
        }
      }
    );

    socket.on("error", (payload) => {
      setError(
        payload?.message ||
          "Server xətası"
      );
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user]);

  // ==========================================
  // LOAD MESSAGES
  //
  // GET /api/messages/:conversationId
  // ==========================================

  const loadMessages = async (
    conversationId
  ) => {
    if (!conversationId) return;

    setMessagesLoading(true);

    try {
      const result =
        await apiRequest(
          `/api/messages/${conversationId}`,
          token
        );

      const list =
        result.messages ||
        result.data ||
        result ||
        [];

      setMessages(
        Array.isArray(list)
          ? list
          : []
      );
    } catch (err) {
      showError(err.message);
    } finally {
      setMessagesLoading(false);
    }
  };

  // ==========================================
  // OPEN CONVERSATION
  //
  // POST /api/conversations
  // ==========================================

  const openConversation = async (
    selectedUser
  ) => {
    if (!selectedUser || !token) {
      return;
    }

    setError("");
    setMobileSidebar(false);

    try {
      const selectedUserId =
        getId(selectedUser);

      /*
       * Backend controller-in gözlədiyi
       * field adını burada istifadə edirik.
       *
       * Əgər controller-də "userId" yox,
       * "participantId" istifadə edirsə,
       * aşağıdakı adı dəyiş.
       */

      const result =
        await apiRequest(
          "/api/conversations",
          token,
          {
            method: "POST",
            body: JSON.stringify({
              userId:
                selectedUserId,
            }),
          }
        );

      const conv =
        result.conversation ||
        result.data ||
        result;

      if (!conv?._id && !conv?.id) {
        throw new Error(
          "Conversation backend-dən düzgün qayıtmadı"
        );
      }

      setConversation(conv);

      conversationRef.current =
        conv;

      // Socket room
      socketRef.current?.emit(
        "conversation:join",
        {
          conversationId:
            getId(conv),
        }
      );

      await loadMessages(
        getId(conv)
      );

      // Conversation list-i yenilə
      await loadConversations();
    } catch (err) {
      showError(err.message);
    }
  };

  // ==========================================
  // OPEN EXISTING CONVERSATION
  // ==========================================

  const openExistingConversation =
    async (conv) => {
      if (!conv) return;

      setError("");
      setMobileSidebar(false);

      setConversation(conv);

      conversationRef.current =
        conv;

      const conversationId =
        getId(conv);

      socketRef.current?.emit(
        "conversation:join",
        {
          conversationId,
        }
      );

      await loadMessages(
        conversationId
      );
    };

  // ==========================================
  // SEND MESSAGE
  //
  // IMPORTANT:
  // REST backend-də POST message route-u
  // yoxdur.
  //
  // Ona görə Socket.IO istifadə olunur.
  // ==========================================

  const sendMessage = (e) => {
    e?.preventDefault();

    const text =
      messageText.trim();

    if (!text || !conversation) {
      return;
    }

    const conversationId =
      getId(conversation);

    if (
      !socketRef.current ||
      !socketRef.current.connected
    ) {
      showError(
        "Socket serverə qoşulu deyil"
      );

      return;
    }

    socketRef.current.emit(
      "message:send",
      {
        conversationId,
        text,
      }
    );

    setMessageText("");
  };

  // ==========================================
  // SCROLL TO BOTTOM
  // ==========================================

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  // ==========================================
  // GET OTHER USER FROM CONVERSATION
  // ==========================================

  const getOtherUser = (
    conv
  ) => {
    if (!conv) return null;

    const participants =
      conv.participants ||
      conv.users ||
      [];

    return participants.find(
      (item) =>
        String(getId(item)) !==
        String(getId(user))
    );
  };

  // ==========================================
  // AUTH PAGE
  // ==========================================

  if (!token || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16h6m5-4a8 8 0 11-16 0 8 8 0 0016 0z"
                />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-white">
              ChatApp
            </h1>

            <p className="text-slate-400 mt-2">
              Real-time mesajlaşma
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="grid grid-cols-2 bg-slate-800 rounded-xl p-1 mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setError("");
                }}
                className={`py-2.5 rounded-lg text-sm font-medium transition ${
                  authMode ===
                  "login"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Daxil ol
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode(
                    "register"
                  );
                  setError("");
                }}
                className={`py-2.5 rounded-lg text-sm font-medium transition ${
                  authMode ===
                  "register"
                    ? "bg-indigo-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Qeydiyyat
              </button>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <form
              onSubmit={
                handleAuthSubmit
              }
              className="space-y-4"
            >
              {authMode ===
                "register" && (
                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Username
                  </label>

                  <input
                    type="text"
                    value={
                      authForm.username
                    }
                    onChange={(e) =>
                      setAuthForm({
                        ...authForm,
                        username:
                          e.target.value,
                      })
                    }
                    placeholder="username"
                    required
                    className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-white outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Email
                </label>

                <input
                  type="email"
                  value={
                    authForm.email
                  }
                  onChange={(e) =>
                    setAuthForm({
                      ...authForm,
                      email:
                        e.target.value,
                    })
                  }
                  placeholder="example@mail.com"
                  required
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Şifrə
                </label>

                <input
                  type="password"
                  value={
                    authForm.password
                  }
                  onChange={(e) =>
                    setAuthForm({
                      ...authForm,
                      password:
                        e.target.value,
                    })
                  }
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <button
                disabled={loading}
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-3 transition"
              >
                {loading
                  ? "Gözləyin..."
                  : authMode ===
                    "login"
                  ? "Daxil ol"
                  : "Hesab yarat"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // CHAT PAGE
  // ==========================================

  return (
    <div className="h-screen bg-slate-950 text-white flex overflow-hidden">
      {mobileSidebar && (
        <div
          onClick={() =>
            setMobileSidebar(false)
          }
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
        />
      )}

      {/* ====================================
          SIDEBAR
      ==================================== */}

      <aside
        className={`
          fixed lg:relative z-40
          h-full w-80
          bg-slate-900
          border-r border-slate-800
          flex flex-col
          transition-transform duration-300
          ${
            mobileSidebar
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* User header */}
        <div className="h-20 px-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-11 w-11 flex-shrink-0 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-lg">
              {getUserName(
                user
              )
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="font-semibold truncate">
                {getUserName(user)}
              </p>

              <div className="flex items-center gap-1.5">
                <span
                  className={`h-2 w-2 rounded-full ${
                    status ===
                    "Backend-ə qoşulub"
                      ? "bg-emerald-500"
                      : "bg-red-500"
                  }`}
                />

                <span className="text-xs text-slate-400 truncate">
                  {status}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="text-slate-400 hover:text-red-400 transition ml-2"
            title="Çıxış"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1"
              />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35m2.35-5.65a8 8 0 11-16 0 8 8 0 0116 0z"
              />
            </svg>

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="İstifadəçi axtar..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-sm outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Search results */}
        {search.trim() && (
          <div className="px-2 pb-3">
            <div className="px-3 pb-2 text-xs uppercase tracking-wider text-slate-500">
              Axtarış
            </div>

            {searchLoading && (
              <div className="px-3 py-4 text-sm text-slate-500">
                Axtarılır...
              </div>
            )}

            {!searchLoading &&
              users.length === 0 && (
                <div className="px-3 py-4 text-sm text-slate-500">
                  İstifadəçi tapılmadı
                </div>
              )}

            {users.map((item) => (
              <button
                key={getId(item)}
                onClick={() =>
                  openConversation(
                    item
                  )
                }
                className="w-full p-3 rounded-xl flex items-center gap-3 text-left hover:bg-slate-800 transition"
              >
                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-semibold">
                  {getUserName(
                    item
                  )
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {getUserName(
                      item
                    )}
                  </p>

                  <p className="text-xs text-slate-500 truncate">
                    {item.email}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto px-2">
          <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Söhbətlər
          </div>

          {conversations.length ===
            0 && (
            <div className="px-3 py-10 text-center text-sm text-slate-500">
              Hələ söhbət yoxdur.
              <br />
              İstifadəçi axtararaq başla.
            </div>
          )}

          {conversations.map(
            (conv) => {
              const other =
                getOtherUser(
                  conv
                );

              const active =
                String(
                  getId(
                    conversation
                  )
                ) ===
                String(
                  getId(conv)
                );

              return (
                <button
                  key={getId(conv)}
                  onClick={() =>
                    openExistingConversation(
                      conv
                    )
                  }
                  className={`w-full p-3 rounded-xl flex items-center gap-3 text-left transition mb-1 ${
                    active
                      ? "bg-indigo-600/20"
                      : "hover:bg-slate-800"
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="h-11 w-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-semibold">
                      {getUserName(
                        other
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
                  </div>

                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {getUserName(
                        other
                      )}
                    </p>

                    <p className="text-xs text-slate-500 truncate">
                      {conv.lastMessage
                        ? getMessageText(
                            conv.lastMessage
                          )
                        : "Söhbət"}
                    </p>
                  </div>
                </button>
              );
            }
          )}
        </div>
      </aside>

      {/* ====================================
          MAIN
      ==================================== */}

      <main className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <header className="h-20 border-b border-slate-800 bg-slate-900/70 backdrop-blur flex items-center px-4 sm:px-6">
          <button
            onClick={() =>
              setMobileSidebar(true)
            }
            className="lg:hidden mr-3 text-slate-400"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {conversation ? (
            (() => {
              const other =
                getOtherUser(
                  conversation
                );

              return (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-semibold">
                    {getUserName(
                      other
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <p className="font-semibold">
                      {getUserName(
                        other
                      )}
                    </p>

                    <p className="text-xs text-emerald-400">
                      Söhbət aktivdir
                    </p>
                  </div>
                </div>
              );
            })()
          ) : (
            <div>
              <p className="font-semibold">
                Mesajlar
              </p>

              <p className="text-sm text-slate-500">
                Söhbət seçin
              </p>
            </div>
          )}
        </header>

        {/* Error */}
        {error && (
          <div className="mx-4 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 flex justify-between">
            <span>{error}</span>

            <button
              onClick={() =>
                setError("")
              }
              className="ml-4"
            >
              ×
            </button>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {!conversation ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-sm">
                <div className="mx-auto h-20 w-20 rounded-3xl bg-indigo-600/10 flex items-center justify-center mb-5">
                  <svg
                    className="w-10 h-10 text-indigo-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16h6m5-4a8 8 0 11-16 0 8 8 0 0016 0z"
                    />
                  </svg>
                </div>

                <h2 className="text-xl font-semibold mb-2">
                  Söhbətə başlayın
                </h2>

                <p className="text-slate-500 text-sm">
                  Yuxarıdakı axtarışdan
                  istifadəçi tap və
                  söhbətə başla.
                </p>
              </div>
            </div>
          ) : messagesLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex items-center gap-3 text-slate-400">
                <div className="h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                Mesajlar yüklənir...
              </div>
            </div>
          ) : messages.length ===
            0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-slate-500">
                <p className="text-lg">
                  Hələ mesaj yoxdur
                </p>

                <p className="text-sm mt-1">
                  İlk mesajı sən
                  göndər.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-3">
              {messages.map(
                (message) => {
                  const senderId =
                    getId(
                      message.sender ||
                        message.user ||
                        message.author
                    );

                  const isMine =
                    String(
                      senderId
                    ) ===
                    String(
                      getId(user)
                    );

                  return (
                    <div
                      key={
                        message._id ||
                        message.id
                      }
                      className={`flex ${
                        isMine
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div className="max-w-[80%] sm:max-w-[65%] flex flex-col">
                        <div
                          className={`px-4 py-3 rounded-2xl ${
                            isMine
                              ? "bg-indigo-600 text-white rounded-br-md"
                              : "bg-slate-800 text-slate-100 rounded-bl-md"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {getMessageText(
                              message
                            )}
                          </p>
                        </div>

                        <span
                          className={`text-[11px] text-slate-600 mt-1 px-1 ${
                            isMine
                              ? "text-right"
                              : "text-left"
                          }`}
                        >
                          {formatTime(
                            message.createdAt ||
                              message.created_at ||
                              message.timestamp
                          )}
                        </span>
                      </div>
                    </div>
                  );
                }
              )}

              <div
                ref={bottomRef}
              />
            </div>
          )}
        </div>

        {/* Input */}
        {conversation && (
          <div className="border-t border-slate-800 bg-slate-900/80 p-3 sm:p-4">
            <form
              onSubmit={sendMessage}
              className="max-w-4xl mx-auto flex items-end gap-2"
            >
              <textarea
                value={messageText}
                onChange={(e) =>
                  setMessageText(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {
                  if (
                    e.key ===
                      "Enter" &&
                    !e.shiftKey
                  ) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                rows={1}
                placeholder="Mesajınızı yazın..."
                className="flex-1 resize-none max-h-32 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 placeholder:text-slate-500"
              />

              <button
                type="submit"
                disabled={
                  !messageText.trim()
                }
                className="h-12 w-12 flex-shrink-0 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white flex items-center justify-center transition"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 12h14M12 5l7 7-7 7"
                  />
                </svg>
              </button>
            </form>

            <p className="max-w-4xl mx-auto text-[11px] text-slate-600 mt-2 px-1">
              Enter — göndər · Shift +
              Enter — yeni sətir
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
