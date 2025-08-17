'use client';

import NavigationHeader from '@/components/navigation/NavigationHeader';
import EducationalFooter from '@/components/navigation/EducationalFooter';

export default function VidaComHansenitePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Schema.org JSON-LD para MedicalWebPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "MedicalWebPage",
            "name": "Vida com Hanseníase - Qualidade de Vida e Direitos",
            "description": "Informações essenciais sobre qualidade de vida, direitos e reintegração social para pessoas com hanseníase.",
            "url": "https://roteirosdedispensacao.com/vida-com-hanseniase",
            "medicalAudience": [
              {
                "@type": "MedicalAudience",
                "audienceType": "https://schema.org/Patient"
              },
              {
                "@type": "MedicalAudience",
                "audienceType": "https://schema.org/Caregiver"
              }
            ],
            "specialty": {
              "@type": "MedicalSpecialty",
              "name": "Dermatologia"
            },
            "about": {
              "@type": "MedicalCondition",
              "name": "Hanseníase",
              "alternateName": "Lepra",
              "description": "Informações sobre qualidade de vida com hanseníase"
            },
            "lastReviewed": "2024-12-01",
            "reviewedBy": {
              "@type": "Organization", 
              "name": "Universidade de Brasília"
            },
            "mainEntity": {
              "@type": "MedicalCondition",
              "name": "Hanseníase",
              "description": "Qualidade de vida, direitos e cuidados para pessoas com hanseníase"
            },
            "significantLink": [
              "https://roteirosdedispensacao.com/chat"
            ],
            "breadcrumb": {
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Início",
                  "item": "https://roteirosdedispensacao.com"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Vida com Hanseníase",
                  "item": "https://roteirosdedispensacao.com/vida-com-hanseniase"
                }
              ]
            }
          })
        }}
      />

      {/* Header público simplificado */}
      <header role="banner">
        <NavigationHeader />
      </header>
      
      {/* Conteúdo principal */}
      <main id="main-content" style={{ flex: 1 }}>
      <div style={{ maxWidth: 'min(1200px, 95vw)', margin: '0 auto', padding: '2rem' }}>
        {/* Header da página */}
        <div style={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
          color: 'white',
          padding: '3rem 2rem',
          borderRadius: '16px',
          marginBottom: '3rem',
          textAlign: 'center'
        }}>
          <h1 style={{ 
            fontSize: 'clamp(2rem, 5vw, 3rem)', 
            fontWeight: 'bold', 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem'
          }}>
            💜 Vida com Hanseníase
          </h1>
          <p style={{ 
            fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', 
            opacity: 0.9,
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            Informações essenciais sobre qualidade de vida, direitos e reintegração social
          </p>
          <div style={{
            marginTop: '1.5rem',
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            fontSize: '1rem'
          }}>
            ✨ <strong>Acesso público e gratuito</strong> - Informações para toda a comunidade
          </div>
        </div>

        {/* Seção: Qualidade de Vida */}
        <section style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{
            fontSize: '2rem',
            color: '#7c3aed',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            🌟 Qualidade de Vida e Bem-Estar
          </h2>
          
          <div style={{ fontSize: '1.1rem', lineHeight: '1.7', color: '#374151' }}>
            <p style={{ marginBottom: '1.5rem' }}>
              <strong>A hanseníase, quando diagnosticada precocemente e tratada adequadamente, não impede uma vida plena, produtiva e feliz.</strong> Milhões de pessoas ao redor do mundo vivem normalmente após o tratamento completo.
            </p>
            
            <h3 style={{ color: '#7c3aed', fontSize: '1.5rem', marginBottom: '1rem' }}>
              💪 Cuidados Físicos Essenciais:
            </h3>
            <ul style={{ marginBottom: '2rem', paddingLeft: '1.5rem' }}>
              <li><strong>Hidratação diária:</strong> Cremes e óleos para pele ressecada</li>
              <li><strong>Proteção solar:</strong> FPS 30+ para áreas com alteração de sensibilidade</li>
              <li><strong>Exercícios específicos:</strong> Fortalecimento muscular e amplitude articular</li>
              <li><strong>Cuidados preventivos:</strong> Inspeção diária de mãos e pés</li>
            </ul>

            <h3 style={{ color: '#7c3aed', fontSize: '1.5rem', marginBottom: '1rem' }}>
              🧠 Aspectos Emocionais:
            </h3>
            <ul style={{ marginBottom: '2rem', paddingLeft: '1.5rem' }}>
              <li><strong>Enfrentamento do diagnóstico:</strong> Negação, medo e ansiedade são reações normais</li>
              <li><strong>Rede de apoio:</strong> Família, amigos, grupos de apoio e profissionais</li>
              <li><strong>Autoestima:</strong> Processo gradual de adaptação às mudanças</li>
              <li><strong>Atividades prazerosas:</strong> Hobbies, lazer e socialização</li>
            </ul>

            <div style={{
              background: '#f0f9ff',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '2px solid #e0f2fe',
              marginTop: '1.5rem'
            }}>
              <h4 style={{ color: '#0369a1', marginBottom: '0.75rem' }}>
                💝 História Inspiradora:
              </h4>
              <p style={{ fontStyle: 'italic', color: '#0c4a6e' }}>
                "Maria, 45 anos, completou tratamento há 2 anos. Inicialmente deprimida pela hiperpigmentação, hoje é líder de grupo de apoio e trabalha como consultora em empresa multinacional. 'A hanseníase me ensinou que sou mais forte do que imaginava.'"
              </p>
            </div>
          </div>
        </section>

        {/* Seção: Direitos e Benefícios */}
        <section style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{
            fontSize: '2rem',
            color: '#059669',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            ⚖️ Direitos e Proteção Legal
          </h2>
          
          <div style={{ fontSize: '1.1rem', lineHeight: '1.7', color: '#374151' }}>
            <p style={{ marginBottom: '1.5rem' }}>
              <strong>As pessoas afetadas pela hanseníase têm direitos constitucionais e legais específicos</strong> que garantem dignidade, tratamento adequado e proteção contra discriminação.
            </p>
            
            <h3 style={{ color: '#059669', fontSize: '1.5rem', marginBottom: '1rem' }}>
              🏥 Direito à Saúde (Constituição Federal Art. 196):
            </h3>
            <ul style={{ marginBottom: '2rem', paddingLeft: '1.5rem' }}>
              <li><strong>Tratamento gratuito:</strong> PQT-U fornecida pelo SUS sem custo</li>
              <li><strong>Assistência integral:</strong> Diagnóstico, tratamento, reabilitação</li>
              <li><strong>Acesso universal:</strong> Independente de condição socioeconômica</li>
              <li><strong>Continuidade:</strong> Seguimento pós-alta por 5 anos</li>
            </ul>

            <h3 style={{ color: '#059669', fontSize: '1.5rem', marginBottom: '1rem' }}>
              💰 Benefícios Disponíveis:
            </h3>
            <ul style={{ marginBottom: '2rem', paddingLeft: '1.5rem' }}>
              <li><strong>Pensão especial (Lei 9.010/1995):</strong> Um salário mínimo vitalício para ex-portadores</li>
              <li><strong>Auxílio-doença:</strong> Durante incapacidade temporária para trabalho</li>
              <li><strong>BPC:</strong> Para pessoas com deficiência e baixa renda familiar</li>
              <li><strong>FGTS:</strong> Saque disponível para tratamento e necessidades especiais</li>
            </ul>

            <h3 style={{ color: '#059669', fontSize: '1.5rem', marginBottom: '1rem' }}>
              🛡️ Proteção contra Discriminação:
            </h3>
            <ul style={{ marginBottom: '2rem', paddingLeft: '1.5rem' }}>
              <li><strong>Lei 7.716/1989:</strong> Discriminação por hanseníase é CRIME</li>
              <li><strong>Estabilidade no emprego:</strong> 12 meses após retorno do auxílio-doença</li>
              <li><strong>Ministério Público:</strong> Defesa de direitos coletivos</li>
              <li><strong>Defensoria Pública:</strong> Assistência jurídica gratuita</li>
            </ul>

            <div style={{
              background: '#f0fdf4',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '2px solid #bbf7d0',
              marginTop: '1.5rem'
            }}>
              <h4 style={{ color: '#16a34a', marginBottom: '0.75rem' }}>
                ⚖️ Caso de Sucesso:
              </h4>
              <p style={{ fontStyle: 'italic', color: '#14532d' }}>
                "Pedro foi demitido após empregador descobrir diagnóstico. Processo trabalhista por discriminação resultou em reintegração + indenização por danos morais. Empresa foi obrigada a promover campanha educativa."
              </p>
            </div>
          </div>
        </section>

        {/* Seção: Cuidados Familiares */}
        <section style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{
            fontSize: '2rem',
            color: '#ea580c',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            👨‍👩‍👧‍👦 Cuidados Familiares e Prevenção
          </h2>
          
          <div style={{ fontSize: '1.1rem', lineHeight: '1.7', color: '#374151' }}>
            <p style={{ marginBottom: '1.5rem' }}>
              <strong>A família desempenha papel fundamental</strong> no sucesso do tratamento, na prevenção da transmissão e na reintegração social.
            </p>
            
            <h3 style={{ color: '#ea580c', fontSize: '1.5rem', marginBottom: '1rem' }}>
              📚 Educação Familiar:
            </h3>
            <ul style={{ marginBottom: '2rem', paddingLeft: '1.5rem' }}>
              <li><strong>Informações científicas:</strong> Doença bacteriana curável, baixa transmissibilidade</li>
              <li><strong>Desmistificação:</strong> Não é hereditária, não transmite por objetos</li>
              <li><strong>Tratamento:</strong> PQT-U torna pessoa não transmissora em poucos dias</li>
              <li><strong>Prognóstico:</strong> Cura completa com tratamento adequado</li>
            </ul>

            <h3 style={{ color: '#ea580c', fontSize: '1.5rem', marginBottom: '1rem' }}>
              🔍 Vigilância de Contactantes:
            </h3>
            <ul style={{ marginBottom: '2rem', paddingLeft: '1.5rem' }}>
              <li><strong>Exame anual:</strong> Por 5 anos após diagnóstico do caso índice</li>
              <li><strong>Quem deve fazer:</strong> Pessoas que moram/moraram na mesma casa</li>
              <li><strong>Vacina BCG:</strong> Recomendada para contactantes como prevenção</li>
              <li><strong>Sinais de alerta:</strong> Manchas, dormências, espessamento neural</li>
            </ul>

            <div style={{
              background: '#fff7ed',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '2px solid #fed7aa',
              marginTop: '1.5rem'
            }}>
              <h4 style={{ color: '#ea580c', marginBottom: '0.75rem' }}>
                👨‍👩‍👧‍👦 História Familiar:
              </h4>
              <p style={{ fontStyle: 'italic', color: '#9a3412' }}>
                "Família Silva: quando Carlos foi diagnosticado, toda família passou por exames. Filha de 12 anos apresentou mancha suspeita, diagnosticada precocemente. Dois casos tratados com sucesso, família fortalecida pelo enfrentamento conjunto."
              </p>
            </div>
          </div>
        </section>

        {/* Seção: Recursos de Apoio */}
        <section style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2.5rem',
          marginBottom: '2rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{
            fontSize: '2rem',
            color: '#7c2d12',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            📞 Recursos de Apoio e Contatos
          </h2>
          
          <div style={{ fontSize: '1.1rem', lineHeight: '1.7', color: '#374151' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem'
            }}>
              {/* MORHAN */}
              <div style={{
                background: '#f3f4f6',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #d1d5db'
              }}>
                <h3 style={{ color: '#7c2d12', fontSize: '1.25rem', marginBottom: '1rem' }}>
                  🤝 MORHAN
                </h3>
                <p style={{ marginBottom: '0.75rem' }}>
                  <strong>Movimento de Reintegração das Pessoas Atingidas pela Hanseníase</strong>
                </p>
                <ul style={{ fontSize: '1rem', paddingLeft: '1rem' }}>
                  <li>Orientação jurídica</li>
                  <li>Grupos de apoio</li>
                  <li>Advocacia pelos direitos</li>
                  <li>Núcleos em vários estados</li>
                </ul>
              </div>

              {/* Serviços Governamentais */}
              <div style={{
                background: '#fef3c7',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #fcd34d'
              }}>
                <h3 style={{ color: '#92400e', fontSize: '1.25rem', marginBottom: '1rem' }}>
                  🏛️ Serviços Públicos
                </h3>
                <ul style={{ fontSize: '1rem', paddingLeft: '1rem' }}>
                  <li><strong>Disque Saúde:</strong> 136 (24h)</li>
                  <li><strong>INSS:</strong> 135 (benefícios)</li>
                  <li><strong>Defensoria Pública:</strong> Assistência jurídica gratuita</li>
                  <li><strong>Ministério Público:</strong> Defesa de direitos</li>
                </ul>
              </div>

              {/* Apoio Psicológico */}
              <div style={{
                background: '#e0f2fe',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #bae6fd'
              }}>
                <h3 style={{ color: '#0369a1', fontSize: '1.25rem', marginBottom: '1rem' }}>
                  💙 Apoio Emocional
                </h3>
                <ul style={{ fontSize: '1rem', paddingLeft: '1rem' }}>
                  <li><strong>CVV:</strong> 188 (24h, gratuito)</li>
                  <li><strong>CAPS:</strong> Atendimento psicológico</li>
                  <li><strong>Grupos online:</strong> WhatsApp e Facebook</li>
                  <li><strong>Chat da plataforma:</strong> Dr. Gasnelio e Gá</li>
                </ul>
              </div>
            </div>

            <div style={{
              background: 'rgba(220, 38, 38, 0.1)',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '2px solid #dc2626',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: '1.1rem',
                color: '#dc2626',
                margin: 0,
                fontWeight: '700'
              }}>
                🚨 <strong>EMERGÊNCIA MÉDICA:</strong> SAMU 192 | Disque Saúde 136
              </p>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <div style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          padding: '2rem',
          borderRadius: '16px',
          textAlign: 'center',
          border: '2px solid #bfdbfe'
        }}>
          <h3 style={{
            fontSize: '1.5rem',
            color: '#003366',
            marginBottom: '1rem'
          }}>
            💬 Precisa de Mais Informações?
          </h3>
          <p style={{
            fontSize: '1.1rem',
            color: '#0369a1',
            marginBottom: '1.5rem'
          }}>
            Nossos assistentes virtuais estão disponíveis 24/7 para esclarecer suas dúvidas
          </p>
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <a
              href="/chat"
              style={{
                padding: '1rem 2rem',
                background: '#003366',
                color: 'white',
                borderRadius: '12px',
                textDecoration: 'none',
                fontSize: '1rem',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              🤖 Conversar com Dr. Gasnelio ou Gá
            </a>
            <a
              href="/modules"
              style={{
                padding: '1rem 2rem',
                background: '#059669',
                color: 'white',
                borderRadius: '12px',
                textDecoration: 'none',
                fontSize: '1rem',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              📚 Módulos Educacionais
            </a>
          </div>
        </div>
      </div>
      </main>
      
      {/* Footer público */}
      <footer role="contentinfo">
        <EducationalFooter variant="full" showNavigation={true} />
      </footer>
    </div>
  );
}