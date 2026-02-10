import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      padding: '2rem'
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <div style={{
          fontSize: '6rem',
          fontWeight: 800,
          color: '#003366',
          lineHeight: 1,
          marginBottom: '0.5rem'
        }}>
          404
        </div>

        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#1e293b',
          marginBottom: '1rem'
        }}>
          Página não encontrada
        </h1>

        <p style={{
          fontSize: '1rem',
          color: '#64748b',
          lineHeight: 1.6,
          marginBottom: '2rem'
        }}>
          A página que você está procurando não existe ou foi movida.
          Verifique o endereço ou volte para a página inicial.
        </p>

        <div style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: '#003366',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.95rem'
            }}
          >
            Voltar ao Inicio
          </Link>

          <Link
            href="/modules"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              background: 'white',
              color: '#003366',
              border: '2px solid #003366',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.95rem'
            }}
          >
            Ver Modulos
          </Link>
        </div>

        <p style={{
          marginTop: '2rem',
          fontSize: '0.85rem',
          color: '#94a3b8'
        }}>
          Roteiros de Dispensacao - Sistema Educacional UnB
        </p>
      </div>
    </div>
  );
}
