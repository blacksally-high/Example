"""검증된 프로젝트 소스를 배포용 ZIP으로 만듭니다. 실제 사용자 데이터는 포함하지 않습니다."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import shutil
root=Path(__file__).resolve().parent.parent
shutil.copyfile(root/'README.md',root/'dist/README.md')
files=[root/'README.md',root/'package.json',root/'.gitignore']
for folder in ('dist','tests','scripts','.github'):
    files.extend(p for p in (root/folder).rglob('*') if p.is_file() and p.suffix!='.zip' and '__pycache__' not in p.parts)
with ZipFile(root/'dist/재고온_소스코드.zip','w',ZIP_DEFLATED) as archive:
    for p in sorted(set(files)):
        archive.write(p,'jaegoon-inventory/'+str(p.relative_to(root)))
print('Packaged:',root/'dist/재고온_소스코드.zip')
