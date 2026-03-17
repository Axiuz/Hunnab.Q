import { useState } from 'react';

/** Vista detalle de producto con selector de cantidad y accion de carrito. */
function ProductPage({ app, productId }) {
  // Datos y estado local
  const product = app.catalog.getProduct(productId);
  const [qty, setQty] = useState(1);

  if (!product) {
    return (
      <div className="hero">
        <h1>No encontrado</h1>
        <p>
          El producto no existe. Vuelve al <a href="#/">inicio</a>.
        </p>
      </div>
    );
  }

  const images = [
    app.images.normalize(product.img),
    app.images.normalize(product.imgHover || product.img),
  ];
  const unitPrice = Number(product.price || 0);
  const selectedTotal = Number((unitPrice * qty).toFixed(2));
  const availableStock = Math.max(0, Number.parseInt(product.stock, 10) || 0);
  const isOutOfStock = availableStock <= 0;

  /** Valida cantidad ingresada y la limita al rango permitido. */
  const updateQty = (value) => {
    const next = Number.parseInt(value, 10);
    if (Number.isNaN(next)) {
      setQty(1);
      return;
    }
    const maxQty = availableStock > 0 ? availableStock : 1;
    setQty(Math.max(1, Math.min(maxQty, next)));
  };

  /** Agrega el producto actual al carrito con cantidad seleccionada. */
  const addToCart = () => {
    if (isOutOfStock) {
      window.alert('Producto sin stock disponible.');
      return;
    }

    const existingInCart = Number.parseInt(app.cart.getItemQuantity?.(productId), 10) || 0;
    const availableToAdd = Math.max(0, availableStock - existingInCart);
    if (availableToAdd <= 0) {
      window.alert('Ya alcanzaste el stock disponible de este producto en tu carrito.');
      return;
    }

    const quantityToAdd = Math.min(Math.max(1, qty), availableToAdd);
    app.cart.addItem({ productId, quantity: quantityToAdd });
    window.alert(
      `Anadido: ${product.title}\nCantidad: ${quantityToAdd}\nStock restante: ${availableStock - existingInCart - quantityToAdd}`
    );
  };

  // Render
  return (
    <>
      <div className="crumb">Inicio / Producto / {product.title}</div>
      <div className="product">
        <div className="gallery">
          {images.map((src, idx) => (
            <div key={`${src}-${idx}`} className={`shot ${idx < 2 ? 'big' : ''}`}>
              <img src={src} alt={`${product.title} ${idx + 1}`} />
            </div>
          ))}
        </div>

        <aside className="side">
          <h2 style={{ margin: '6px 0 6px', fontSize: '22px' }}>{product.title}</h2>
          <div className="price">{app.currency.formatMXN(unitPrice)}</div>
          <div className={`stock ${isOutOfStock ? 'is-out' : ''}`}>
            <span className="dot" />
            <span>{isOutOfStock ? 'Sin stock' : `Stock disponible: ${availableStock}`}</span>
          </div>

          <div className="opt">
            <label>Cantidad</label>
            <div className="qty">
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() => setQty((prev) => Math.max(1, prev - 1))}
              >
                -
              </button>
              <input
                value={qty}
                inputMode="numeric"
                disabled={isOutOfStock}
                onChange={(event) => updateQty(event.target.value || '1')}
              />
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() => setQty((prev) => Math.min(availableStock, prev + 1))}
              >
                +
              </button>
            </div>
          </div>

          <button className="btn primary" type="button" onClick={addToCart} disabled={isOutOfStock}>
            {isOutOfStock
              ? 'SIN STOCK'
              : `ANADIR AL CARRITO - ${app.currency.formatMXN(selectedTotal)}`}
          </button>
        </aside>
      </div>
    </>
  );
}

export default ProductPage;
