"use client";
import { useState, useEffect } from "react";
export type Lang = "EN" | "FR" | "CN";
export const translations = { EN: { auth: { loginButton: "Login" } }, FR: { auth: { loginButton: "Connexion" } }, CN: { auth: { loginButton: "登录" } } };
export function useI18n() { return { t: translations.EN, lang: "EN", setLanguage: () => {} }; }
