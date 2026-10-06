import base64
import io
import json
import re
import sys
import zipfile
from pathlib import Path
import xml.etree.ElementTree as ET
sys.stdin.reconfigure(encoding='utf-8')

if sys.argv[1] == 'qr':
    from reportlab.graphics.barcode.qrencoder import QRCode, QRErrorCorrectLevel
    url = 'https://www.machielvansoest.nl/boards/index-links.html'
    qr = QRCode(None, QRErrorCorrectLevel.M)
    qr.addData(url)
    qr.make()
    n = qr.getModuleCount()
    cells = ''.join(f'M{x + 4},{y + 4}h1v1h-1z' for y in range(n) for x in range(n) if qr.isDark(y, x))
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {n + 8} {n + 8}" width="492" height="492" shape-rendering="crispEdges"><title>QR-code naar de + pagina</title><desc>{url}</desc><path fill="white" d="M0,0h{n + 8}v{n + 8}H0z"/><path fill="black" d="{cells}"/></svg>\n'
    Path('PTP/qr-plus.svg').write_text(svg, encoding='utf-8')
    print(json.dumps({'url': url, 'version': qr.version, 'modules': n, 'quietZone': 4}))
else:
    request = json.load(sys.stdin)
    archive = zipfile.ZipFile(io.BytesIO(base64.b64decode(request['data'])))
    xml = archive.read('content.xml')
    for _, (prefix, uri) in ET.iterparse(io.BytesIO(xml), events=['start-ns']):
        if not re.fullmatch(r'ns\d+', prefix):
            ET.register_namespace(prefix, uri)
    root = ET.fromstring(xml)
    ns = 'urn:oasis:names:tc:opendocument:xmlns:text:1.0'
    edits = 0

    def normalize(s):
        return ''.join(c if ord(c) < 128 and c != "'" else '\ufffd' for c in s)

    for node in root.iter():
        if node.tag not in (f'{{{ns}}}p', f'{{{ns}}}h'):
            continue
        original = ''.join(node.itertext())
        changed = original
        for old, new in request['replacements']:
            # The earlier book uses Emblem / Actual for Symbol / Object.
            old = re.sub(r'\bObject\b', 'Actual', re.sub(r'\bSymbol\b', 'Emblem', old))
            new = re.sub(r'\bObject\b', 'Actual', re.sub(r'\bSymbol\b', 'Emblem', new))
            pos = normalize(changed).find(normalize(old))
            if pos != -1:
                changed = changed[:pos] + new + changed[pos + len(old):]
        if changed != original:
            for child in list(node):
                node.remove(child)
            node.text = changed
            edits += 1
    assert edits >= (1 if sys.argv[1] == 'odt-only' else 12), edits
    assert 'Outside' not in ''.join(root.itertext())
    updated = ET.tostring(root, encoding='utf-8', xml_declaration=True)
    ET.fromstring(updated)
    output = io.BytesIO()
    with zipfile.ZipFile(output, 'w') as result:
        for info in archive.infolist():
            result.writestr(info, updated if info.filename == 'content.xml' else archive.read(info.filename))
    json.dump({'data': base64.b64encode(output.getvalue()).decode('ascii'), 'edits': edits}, sys.stdout)
