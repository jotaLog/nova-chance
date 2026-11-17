import { api } from "./api";
import { getToken } from "./storage";

export interface TradingClothes {
  id_roupa: number;
  id_usuario: number;
  nome: string;
  descricao: string | null;
  imagem_url: string | null;
  marca: string | null;
  estado: string | null;
  categoria: string | null;
  tamanho: string | null;
  nome_usuario: string;
  foto_perfil: string | null;
  favorita: number | boolean;
  total_interesses: number;
  disponivel_troca?: number | boolean;
}

export interface IncomingClothesExchange {
  id_troca: number;
  id_roupa_solicitada: number;
  nome_roupa: string;
  imagem_url: string | null;
  nome_solicitante: string;
  foto_perfil: string | null;
  mensagem_proposta: string | null;
  data_criacao: string;
}

async function getAuthHeaders() {
  const token = await getToken();
  if (!token) {
    throw new Error("Você precisa estar logado para acessar o feed de trocas.");
  }
  return { Authorization: `Bearer ${token}` };
}

export async function getTradingClothes() {
  const response = await api.get<TradingClothes[]>("/clothes/trading", {
    headers: await getAuthHeaders(),
  });
  return response.data;
}

export async function getMyClothes() {
  const response = await api.get<TradingClothes[]>("/clothes/mine", {
    headers: await getAuthHeaders(),
  });
  return response.data;
}

export async function getFavoriteClothes() {
  const response = await api.get<TradingClothes[]>("/clothes/favorites", {
    headers: await getAuthHeaders(),
  });
  return response.data;
}

export async function setClothesAvailability(
  id: number,
  disponivel_troca: boolean
) {
  await api.put(
    `/clothes/${id}/availability`,
    { disponivel_troca },
    { headers: await getAuthHeaders() }
  );
}

export async function setClothesFavorite(id: number, favorita: boolean) {
  await api.put(
    `/clothes/${id}/favorite`,
    { favorita },
    { headers: await getAuthHeaders() }
  );
}

export async function requestClothesExchange(id: number) {
  const response = await api.post<{ id_troca: number; message: string }>(
    `/clothes/${id}/exchanges`,
    {},
    { headers: await getAuthHeaders() }
  );
  return response.data;
}

export async function getIncomingClothesExchanges() {
  const response = await api.get<IncomingClothesExchange[]>(
    "/clothes/exchanges",
    { headers: await getAuthHeaders() }
  );
  return response.data;
}

export async function respondToClothesExchange(
  id: number,
  status: "aceita" | "recusada"
) {
  await api.put(
    `/clothes/exchanges/${id}`,
    { status },
    { headers: await getAuthHeaders() }
  );
}
