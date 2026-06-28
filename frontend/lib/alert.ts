interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void | Promise<void>;
}

export interface AppAlertRequest {
  title: string;
  message?: string;
  buttons: AlertButton[];
}

type Listener = (request: AppAlertRequest) => void;

let listener: Listener | null = null;
let pendingRequest: AppAlertRequest | null = null;

export function setAlertHandler(handler: Listener | null) {
  listener = handler;
  if (listener && pendingRequest) {
    listener(pendingRequest);
    pendingRequest = null;
  }
}

export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[],
) {
  const request = {
    title,
    message,
    buttons: buttons?.length ? buttons : [{ text: '确定' }],
  };
  if (listener) {
    listener(request);
  } else {
    pendingRequest = request;
  }
}
