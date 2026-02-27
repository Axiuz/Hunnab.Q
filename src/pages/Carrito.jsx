import { useEffect, useMemo, useState } from 'react';

/** Vista de carrito: permite editar cantidades, eliminar items y ver total. */
function CartPage({ app }) {
  // Estado y sincronizacion con modelo de carrito
  const [items, setItems] = useState(() => app.cart.getDetailedItems(app.catalog, app.images));

  useEffect(() => {
    const syncItems = () => setItems(app.cart.getDetailedItems(app.catalog, app.images));
    syncItems();
    return app.cart.subscribe(syncItems);
  }, [app]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.subtotal, 0),
    [items]
  );
  const iva = useMemo(
    () => Number((subtotal * 0.16).toFixed(2)),
    [subtotal]
  );
  const total = useMemo(
    () => Number((subtotal + iva).toFixed(2)),
    [subtotal, iva]
  );
  const hasStockConflict = items.some((item) => item.stock <= 0 || item.quantity > item.stock);

  /** Actualiza cantidad de una linea del carrito. */
  const updateQuantity = (item, quantity) => {
    const maxStock = Math.max(0, Number.parseInt(item.stock, 10) || 0);
    if (maxStock <= 0) {
      return;
    }
    const boundedQty = Math.max(1, Math.min(maxStock, Number.parseInt(quantity, 10) || 1));
    app.cart.updateItemQuantity({
      productId: item.productId,
      quantity: boundedQty,
    });
  };

  /** Procesa cantidad escrita manualmente en el input. */
  const handleQuantityInput = (item, value) => {
    const next = Number.parseInt(value || '1', 10);
    if (Number.isNaN(next)) {
      return;
    }
    updateQuantity(item, next);
  };

  /** Abre checkout para capturar envio/pago y procesar pedido simulado. */
  const goToCheckout = () => {
    if (hasStockConflict) {
      window.alert('Hay productos con stock insuficiente. Ajusta cantidades antes de finalizar.');
      return;
    }

    const sessionUser = app.auth?.getSessionUser?.();
    if (!sessionUser) {
      window.alert('Inicia sesion para generar tu pedido.');
      window.location.hash = '#/cuenta';
      return;
    }

    if (typeof app.checkout?.prepareFromCart !== 'function') {
      window.alert('No esta disponible el checkout en esta version.');
      return;
    }

    const prepareResult = app.checkout.prepareFromCart({ user: sessionUser });
    if (!prepareResult?.ok) {
      window.alert(prepareResult?.error || 'No se pudo abrir checkout.');
      return;
    }
    window.location.hash = '#/checkout';
  };

  // Estado vacio
  if (items.length === 0) {
    return (
      <>
        <div className="crumb">Inicio / Carrito</div>
        <div className="hero">
          <h1>Tu carrito esta vacio</h1>
          <p>Agrega productos y vuelve para ver el resumen de tu compra.</p>
          <a className="btn primary cart-empty__btn" href="#/">
            Ir a productos
          </a>
        </div>
      </>
    );
  }

  // Render carrito con items
  return (
    <>
      <div className="crumb">Inicio / Carrito</div>
      <div className="cart-layout">
        <section className="cart-items" aria-label="Productos del carrito">
          {items.map((item) => (
            <article key={item.productId} className="cart-row">
              <img src={item.image} alt={item.title} className="cart-row__image" />

              <div className="cart-row__content">
                <h3>{item.title}</h3>
                <strong>{app.currency.formatMXN(item.unitPrice)}</strong>
                <p className={`cart-stock ${item.stock <= 0 ? 'is-out' : ''}`}>
                  {item.stock <= 0 ? 'Sin stock disponible' : `Stock disponible: ${item.stock}`}
                </p>
                {item.quantity > item.stock ? (
                  <p className="cart-stock-warning">La cantidad actual supera el stock.</p>
                ) : null}
              </div>

              <div className="cart-row__actions">
                <div className="qty" aria-label={`Cantidad de ${item.title}`}>
                  <button type="button" onClick={() => updateQuantity(item, item.quantity - 1)}>
                    -
                  </button>
                  <input
                    value={item.quantity}
                    inputMode="numeric"
                    onChange={(event) => handleQuantityInput(item, event.target.value)}
                  />
                  <button type="button" onClick={() => updateQuantity(item, item.quantity + 1)}>
                    +
                  </button>
                </div>

                <button
                  type="button"
                  className="cart-remove"
                  onClick={() => app.cart.removeItem({ productId: item.productId })}
                >
                  Eliminar
                </button>

                <strong className="cart-row__subtotal">
                  {app.currency.formatMXN(item.subtotal)}
                </strong>
              </div>
            </article>
          ))}
        </section>

        <aside className="cart-summary">
          <h2>Resumen</h2>
          <div className="cart-summary__line">
            <span>Subtotal productos</span>
            <strong>{app.currency.formatMXN(subtotal)}</strong>
          </div>
          <div className="cart-summary__line">
            <span>IVA (16%)</span>
            <strong>{app.currency.formatMXN(iva)}</strong>
          </div>
          <div className="cart-summary__line">
            <span>Envio</span>
            <strong>Se calcula al pagar</strong>
          </div>
          <div className="cart-summary__line cart-summary__line--total">
            <span>Total</span>
            <strong>{app.currency.formatMXN(total)}</strong>
          </div>
          <button
            className="btn primary"
            type="button"
            onClick={goToCheckout}
            disabled={hasStockConflict}
          >
            Finalizar compra
          </button>
          {hasStockConflict ? (
            <p className="cart-stock-warning">Corrige productos sin stock para poder finalizar.</p>
          ) : null}
          <button className="btn link" type="button" onClick={() => app.cart.clear()}>
            Vaciar carrito
          </button>
        </aside>
      </div>
    </>
  );
}

export default CartPage;
