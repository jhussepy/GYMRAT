import type { Metadata } from "next";
import { CONTACT_EMAIL, LEGAL_NAME, LegalLayout } from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Política de privacidad · GYMRAT",
  description: "Qué datos guarda GYMRAT, para qué los usa, con quién los comparte y cómo puedes descargarlos o borrarlos.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Política de privacidad" other={{ href: "/terminos", label: "Términos de uso" }}>
      <p>
        En GYMRAT guardamos información sobre tu cuerpo y tus hábitos, y la tratamos con cuidado. Esta política explica, en lenguaje sencillo, qué datos guardamos, para qué, con quién los compartimos y cómo ejerces el control sobre ellos. El responsable del tratamiento es {LEGAL_NAME}.
      </p>

      <h2>1. Qué datos guardamos</h2>
      <ul>
        <li><strong>Cuenta:</strong> tu correo electrónico y los datos de acceso, gestionados por nuestro proveedor de autenticación.</li>
        <li><strong>Perfil:</strong> nombre (opcional), sexo, año de nacimiento, altura, peso, objetivo, nivel de actividad, días y horarios de entrenamiento, horarios de sueño y de trabajo o estudio, y las metas calculadas de calorías, proteína y agua.</li>
        <li><strong>Registros que tú añades:</strong> series, pesos y repeticiones; agua; comidas con sus calorías y proteína; peso y medidas corporales, incluida la composición corporal; y datos de sueño y recuperación.</li>
        <li><strong>En tu navegador:</strong> una copia de tus datos y tu preferencia de tema (claro u oscuro).</li>
      </ul>
      <p>
        Parte de esta información es <strong>dato de salud</strong> (por ejemplo, peso, medidas y composición corporal). Solo la tratamos con tu <strong>consentimiento explícito</strong>, que se te pide al registrarte, y puedes retirarlo en cualquier momento borrando tus datos.
      </p>

      <h2>2. Para qué los usamos</h2>
      <ul>
        <li>Prestarte el servicio: mostrarte tu día, tu rutina, tu menú y tu progreso.</li>
        <li>Calcular tus metas de forma automática y orientativa a partir de tus datos.</li>
        <li>Sincronizar tu información entre tus dispositivos y mantenerla segura.</li>
      </ul>
      <p>No vendemos tus datos, no los cedemos con fines publicitarios y no usamos publicidad ni rastreadores de terceros.</p>

      <h2>3. Con quién los compartimos</h2>
      <p>Usamos proveedores que tratan datos únicamente para que el servicio funcione:</p>
      <div className="lp-table-wrap" tabIndex={0} role="region" aria-label="Proveedores que tratan datos">
        <table>
          <thead>
            <tr>
              <th scope="col">Proveedor</th>
              <th scope="col">Para qué</th>
              <th scope="col">Qué datos</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Clerk</td>
              <td>Crear cuenta e iniciar sesión</td>
              <td>Correo y datos de acceso</td>
            </tr>
            <tr>
              <td>Supabase</td>
              <td>Guardar tus datos en la nube</td>
              <td>Tu perfil y tus registros</td>
            </tr>
            <tr>
              <td>Vercel</td>
              <td>Alojar la aplicación</td>
              <td>Datos técnicos de la conexión</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>Estos proveedores pueden tratar datos en servidores fuera de tu país. Aplican sus propias medidas de seguridad y garantías contractuales para esas transferencias.</p>

      <h2>4. Cookies y almacenamiento</h2>
      <p>
        Usamos solo lo imprescindible: las cookies de sesión de nuestro proveedor de autenticación para mantenerte conectado y el almacenamiento de tu navegador para guardar tus datos y tu tema. No usamos cookies publicitarias ni de analítica de terceros.
      </p>

      <h2>5. Cuánto tiempo los conservamos</h2>
      <p>
        Mientras tu cuenta esté activa o hasta que los borres. Si borras tus datos o eliminas tu cuenta desde la aplicación, los eliminamos de la nube de inmediato. Los proveedores pueden conservar copias técnicas durante un plazo limitado según sus propias políticas.
      </p>

      <h2>6. Tus derechos</h2>
      <ul>
        <li><strong>Acceso y portabilidad:</strong> descarga una copia en JSON desde Progreso → Copia de seguridad.</li>
        <li><strong>Rectificación:</strong> edita tu perfil y tus registros en cualquier momento.</li>
        <li><strong>Supresión:</strong> borra tus datos o elimina tu cuenta desde Progreso → Privacidad y datos.</li>
        <li><strong>Retirar el consentimiento:</strong> borrando tus datos dejamos de tratarlos.</li>
        <li><strong>Reclamar:</strong> puedes presentar una reclamación ante la autoridad de protección de datos de tu país.</li>
      </ul>
      <p>
        {CONTACT_EMAIL ? (
          <>
            Si necesitas ayuda con cualquiera de estos derechos, escríbenos a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </>
        ) : (
          <>Todas estas opciones están disponibles dentro de la aplicación, sin necesidad de pedírnoslas.</>
        )}
      </p>

      <h2>7. Seguridad</h2>
      <p>
        La conexión usa HTTPS. Las claves de acceso a la base de datos solo existen en el servidor y nunca llegan a tu navegador. Cada cuenta solo puede leer y modificar sus propios datos, identificada por la sesión que verificamos en el servidor. Ningún sistema es infalible, pero trabajamos para proteger tu información.
      </p>

      <h2>8. Personas menores de edad</h2>
      <p>GYMRAT está pensado para personas de 18 años o más y no calcula metas de calorías para menores.</p>

      <h2>9. Cambios en esta política</h2>
      <p>Si la actualizamos, cambiaremos la fecha de arriba y, si el cambio es importante, te avisaremos dentro de la aplicación.</p>
    </LegalLayout>
  );
}
