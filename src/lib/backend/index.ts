import { jsonBackend } from "./json";
import { supabaseBackend } from "./supabase";

export const supabaseHazir = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
export const backend = () => (supabaseHazir() ? supabaseBackend : jsonBackend);
