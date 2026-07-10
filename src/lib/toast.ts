import { toast as originalToast } from "sonner";

export function getFriendlyErrorMessage(error: unknown): string {
  if (!error) return "Terjadi kesalahan yang tidak dikenal.";

  if (error && typeof error === "object") {
    const errObj = error as any;
    const status = errObj.status || errObj.statusCode || errObj.context?.status;
    if (status === 401) {
      return "Email atau kata sandi yang Anda masukkan salah. Silakan coba lagi.";
    }
  }

  const message = typeof error === "string" 
    ? error 
    : (error as Error).message || "Terjadi kesalahan.";

  if (message.includes("Edge Function returned a non-2xx status code")) {
    return "Terjadi kendala saat memproses permintaan Anda ke server. Silakan coba lagi nanti.";
  }
  if (message.includes("Failed to fetch") || message.includes("NetworkError") || message.includes("Failed to send a request to the Edge Function")) {
    return "Koneksi internet terputus atau tidak stabil. Silakan periksa jaringan Anda.";
  }
  if (message.includes("relation") && message.includes("does not exist")) {
    return "Database belum siap atau tabel tidak ditemukan. Pastikan migrasi sudah dijalankan.";
  }
  if (message.includes("Invalid credentials") || message.includes("Invalid login credentials") || message.includes("401")) {
    return "Email atau kata sandi yang Anda masukkan salah. Silakan coba lagi.";
  }
  if (message.includes("JWT") || message.includes("session expired") || message.includes("invalid token")) {
    return "Sesi Anda telah berakhir. Silakan masuk kembali.";
  }
  
  return message;
}

export const toast = {
  ...originalToast,
  error: (message: any, options?: any) => {
    const friendly = getFriendlyErrorMessage(message);
    return originalToast.error(friendly, options);
  },
  success: originalToast.success,
  info: originalToast.info,
  warning: originalToast.warning,
  loading: originalToast.loading,
  dismiss: originalToast.dismiss,
  custom: originalToast.custom,
};
