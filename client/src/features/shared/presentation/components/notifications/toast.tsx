import { sileo } from "sileo";
import { Check, X, TriangleAlert, Info, Loader2 } from "lucide-react";

const DEFAULT_ERROR_MESSAGE = "Ocurrió un error inesperado";
const DEFAULT_ERROR_TITLE = "Error";

type ErrorToastOptions = {
  title?: string;
};

export function showErrorList(
  messages?: string[],
  options?: ErrorToastOptions,
) {
  const renderErrorToast = (message: string) => {
    sileo.error({
      title: options?.title ?? DEFAULT_ERROR_TITLE,
      description: message,
      icon: <X className="w-3.5 h-3.5 stroke-[2.5]" />,
    });
  };

  if (!messages || messages.length === 0) {
    renderErrorToast(DEFAULT_ERROR_MESSAGE);
    return;
  }

  const uniqueMessages = [...new Set(messages.filter(Boolean))];
  uniqueMessages.forEach((message) => renderErrorToast(message));
}

export const appToast = {
  success: (title: string, description?: string) =>
    sileo.success({
      title,
      description,
      icon: <Check className="w-3.5 h-3.5 stroke-[2.5]" />,
    }),
  error: (title: string, message?: string) =>
    sileo.error({
      title,
      description: message,
      icon: <X className="w-3.5 h-3.5 stroke-[2.5]" />,
    }),
  info: (title: string, description?: string) =>
    sileo.info({
      title,
      description,
      icon: <Info className="w-3.5 h-3.5 stroke-[2.5]" />,
    }),
  warning: (title: string, description?: string) =>
    sileo.warning({
      title,
      description,
      icon: <TriangleAlert className="w-3.5 h-3.5 stroke-[2.5]" />,
    }),
  loading: (title: string, description?: string) =>
    sileo.show({
      type: "loading",
      title,
      description,
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    }),
  promise: sileo.promise,
  dismiss: sileo.dismiss,
  clear: sileo.clear,
};
