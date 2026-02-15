import { useMemo, useState } from 'react';

const REGEX_PASSWORD = /^(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{6,10}$/;

/** Login/registro con persistencia en localStorage via app.auth. */
function AccountPage({ app }) {
  const auth = useMemo(() => app?.auth ?? null, [app]);
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

  if (!auth) {
    return null;
  }

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
    setForm({ nombre: '', correo: '', usuario: '', password: '' });
  };

  const nombreUsuario = (usuarioActivo?.nombre || usuarioActivo?.usuario || '').trim();
  const pedidosUsuario = usuarioActivo ? app.orders?.getUserOrders?.(usuarioActivo) ?? [] : [];

  const formatOrderDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
  };

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
