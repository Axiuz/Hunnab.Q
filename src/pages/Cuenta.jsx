import { useMemo, useState } from 'react';

const REGEX_PASSWORD = /^(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{6,10}$/;

/**
 * Vista de cuenta:
 * - Login y registro contra API
 * - Sesion activa
 * - Resumen de pedidos del usuario
 * - Panel admin para CRUD visual de productos
 */
function AccountPage({ app }) {
  const auth = useMemo(() => app?.auth ?? null, [app]);

  // Estado de autenticacion y formulario.
  const [modoRegistro, setModoRegistro] = useState(false);
  const [mostrarPass, setMostrarPass] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    correo: '',
    usuario: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usuarioActivo, setUsuarioActivo] = useState(() => auth?.getSessionUser() ?? null);

  // Estado exclusivo del panel super usuario.
  const [, setAdminRefreshKey] = useState(0);
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');
  const [createProductForm, setCreateProductForm] = useState({
    title: '',
    price: '',
    img: '',
    imgHover: '',
    categoryKey: 'collares',
  });
  const [renameDrafts, setRenameDrafts] = useState({});

  // Handlers de formulario (login/registro).
  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    if (error) {
      setError('');
    }
  };

  const cambiarModo = () => {
    setModoRegistro((prev) => !prev);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (modoRegistro) {
        if (!REGEX_PASSWORD.test(form.password)) {
          setError(
            'La contrasena debe tener entre 6 y 10 caracteres, incluir al menos un signo especial (!@#$%^&*) y solo puede contener letras (sin enie ni acentos), numeros y esos signos.'
          );
          return;
        }

        const result = await auth.register(form);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setError('');
        setModoRegistro(false);
        setForm((prev) => ({ ...prev, nombre: '', correo: '', password: '' }));
        return;
      }

      const result = await auth.login(form);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      setError('');
      setUsuarioActivo(result.user);
      setForm({ nombre: '', correo: '', usuario: '', password: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const cerrarSesion = () => {
    auth.logout();
    setUsuarioActivo(null);
    setModoRegistro(false);
    setMostrarPass(false);
    setError('');
    setAdminError('');
    setAdminSuccess('');
    setRenameDrafts({});
    setForm({ nombre: '', correo: '', usuario: '', password: '' });
  };

  // Datos derivados para renderizado.
  const nombreUsuario = (usuarioActivo?.nombre || usuarioActivo?.usuario || '').trim();
  const pedidosUsuario = usuarioActivo ? app.orders?.getUserOrders?.(usuarioActivo) ?? [] : [];
  const normalizedRole = String(usuarioActivo?.tipoUsuario || usuarioActivo?.tipo_usuario || '')
    .trim()
    .toUpperCase();
  const isSuperUser = normalizedRole === 'ADMIN' || normalizedRole === 'ADMINISTRADOR';
  const adminProducts = isSuperUser ? app.catalog?.getAdminProducts?.() ?? [] : [];
  const adminCategoryKeys = useMemo(() => app.catalog?.getCategoryKeys?.() ?? [], [app]);

  if (!auth) {
    return null;
  }

  // Utilidades de visualizacion.
  const formatOrderDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
  };

  const refreshAdminPanel = () => setAdminRefreshKey((prev) => prev + 1);

  // Helpers para mensajes del panel admin.
  const clearAdminMessages = () => {
    if (adminError) {
      setAdminError('');
    }
    if (adminSuccess) {
      setAdminSuccess('');
    }
  };

  const onCreateProductFieldChange = (field) => (event) => {
    clearAdminMessages();
    setCreateProductForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  // Acciones CRUD visuales desde panel admin.
  const createProductFromAdmin = (event) => {
    event.preventDefault();
    clearAdminMessages();
    const result = app.catalog?.adminCreateProduct?.(createProductForm);
    if (!result?.ok) {
      setAdminError(result?.error || 'No se pudo crear el producto.');
      return;
    }

    setAdminSuccess(`Producto creado: ${result.id}`);
    setCreateProductForm((prev) => ({
      ...prev,
      title: '',
      price: '',
      img: '',
      imgHover: '',
    }));
    refreshAdminPanel();
  };

  const onRenameDraftChange = (productId, value) => {
    clearAdminMessages();
    setRenameDrafts((prev) => ({ ...prev, [productId]: value }));
  };

  const saveVisualName = (productId, fallbackName) => {
    clearAdminMessages();
    const nextTitle = String(renameDrafts[productId] ?? fallbackName ?? '').trim();
    const result = app.catalog?.adminUpdateProductVisualName?.({ id: productId, title: nextTitle });
    if (!result?.ok) {
      setAdminError(result?.error || 'No se pudo actualizar el nombre visual.');
      return;
    }
    setAdminSuccess('Nombre visual actualizado.');
    refreshAdminPanel();
  };

  const hideProductFromAdmin = (productId) => {
    clearAdminMessages();
    const result = app.catalog?.adminHideProduct?.(productId);
    if (!result?.ok) {
      setAdminError(result?.error || 'No se pudo ocultar el producto.');
      return;
    }
    setAdminSuccess('Producto ocultado.');
    refreshAdminPanel();
  };

  const restoreProductFromAdmin = (productId) => {
    clearAdminMessages();
    const result = app.catalog?.adminRestoreProduct?.(productId);
    if (!result?.ok) {
      setAdminError(result?.error || 'No se pudo restaurar el producto.');
      return;
    }
    setAdminSuccess('Producto restaurado.');
    refreshAdminPanel();
  };

  // Render principal de la cuenta.
  return (
    <section className="auth-page">
      <div className="inicio-sesion">
        <img
          className="inicio-sesion__logo"
          src="/imagenes/hunnabpng.png"
          alt="Hunnab.Q"
          width="260"
          height="80"
        />

        <h1>{usuarioActivo ? 'Bienvenida' : modoRegistro ? 'Registrarse' : 'Iniciar Sesion'}</h1>

        {!usuarioActivo && (
          <p className="inicio-sesion__switch">
            {modoRegistro ? 'Ya tienes cuenta?' : 'No tienes cuenta?'}{' '}
            <button type="button" className="link-btn" onClick={cambiarModo}>
              {modoRegistro ? 'Iniciar Sesion' : 'Registrate'}
            </button>
          </p>
        )}

        {!usuarioActivo && (
          <form className="inicio-sesion__form" onSubmit={handleSubmit}>
            {modoRegistro && (
              <>
                <label htmlFor="nombre">Nombre Completo:</label>
                <input
                  id="nombre"
                  type="text"
                  value={form.nombre}
                  onChange={handleChange('nombre')}
                  required={modoRegistro}
                />

                <label htmlFor="correo">Correo Electronico:</label>
                <input
                  id="correo"
                  type="email"
                  value={form.correo}
                  onChange={handleChange('correo')}
                  required={modoRegistro}
                />

                <p className="password-help">
                  La contrasena debe tener entre 6 y 10 caracteres, incluir al menos un signo
                  especial (!@#$%^&*) y solo puede contener letras (sin enie ni acentos),
                  numeros y esos signos.
                </p>
              </>
            )}

            <label htmlFor="usuario">Usuario:</label>
            <input
              id="usuario"
              type="text"
              value={form.usuario}
              onChange={handleChange('usuario')}
              required
            />

            <label htmlFor="password">Contrasena:</label>
            <input
              id="password"
              type={mostrarPass ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange('password')}
              required
            />

            <label className="show-pass" htmlFor="mostrar-pass">
              <input
                id="mostrar-pass"
                type="checkbox"
                checked={mostrarPass}
                onChange={(event) => setMostrarPass(event.target.checked)}
              />
              Mostrar contrasena
            </label>

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Procesando...' : modoRegistro ? 'Registrarse' : 'Iniciar Sesion'}
            </button>

            <p className={`auth-error ${error ? 'is-visible' : ''}`}>{error || ' '}</p>
          </form>
        )}

        {usuarioActivo && (
          <div className="panel-usuario">
            <h2>{`Hola ${nombreUsuario} 💛`}</h2>

            <section className="pedidos-panel" aria-label="Mis pedidos">
              <h3>Mis pedidos</h3>
              {pedidosUsuario.length === 0 ? (
                <p className="pedidos-empty">
                  Aun no tienes pedidos. Ve al <a href="#/carrito">carrito</a> y finaliza uno.
                </p>
              ) : (
                <div className="pedidos-list">
                  {pedidosUsuario.map((pedido) => (
                    <article key={pedido.id} className="pedido-card">
                      <div className="pedido-card__top">
                        <strong>{pedido.id}</strong>
                        <span>{pedido.status}</span>
                      </div>
                      <p>{formatOrderDate(pedido.createdAt)}</p>
                      <p>{`Total: ${app.currency.formatMXN(pedido.total)}`}</p>
                      <p>{`Productos: ${pedido.items.length}`}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {isSuperUser && (
              <section className="admin-productos-panel" aria-label="Panel super usuario">
                <h3>Panel Super Usuario (CRUD Productos)</h3>

                <form className="admin-create-form" onSubmit={createProductFromAdmin}>
                  <label htmlFor="admin-product-title">Nombre del producto</label>
                  <input
                    id="admin-product-title"
                    type="text"
                    value={createProductForm.title}
                    onChange={onCreateProductFieldChange('title')}
                    required
                  />

                  <label htmlFor="admin-product-price">Precio</label>
                  <input
                    id="admin-product-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={createProductForm.price}
                    onChange={onCreateProductFieldChange('price')}
                    required
                  />

                  <label htmlFor="admin-product-image">Imagen principal (ruta)</label>
                  <input
                    id="admin-product-image"
                    type="text"
                    value={createProductForm.img}
                    onChange={onCreateProductFieldChange('img')}
                    placeholder="imagenes/mi_producto.jpg"
                    required
                  />

                  <label htmlFor="admin-product-image-hover">Imagen hover (opcional)</label>
                  <input
                    id="admin-product-image-hover"
                    type="text"
                    value={createProductForm.imgHover}
                    onChange={onCreateProductFieldChange('imgHover')}
                    placeholder="imagenes/mi_producto_hover.jpg"
                  />

                  <label htmlFor="admin-product-category">Categoria</label>
                  <select
                    id="admin-product-category"
                    value={createProductForm.categoryKey}
                    onChange={onCreateProductFieldChange('categoryKey')}
                  >
                    {adminCategoryKeys.map((categoryKey) => (
                      <option key={categoryKey} value={categoryKey}>
                        {categoryKey}
                      </option>
                    ))}
                  </select>

                  <button type="submit">Crear producto</button>
                </form>

                {adminError ? <p className="admin-msg admin-msg--error">{adminError}</p> : null}
                {adminSuccess ? <p className="admin-msg admin-msg--ok">{adminSuccess}</p> : null}

                <div className="admin-products-list">
                  {adminProducts.map(({ id, product, categories }) => (
                    <article key={id} className="admin-product-card">
                      <div className="admin-product-card__top">
                        <strong>{product.title}</strong>
                        <span>{product._isHidden ? 'Oculto' : 'Visible'}</span>
                      </div>
                      <p>{`ID: ${id}`}</p>
                      <p>{`Precio: ${app.currency.formatMXN(product.price)}`}</p>
                      <p>{`Categorias: ${categories.length ? categories.join(', ') : 'Sin categoria'}`}</p>

                      <div className="admin-rename-box">
                        <input
                          type="text"
                          value={renameDrafts[id] ?? product.title}
                          onChange={(event) => onRenameDraftChange(id, event.target.value)}
                        />
                        <button type="button" onClick={() => saveVisualName(id, product.title)}>
                          Guardar nombre visual
                        </button>
                      </div>

                      <div className="admin-actions">
                        {product._isHidden ? (
                          <button type="button" onClick={() => restoreProductFromAdmin(id)}>
                            Mostrar producto
                          </button>
                        ) : (
                          <button type="button" onClick={() => hideProductFromAdmin(id)}>
                            Ocultar producto
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            <button type="button" onClick={cerrarSesion}>
              Cerrar Sesion
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default AccountPage;
