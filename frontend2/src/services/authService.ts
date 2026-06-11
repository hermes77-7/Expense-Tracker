import api from "../api/axios";

import type { AuthResponse } from "../types/auth";

export interface RegisterData {
  name: string;

  email: string;

  password: string;
}

export interface LoginData {
  email: string;

  password: string;
}

export const registerUser = async (data: RegisterData) => {
  const response = await api.post<AuthResponse>("/auth/register", data);

  return response.data;
};

export const loginUser = async (data: LoginData) => {
  const response = await api.post<AuthResponse>("/auth/login", data);

  return response.data;
};
