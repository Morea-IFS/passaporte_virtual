#!/usr/bin/env python3
"""Verifica RNF07 usando a API local de QA, Poppler, Pillow, pypdf e zxing-cpp.

Exemplo (com a API e o banco descartável de QA preparados):
  QA_ADMIN_EMAIL=admin@passaporte.local QA_ADMIN_PASSWORD=admin12345 \
    python3 scripts/verify_printed_qr.py --output /tmp/passaporte-print-qa

Dependências de QA: pip install pillow pypdf zxing-cpp; pdftoppm no PATH.
Não altera eventos/checkpoints. Login, exportações e logout geram auditoria.
O relatório contém os links públicos dos QR codes, nunca tokens de autenticação.
"""

import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import urllib.parse
import urllib.request

from PIL import Image
from pypdf import PdfReader
import zxingcpp


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--api-url', default='http://localhost:3333')
    parser.add_argument('--event-id', type=int)
    parser.add_argument('--output', type=Path, default=Path('/tmp/passaporte-print-qa'))
    parser.add_argument('--dpi', type=int, nargs='+', default=[150, 300])
    args = parser.parse_args()
    if not shutil.which('pdftoppm'):
        parser.error('Instale Poppler (pdftoppm) antes de executar.')
    args.output.mkdir(parents=True, exist_ok=True)
    base = args.api_url.rstrip('/') + '/api/v1'
    token = None

    def request(route, body=None, raw=False):
        headers = {'Accept': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'
        data = None
        if body is not None:
            headers['Content-Type'] = 'application/json'
            data = json.dumps(body).encode()
        with urllib.request.urlopen(urllib.request.Request(base + route, data, headers), timeout=30) as response:
            content = response.read()
            return content if raw else json.loads(content or b'{}')

    def all_rows(route):
        rows = []
        page = 1
        while True:
            response = request(f'{route}?page={page}')
            rows.extend(response['data'])
            if page >= response.get('metadata', {}).get('lastPage', 1):
                return rows
            page += 1

    try:
        account = request('/auth/login', {
            'email': os.environ.get('QA_ADMIN_EMAIL', 'admin@passaporte.local'),
            'password': os.environ.get('QA_ADMIN_PASSWORD', 'admin12345'),
        })
        token = account['data']['token']
        event_id = args.event_id
        if not event_id:
            events = all_rows('/admin/events')
            event_id = next(event['id'] for event in events if event['activeCheckpointsCount'] > 0)
        checkpoints = [row for row in all_rows(f'/admin/events/{event_id}/checkpoints') if row['isActive']]
        # Os seis nomes mais longos exercitam a composição mais apertada das etiquetas.
        selected = sorted(checkpoints, key=lambda row: len(row['name']), reverse=True)[:6]
        assert selected, 'O evento precisa de ao menos um ponto ativo.'
        selected.sort(key=lambda row: row['code'])
        urls = [row['checkinUrl'] for row in selected]
        ids = ','.join(str(row['id']) for row in selected)
        report = {'eventId': event_id, 'checkpoints': len(selected), 'checks': []}

        for layout in ['etiquetas', 'cartaz', 'entrada']:
            query = urllib.parse.urlencode({'layout': layout, 'ids': ids})
            pdf_path = args.output / f'{layout}.pdf'
            pdf_path.write_bytes(request(f'/admin/events/{event_id}/qrcodes?{query}', raw=True))
            reader = PdfReader(pdf_path)
            expected_pages = len(selected) if layout == 'cartaz' else 1
            assert len(reader.pages) == expected_pages, f'{layout}: número inesperado de páginas'
            for page_number, page in enumerate(reader.pages, 1):
                assert abs(float(page.mediabox.width) - 595.28) < 1, 'Papel precisa ser A4'
                assert abs(float(page.mediabox.height) - 841.89) < 1, 'Papel precisa ser A4'
                assert page['/Resources']['/Font'], 'Fontes precisam estar presentes no PDF'
                expected = (
                    {urls[page_number - 1]} if layout == 'cartaz' else set(urls)
                    if layout == 'etiquetas' else {urls[0].rsplit('/c/', 1)[0] + '/'}
                )
                for dpi in args.dpi:
                    prefix = args.output / f'{layout}-{page_number}-{dpi}dpi'
                    subprocess.run([
                        'pdftoppm', '-f', str(page_number), '-l', str(page_number),
                        '-r', str(dpi), '-singlefile', '-png', str(pdf_path), str(prefix),
                    ], check=True, capture_output=True)
                    png_path = prefix.with_suffix('.png')
                    with Image.open(png_path) as image:
                        actual = {barcode.text for barcode in zxingcpp.read_barcodes(image)}
                    assert actual == expected, (
                        f'{layout} página {page_number} em {dpi} dpi: '
                        f'esperado {len(expected)} QR, lidos {len(actual)}'
                    )
                    report['checks'].append({
                        'layout': layout, 'page': page_number, 'dpi': dpi,
                        'expected': len(expected), 'decoded': len(actual), 'urls': sorted(actual),
                    })
                    print(f'OK {layout}, página {page_number}, {dpi} dpi: {len(actual)} QR legíveis')
        (args.output / 'report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
        print(f"Relatório: {args.output / 'report.json'}")
    finally:
        if token:
            request('/account/logout', {})


if __name__ == '__main__':
    main()
