import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Socket } from "socket.io-client";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  createMessageSocket,
  DirectMessage,
  getConversationMessages,
} from "../../services/messageService";
import { getLoggedUser } from "../../services/storage";
import { getUserProfile } from "../../services/authService";
import { api } from "../../services/api";

interface MessageAck {
  error?: string;
  message?: DirectMessage;
}

function param(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function addUniqueMessage(messages: DirectMessage[], incoming: DirectMessage) {
  return messages.some((message) => message.id_mensagem === incoming.id_mensagem)
    ? messages
    : [...messages, incoming].sort(
        (left, right) => left.id_mensagem - right.id_mensagem
      );
}

function imageUri(url?: string) {
  if (!url) return undefined;
  return /^https?:\/\//i.test(url) ? url : `${api.defaults.baseURL}${url}`;
}

export default function Conversation() {
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const params = useLocalSearchParams<{
    id?: string | string[];
    name?: string | string[];
    photo?: string | string[];
    initialMessage?: string | string[];
  }>();
  const peerId = Number(param(params.id));
  const initialMessage = param(params.initialMessage) ?? "";
  const [peerName, setPeerName] = useState(param(params.name) ?? "Conversa");
  const [peerPhoto, setPeerPhoto] = useState(param(params.photo) ?? "");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [draft, setDraft] = useState(() => initialMessage);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList<DirectMessage>>(null);

  useEffect(() => {
    if (Platform.OS === "web") return;

    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSubscription = Keyboard.addListener(showEvent, () =>
      setKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(hideEvent, () =>
      setKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    let active = true;
    let activeSocket: Socket | null = null;

    async function startConversation() {
      setLoading(true);
      setError(null);
      try {
        if (!Number.isInteger(peerId) || peerId <= 0) {
          throw new Error("Conversa inválida.");
        }
        const [user, history, chatSocket] = await Promise.all([
          getLoggedUser(),
          getConversationMessages(peerId),
          createMessageSocket(),
        ]);
        if (!user) throw new Error("Faça login para acessar suas mensagens.");
        if (!active) {
          chatSocket.disconnect();
          return;
        }
        activeSocket = chatSocket;
        setCurrentUserId(Number(user.id_usuario));
        setMessages(history);

        if (!param(params.name)) {
          const peer = await getUserProfile(peerId);
          if (active) {
            setPeerName(peer.nome);
            setPeerPhoto(peer.foto_perfil ?? "");
          }
        }

        chatSocket.on("connect", () => {
          if (active) {
            setConnected(true);
            setError(null);
          }
        });
        chatSocket.on("disconnect", () => {
          if (active) setConnected(false);
        });
        chatSocket.on("connect_error", (connectionError: Error) => {
          if (active) {
            setConnected(false);
            setError(connectionError.message || "Não foi possível conectar ao chat.");
          }
        });
        chatSocket.on("message:new", (message: DirectMessage) => {
          if (
            active &&
            (Number(message.id_remetente) === peerId ||
              Number(message.id_destinatario) === peerId)
          ) {
            setMessages((current) => addUniqueMessage(current, message));
          }
        });
        setSocket(chatSocket);
        chatSocket.connect();
      } catch (startError: unknown) {
        console.error("Erro ao abrir conversa:", startError);
        if (active) {
          setError(
            startError instanceof Error
              ? startError.message
              : "Não foi possível abrir a conversa."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void startConversation();
    return () => {
      active = false;
      activeSocket?.disconnect();
    };
  }, [peerId, params.name]);

  async function sendMessage() {
    const content = draft.trim();
    if (!content || sending || !socket?.connected || !currentUserId) return;

    setSending(true);
    setError(null);
    try {
      const result = await new Promise<MessageAck>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("O servidor não confirmou o envio da mensagem.")),
          10000
        );
        socket.emit(
          "message:send",
          { recipientId: peerId, message: content },
          (acknowledgement: MessageAck) => {
            clearTimeout(timeout);
            resolve(acknowledgement);
          }
        );
      });
      if (result.error || !result.message) {
        throw new Error(result.error ?? "Não foi possível enviar a mensagem.");
      }
      setMessages((current) => addUniqueMessage(current, result.message!));
      setDraft("");
    } catch (sendError: unknown) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Não foi possível enviar a mensagem."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={22} color="#FFF" />
        </Pressable>
        {imageUri(peerPhoto) ? (
          <Image source={{ uri: imageUri(peerPhoto) }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Feather name="user" size={18} color="#3CFF00" />
          </View>
        )}
        <Pressable
          style={styles.peerInfo}
          onPress={() =>
            router.push({ pathname: "/userProfile", params: { id: String(peerId) } })
          }
        >
          <Text style={styles.peerName}>{peerName}</Text>
          <Text style={styles.connection}>
            {connected ? "online" : "conectando..."}
          </Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#3CFF00" />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          style={styles.messageListViewport}
          data={messages}
          keyExtractor={(item) => String(item.id_mensagem)}
          contentContainerStyle={styles.messageList}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <Text style={styles.empty}>Diga oi e comece a conversa.</Text>
          }
          renderItem={({ item }) => {
            const ownMessage = Number(item.id_remetente) === currentUserId;
            return (
              <View
                style={[
                  styles.messageBubble,
                  ownMessage ? styles.ownMessage : styles.otherMessage,
                ]}
              >
                <Text style={[styles.messageText, ownMessage && styles.ownMessageText]}>
                  {item.mensagem}
                </Text>
              </View>
            );
          }}
        />
      )}

      <View
        style={[
          styles.composer,
          {
            paddingBottom: keyboardVisible
              ? 12
              : Math.max(insets.bottom, 12),
          },
        ]}
      >
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Escreva uma mensagem..."
          placeholderTextColor="#777"
          style={styles.input}
          maxLength={2000}
          multiline
          onSubmitEditing={() => void sendMessage()}
          accessibilityLabel="Escreva uma mensagem"
        />
        <Pressable
          onPress={() => void sendMessage()}
          disabled={!draft.trim() || sending || !connected}
          style={[styles.sendButton, (!connected || sending) && styles.disabledButton]}
          accessibilityRole="button"
          accessibilityLabel="Enviar mensagem"
        >
          <Feather name="send" size={18} color="#000" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  backButton: {
    width: 30,
    alignItems: "flex-start",
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#222",
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  peerInfo: {
    flex: 1,
  },
  peerName: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  connection: {
    marginTop: 2,
    color: "#3CFF00",
    fontSize: 11,
  },
  messageList: {
    flexGrow: 1,
    justifyContent: "flex-end",
    padding: 14,
    gap: 10,
  },
  messageListViewport: {
    flex: 1,
    minHeight: 0,
  },
  messageBubble: {
    maxWidth: "82%",
    paddingVertical: 10,
    paddingHorizontal: 13,
    borderRadius: 6,
  },
  ownMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#3CFF00",
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#1D1D1D",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: "#FFF",
    fontSize: 14,
    lineHeight: 19,
  },
  ownMessageText: {
    color: "#000",
  },
  empty: {
    paddingVertical: 20,
    color: "#888",
    textAlign: "center",
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    paddingHorizontal: 16,
    paddingTop: 8,
    color: "#FF8A8A",
    fontSize: 12,
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "#222",
  },
  input: {
    flex: 1,
    maxHeight: 110,
    minHeight: 42,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
    color: "#FFF",
    backgroundColor: "#1A1A1A",
  },
  sendButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: "#3CFF00",
  },
  disabledButton: {
    opacity: 0.45,
  },
});
