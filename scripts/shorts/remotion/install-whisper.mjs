// whisper.cpp와 한국어 가능한 모델을 ~/.cache/shorts-tools/whisper 에 설치
import {installWhisperCpp, downloadWhisperModel} from '@remotion/install-whisper-cpp';
import os from 'node:os'; import path from 'node:path';
const dir = path.join(os.homedir(), '.cache/shorts-tools/whisper');
await installWhisperCpp({to: dir, version: '1.5.5'});
await downloadWhisperModel({model: 'medium', folder: dir});
console.log('ok', dir);
