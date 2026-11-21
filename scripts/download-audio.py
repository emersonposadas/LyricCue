#!/usr/bin/env python3
"""Download catalog WAV files. Optional --chrome uses the local Chrome session."""
import concurrent.futures
import json
from pathlib import Path
import subprocess
import sys
ROOT = Path(__file__).resolve().parent.parent

def download(song):
    target = ROOT / 'audio' / (song['id'] + '.wav')
    if target.exists():
        return True
    command = ['yt-dlp', '--no-playlist', '--no-progress', '--js-runtimes', 'node',
               '-x', '--audio-format', 'wav', '-o', str(target.with_suffix('.%(ext)s'))]
    if '--chrome' in sys.argv:
        command += ['--cookies-from-browser', 'chrome']
    result = subprocess.run(command + [song['url']], capture_output=True, text=True)
    print(song['id'] + (': OK' if result.returncode == 0 else ': FAILED\n' + result.stderr), flush=True)
    return result.returncode == 0

if __name__ == '__main__':
    (ROOT / 'audio').mkdir(exist_ok=True)
    songs = json.loads((ROOT / 'songs.json').read_text())['songs']
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        results = list(pool.map(download, songs))
    sys.exit(0 if all(results) else 1)
