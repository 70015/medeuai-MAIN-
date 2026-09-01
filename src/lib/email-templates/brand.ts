// Shared MedEuAi email brand styles. Body background must stay #ffffff.

export const brand = {
  deepGreen: '#04211C',
  emerald: '#03824F',
  text: '#3f4a45',
  muted: '#8a938f',
  codeBg: '#f2f7f4',
}

export const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif",
}

export const container = { padding: '28px 25px', maxWidth: '520px' }

export const brandName = {
  fontSize: '16px',
  fontWeight: '800' as const,
  color: brand.deepGreen,
  letterSpacing: '-0.02em',
  margin: '0 0 24px',
}

export const brandAccent = { color: brand.emerald }

export const h1 = {
  fontSize: '22px',
  fontWeight: '800' as const,
  color: brand.deepGreen,
  letterSpacing: '-0.02em',
  margin: '0 0 16px',
}

export const text = {
  fontSize: '14px',
  color: brand.text,
  lineHeight: '1.6',
  margin: '0 0 22px',
}

export const link = { color: brand.emerald, textDecoration: 'underline' }

export const button = {
  backgroundColor: brand.emerald,
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '700' as const,
  borderRadius: '10px',
  padding: '13px 24px',
  textDecoration: 'none',
}

export const codeWrap = {
  backgroundColor: brand.codeBg,
  borderRadius: '10px',
  padding: '18px 20px',
  textAlign: 'center' as const,
  margin: '0 0 22px',
}

export const codeText = {
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '28px',
  fontWeight: '700' as const,
  letterSpacing: '8px',
  color: brand.deepGreen,
  margin: '0',
}

export const footer = { fontSize: '12px', color: brand.muted, margin: '28px 0 0', lineHeight: '1.5' }
