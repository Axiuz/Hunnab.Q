import { useState } from 'react';

function ProductPage({ app, productId }) {
  const product = app.catalog.getProduct(productId);
  const colors = app.catalog.getDefaultProductColors();
  const [qty, setQty] = useState(1);
  const [selectedColor, setSelectedColor] = useState(0);

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

  const updateQty = (value) => {
    const next = Number.parseInt(value, 10);
    if (Number.isNaN(next)) {
      setQty(1);
      return;
    }
    setQty(Math.max(1, Math.min(99, next)));
  };

  const addToCart = () => {
    const color = colors[selectedColor].name;
    app.cart.addItem({ productId, quantity: qty, color });
    window.alert(`Anadido: ${product.title}\nColor: ${color}\nCantidad: ${qty}`);
  };

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
          <div className="price">{app.currency.formatMXN(product.price)}</div>

          <div className="opt">
            <label>Color</label>
            <div className="swatches">
              {colors.map((color, idx) => (
                <button
                  key={color.name}
                  className="swatch"
                  type="button"
                  title={color.name}
                  style={{ background: color.value }}
                  role="radio"
                  aria-checked={selectedColor === idx ? 'true' : 'false'}
                  onClick={() => setSelectedColor(idx)}
                />
              ))}
            </div>
          </div>

          <div className="opt">
            <label>Cantidad</label>
            <div className="qty">
              <button type="button" onClick={() => setQty((prev) => Math.max(1, prev - 1))}>
                -
              </button>
              <input
                value={qty}
                inputMode="numeric"
                onChange={(event) => updateQty(event.target.value || '1')}
              />
              <button type="button" onClick={() => setQty((prev) => Math.min(99, prev + 1))}>
                +
              </button>
            </div>
          </div>

          <button className="btn primary" type="button" onClick={addToCart}>
            ANADIR AL CARRITO - {app.currency.formatMXN(product.price)}
          </button>
        </aside>
      </div>
    </>
  );
}

export default ProductPage;
