function getAuthToken() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return '';
  }
  return String(window.localStorage.getItem('hunnab_auth_token') || '').trim();
}

export async function sendEmailConfirmationByOrderId(orderId, token = '') {
  const parsedOrderId = Number.parseInt(orderId, 10);
  if (!Number.isInteger(parsedOrderId) || parsedOrderId <= 0) {
    return { ok: false, error: 'ID de pedido invalido.' };
  }

  const safeToken = String(token || '').trim() || getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (safeToken) {
    headers.Authorization = `Bearer ${safeToken}`;
  }

  try {
    const response = await fetch(`/api/orders/${parsedOrderId}/email-confirmation`, {
      method: 'POST',
      headers,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { ok: false, error: data?.error || 'No se pudo enviar el correo de confirmacion.' };
    }

    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: 'No hay conexion con el servidor API.' };
  }
}

export async function handleSubmit(event, orderId, token = '') {
  if (event?.preventDefault) {
    event.preventDefault();
  }
  return sendEmailConfirmationByOrderId(orderId, token);
}

export default sendEmailConfirmationByOrderId;
