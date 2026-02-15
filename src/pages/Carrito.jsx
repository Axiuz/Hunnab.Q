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

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.subtotal, 0),
    [items]
  );

  /** Actualiza cantidad de una linea del carrito. */
  const updateQuantity = (item, quantity) => {
    app.cart.updateItemQuantity({
      productId: item.productId,
      color: item.color,
      quantity,
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

  /** Convierte el carrito actual en un pedido y limpia el carrito. */
  const finalizeOrder = () => {
    const sessionUser = app.auth?.getSessionUser?.();
    if (!sessionUser) {
      window.alert('Inicia sesion para generar tu pedido.');
      window.location.hash = '#/cuenta';
      return;
    }

    const createdOrder = app.orders?.createFromCart?.({
      user: sessionUser,
      items,
      total,
    });

    if (!createdOrder) {
      window.alert('No se pudo generar el pedido.');
      return;
    }

    app.cart.clear();
    window.alert(`Pedido ${createdOrder.id} creado correctamente.`);
    window.location.hash = '#/cuenta';
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
            <article key={`${item.productId}-${item.color}`} className="cart-row">
              <img src={item.image} alt={item.title} className="cart-row__image" />

              <div className="cart-row__content">
                <h3>{item.title}</h3>
                <p>Color: {item.color}</p>
                <strong>{app.currency.formatMXN(item.unitPrice)}</strong>
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
                  onClick={() => app.cart.removeItem({ productId: item.productId, color: item.color })}
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
            <span>Productos</span>
            <strong>{app.currency.formatMXN(total)}</strong>
          </div>
          <div className="cart-summary__line">
            <span>Envio</span>
            <strong>Se calcula al pagar</strong>
          </div>
          <div className="cart-summary__line cart-summary__line--total">
            <span>Total</span>
            <strong>{app.currency.formatMXN(total)}</strong>
          </div>
          <button className="btn primary" type="button" onClick={finalizeOrder}>
            Finalizar pedido
          </button>
          <button className="btn link" type="button" onClick={() => app.cart.clear()}>
            Vaciar carrito
          </button>
        </aside>
      </div>
    </>
  );
}

export default CartPage;
