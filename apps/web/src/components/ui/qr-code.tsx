import QRCode from 'qrcode'

/**
 * QR code em SVG gerado no servidor (sem JavaScript no navegador).
 */
export async function QrCode({ value, label }: { value: string; label: string }) {
  const svg = await QRCode.toString(value, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 2,
    color: { dark: '#1d1147', light: '#ffffff' },
  })
  return (
    <div
      role="img"
      aria-label={label}
      className="aspect-square w-full max-w-56 overflow-hidden rounded-m bg-white [&>svg]:size-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
