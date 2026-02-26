import { useEffect, useMemo, useState } from 'react';

const EMPTY_SHIPPING = {
  email: '',
  phone: '',
  firstName: '',
  lastName: '',
  address: '',
  city: '',
  postalCode: '',
  state: 'Jalisco',
};

const EMPTY_PAYMENT = {
  method: 'tarjeta',
  cardNumber: '',
  cardHolder: '',
  cardExpiry: '',
  cardCvv: '',
  installments: 'Meses sin intereses',
};

const MEXICO_STATES = [
  'Jalisco',
  'Ciudad de Mexico',
  'Nuevo Leon',
  'Queretaro',
  'Estado de Mexico',
];

function CheckoutPage({ app }) {
  const [draft, setDraft] = useState(() => app.checkout?.getDraft?.() ?? null);
  const [receipt, setReceipt] = useState(() => app.checkout?.getReceipt?.() ?? null);
  const [shipping, setShipping] = useState(EMPTY_SHIPPING);
  const [payment, setPayment] = useState(EMPTY_PAYMENT);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPaidModal, setShowPaidModal] = useState(false);
  const [pendingReceipt, setPendingReceipt] = useState(null);

  const sessionUser = useMemo(() => app.auth?.getSessionUser?.() ?? null, [app]);

  useEffect(() => {
    if (!sessionUser || receipt || draft || typeof app.checkout?.prepareFromCart !== 'function') {
      return;
    }
    const result = app.checkout.prepareFromCart({ user: sessionUser });
    if (result?.ok) {
      setDraft(result.draft);
    }
  }, [app, sessionUser, receipt, draft]);

  const onShippingChange = (field) => (event) => {
    setError('');
    setSuccess('');
    setShipping((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const onPaymentChange = (field) => (event) => {
    setError('');
    setSuccess('');
    setPayment((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const setPaymentField = (field, value) => {
    setError('');
    setSuccess('');
    setPayment((prev) => ({ ...prev, [field]: value }));
  };

  const onCardNumberChange = (event) => {
    let value = event.target.value.replace(/\D/g, '');
    value = value.slice(0, 16);
    value = value.replace(/(.{4})/g, '$1 ').trim();
    setPaymentField('cardNumber', value);
  };

  const onCardExpiryChange = (event) => {
    let value = event.target.value.replace(/\D/g, '').slice(0, 4);
    if (value.length >= 3) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    setPaymentField('cardExpiry', value);
  };

  const onCardCvvChange = (event) => {
    const value = event.target.value.replace(/\D/g, '').slice(0, 3);
    setPaymentField('cardCvv', value);
  };

  const cardBrand = useMemo(() => {
    const raw = (payment.cardNumber || '').replace(/\s/g, '');
    if (raw.startsWith('4')) {
      return { label: 'VISA', className: 'is-visa' };
    }
    if (/^5[1-5]/.test(raw)) {
      return { label: 'MASTERCARD', className: 'is-mastercard' };
    }
    return { label: '', className: '' };
  }, [payment.cardNumber]);

  const closePaidModal = () => {
    setShowPaidModal(false);
    if (pendingReceipt) {
      setDraft(null);
      setReceipt(pendingReceipt);
      setPendingReceipt(null);
    }
  };

  const processPayment = async (event) => {
    if (event) {
      event.preventDefault();
    }
    if (!app.checkout || typeof app.checkout.processSimulatedPayment !== 'function') {
      setError('No esta disponible el checkout en esta version.');
      return;
    }

    const fullName = `${shipping.firstName} ${shipping.lastName}`.trim();

    setError('');
    setSuccess('');
    setIsProcessing(true);
    const result = await app.checkout.processSimulatedPayment({
      shipping: {
        fullName,
        email: shipping.email,
        phone: shipping.phone,
        address: shipping.address,
        city: shipping.city,
        state: shipping.state,
        postalCode: shipping.postalCode,
      },
      payment,
    });
    setIsProcessing(false);

    if (!result?.ok || !result.receipt) {
      setError(result?.error || 'No se pudo procesar el pago simulado.');
      return;
    }

    setSuccess('Pago simulado correctamente');
    setPendingReceipt(result.receipt);
    setShowPaidModal(true);
  };

  if (!sessionUser) {
    return (
      <>
        <div className="crumb">Inicio / Checkout</div>
        <section className="checkout-empty">
          <h1>Inicia sesion para continuar</h1>
          <p>Necesitas una cuenta activa para completar el pago.</p>
          <a className="btn primary" href="#/cuenta">
            Ir a cuenta
          </a>
        </section>
      </>
    );
  }

  if (!draft && !receipt) {
    return (
      <>
        <div className="crumb">Inicio / Checkout</div>
        <section className="checkout-empty">
          <h1>No hay checkout activo</h1>
          <p>Regresa al carrito para seleccionar productos antes de pagar.</p>
          <a className="btn primary" href="#/carrito">
            Volver al carrito
          </a>
        </section>
      </>
    );
  }

  if (receipt) {
    const order = receipt.order || {};
    const orderItems = Array.isArray(order.items) ? order.items : [];
    return (
      <>
        <div className="crumb">Inicio / Checkout / Pedido</div>
        <section className="checkout-result">
          <h1>Pago procesado</h1>
          <p>{success || 'Tu pago simulado fue exitoso.'}</p>
          <article className="checkout-order-card">
            <h2>{`Pedido ${order.id || 'N/A'}`}</h2>
            <p>{`Estado: ${order.status || 'En preparacion'}`}</p>
            <p>{`Total: ${app.currency.formatMXN(order.total || 0)}`}</p>
            <div className="checkout-order-items">
              {orderItems.map((item, idx) => (
                <p key={`${order.id || 'pedido'}-${idx}`}>
                  {`${item.quantity} x ${item.title} - ${app.currency.formatMXN(item.subtotal)}`}
                </p>
              ))}
            </div>
          </article>
          <div className="checkout-result__actions">
            <a className="btn primary" href="#/cuenta">
              Ver pedidos
            </a>
            <a className="btn link" href="#/">
              Seguir comprando
            </a>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <div className="crumb">Inicio / Checkout</div>
      <div className="checkout-page">
        <section className="checkout-form checkout-card" aria-label="Datos de envio">
          <h2>Contacto</h2>
          <input
            type="email"
            placeholder="Correo electronico"
            value={shipping.email}
            onChange={onShippingChange('email')}
            required
          />
          <input
            type="tel"
            placeholder="Telefono"
            value={shipping.phone}
            onChange={onShippingChange('phone')}
          />

          <h2>Entrega</h2>
          <div className="grid-2">
            <input
              type="text"
              placeholder="Nombre"
              value={shipping.firstName}
              onChange={onShippingChange('firstName')}
              required
            />
            <input
              type="text"
              placeholder="Apellido"
              value={shipping.lastName}
              onChange={onShippingChange('lastName')}
              required
            />
          </div>
          <input
            type="text"
            placeholder="Direccion"
            value={shipping.address}
            onChange={onShippingChange('address')}
            required
          />
          <input
            type="text"
            placeholder="Ciudad"
            value={shipping.city}
            onChange={onShippingChange('city')}
            required
          />
          <input
            type="text"
            placeholder="Codigo postal"
            value={shipping.postalCode}
            onChange={onShippingChange('postalCode')}
            required
          />
          <select value={shipping.state} onChange={onShippingChange('state')} required>
            {MEXICO_STATES.map((stateName) => (
              <option key={stateName} value={stateName}>
                {stateName}
              </option>
            ))}
          </select>
        </section>

        <section className="checkout checkout-card" aria-label="Pago">
          <h2>Pago</h2>
          <p className="secure">Todas las transacciones son seguras y estan encriptadas.</p>

          <div className={`payment-option ${payment.method === 'tarjeta' ? 'is-active' : ''}`}>
            <label className="payment-header" htmlFor="checkout-pay-card">
              <input
                id="checkout-pay-card"
                type="radio"
                name="payment-method"
                checked={payment.method === 'tarjeta'}
                onChange={() => setPayment((prev) => ({ ...prev, method: 'tarjeta' }))}
              />
              Tarjeta de debito o credito
            </label>
            {payment.method === 'tarjeta' ? (
              <div className="payment-body">
                <div className="card-number-row">
<input
                    type="text"
                    placeholder="4111 1111 1111 1111"
                    value={payment.cardNumber}
                    onChange={onCardNumberChange}
                    inputMode="numeric"
                    autoComplete="cc-number"
                    required
                  />
                  {cardBrand.label ? (
                    <span className={`card-brand ${cardBrand.className}`}>{cardBrand.label}</span>
                  ) : null}
                </div>
                <div className="grid-2">
                  <input
                    type="text"
                    placeholder="12/28"
                    value={payment.cardExpiry}
                    onChange={onCardExpiryChange}
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    required
                  />
                  <input
                    type="password"
                    placeholder="123"
                    value={payment.cardCvv}
                    onChange={onCardCvvChange}
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    required
                  />
                </div>

                <input
                  type="text"
                  placeholder="Nombre del titular"
                  value={payment.cardHolder}
                  onChange={onPaymentChange('cardHolder')}
                  required
                />
                <select value={payment.installments} onChange={onPaymentChange('installments')}>
                  <option value="Meses sin intereses">Meses sin intereses</option>
                  <option value="Pago en una exhibicion">Pago en una exhibicion</option>
                </select>
              </div>
            ) : null}
          </div>

          <div className="payment-option">
            <label className="payment-header" htmlFor="checkout-pay-transfer">
              <input
                id="checkout-pay-transfer"
                type="radio"
                name="payment-method"
                checked={payment.method === 'transferencia'}
                onChange={() => setPayment((prev) => ({ ...prev, method: 'transferencia' }))}
              />
              PayPal
            </label>
          </div>

          <div className="payment-option">
            <label className="payment-header" htmlFor="checkout-pay-oxxo">
              <input
                id="checkout-pay-oxxo"
                type="radio"
                name="payment-method"
                checked={payment.method === 'oxxo'}
                onChange={() => setPayment((prev) => ({ ...prev, method: 'oxxo' }))}
              />
              Mercado Pago
            </label>
          </div>

          {error ? <p className="checkout-msg checkout-msg--error">{error}</p> : null}
          <button className="checkout-pay-btn" type="button" disabled={isProcessing} onClick={processPayment}>
            {isProcessing ? 'Procesando pago...' : 'Pagar ahora'}
          </button>
        </section>
      </div>

      {showPaidModal ? (
        <div className="checkout-modal-overlay" role="dialog" aria-modal="true" aria-label="Pago simulado">
          <div className="checkout-modal">
            <div className="checkout-modal__content">
              <span className="checkout-modal__icon" aria-hidden="true">
                ✅
              </span>
              <span>{success || 'Pago simulado correctamente'}</span>
            </div>
            <div className="checkout-modal__actions">
              <button type="button" className="checkout-modal__close" onClick={closePaidModal}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default CheckoutPage;
