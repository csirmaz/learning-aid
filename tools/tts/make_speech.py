
# Process spellbee.html, extract words
# make sure sounds exist for them; if not,
# produce mp3 files

# INSTALLATION
# pyenv install 3.12
# tools/tts$ pyenv local 3.12.9
# tools/tts$ python -m venv ~/pythonenvs/tts
# tools/tts$ . ~/pythonenvs/tts/bin/activate
# tools/tts$ pip install kokoro soundfile

# See https://github.com/hexgrad/kokoro
# See https://thomazrb.github.io/posts/python-tts-kokoro/

import re
import os
import os.path
from kokoro import KPipeline
import soundfile as sf
import numpy as np

html_file = '../../spellbee.html'
mp3_dir = '../../assets/sounds/words/'

def generate_tts(text, outfile, voice_ix):
    pipe = KPipeline(lang_code="b", repo_id="hexgrad/Kokoro-82M")
    voices = ['bf_alice', 'bm_lewis', 'bm_george']
    audio = []
    for _, _, chunk in pipe(text, voice=voices[voice_ix]):
        audio.append(chunk)
    audio = np.concatenate(audio)
    sf.write(outfile, audio, 24000, bitrate_mode='CONSTANT', compression_level=.5) # .mp3


def avoid_tts(text):
    """Return true if we should not generate mp3 for this text"""
    # For these the model does not work well
    return text in [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
        'feather',
        'a feather',
        'put',
        'pay by card',
        'card'
    ]

seen = set()
def check_text(phrase):
    filename = phrase.lower().replace(' ', '_')
    filename = re.sub(r'[^a-z_]', '', filename)
    filename = mp3_dir + filename + '.mp3'
    
    if filename in seen:
        return
    seen.add(filename)
    
    if os.path.exists(filename):
        print(f"{phrase} OK")
        return
    
    if avoid_tts(phrase):
        print(f"Avoiding generating for {phrase}")
        return
    
    print(f"Need to generate: {phrase} -> {filename}")
    voice_ix = np.random.randint(3)
    generate_tts(phrase, filename, voice_ix)


def scan_words():
    word_area = False
    for line in open(html_file, 'r'):
        if '[WORDS START]' in line:
            word_area = True
            continue
        if '[WORDS END]' in line:
            word_area = False
            continue
        if word_area:
            match = re.search(r'"text"\s*:\s*"([^"]+)"', line)
            if match:
                phrase = match.group(1)
                phrase = phrase.replace(r"\'", "'")
                check_text(phrase.replace('<','').replace('>',''))
                
                parts = list(re.findall(r'<([^>]+)>', phrase))
                if len(parts) > 1:
                    for p in parts:
                        check_text(p)

scan_words()
# generate_tts("Eight is a feather", "test0.mp3", 0)
# generate_tts("Eight is a feather", "test1.mp3", 1)
