import { io, Socket } from "socket.io-client";
import { api } from "./api";
import { getToken } from "./storage";

export interface DirectMessage {
  id_mensagem: number;
  id_remetente: number;
  id_destinatario: number;
  mensagem: string;
  data_envio: string;
  lida: boolean | number;
}

export interface ConversationSummary {
  id_usuario: number;
  nome: string;
  foto_perfil: string | null;
  ultima_mensagem: string;
  data_envio: string;
  nao_lidas: number;
}

export async function getConversations() {
  const token = await getToken();
  if (!token) throw new Error("Você precisa estar logado para acessar as mensagens.");
  const response = await api.get<ConversationSummary[]>("/messages/conversations", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function getConversationMessages(userId: number) {
  const token = await getToken();
  if (!token) throw new Error("Você precisa estar logado para acessar as mensagens.");
  const response = await api.get<DirectMessage[]>(`/messages/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}

export async function createMessageSocket(): Promise<Socket> {
  const token = await getToken();
  if (!token) throw new Error("Você precisa estar logado para acessar o chat.");
  return io(api.defaults.baseURL ?? "http://192.168.100.73:3000", {
    auth: { token },
    autoConnect: false,
  });
}
