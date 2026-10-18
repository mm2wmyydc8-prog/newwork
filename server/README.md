# M5 자동 끄기 서버

시놀로지 NAS 사용자는 [NAS 설치 안내](SYNOLOGY.md)와 `compose.yaml`을 사용하세요. Container Manager 지원 여부를 먼저 확인해야 합니다.

앱에서 시작한 시청 시간을 서버가 차감하고, 0초가 되면 SmartThings `main / switch / off` 명령을 보냅니다. **아이폰 앱이 종료되어도 서버가 실행 중이면 동작합니다.** 종료 5분 전과 종료 시 아이폰 로컬 알림은 알림 권한을 허용한 경우에 예약합니다. TV 화면 자체에 경고를 표시하지는 않습니다.

## 현재 검증 범위

실제 HTTP 경로, 인증, 시간 차감, 일시정지·재개, 재시작 복구, 자정 초기화, 실패 재시도, SmartThings 요청 형식은 자동 테스트로 검증했습니다. SmartThings 응답은 테스트 대역을 사용했습니다. 실제 M5, 실제 SmartThings 인증, 공개 HTTPS 배포, iOS 실행은 아직 검증하지 않았습니다.

## 준비할 것

- 항상 실행할 Node.js 22 이상 서버 또는 Docker 호스트
- 서버용 HTTPS 주소. iOS 앱은 HTTPS만 허용합니다.
- SmartThings API 인증 토큰과 M5 장치 ID
- 이 앱 전용 무작위 접속 키. SmartThings 토큰과 다른 키입니다.
- 영속 디스크. 임시 파일시스템에 저장하면 서버 교체 시 타이머 기록이 사라집니다.

SmartThings 토큰에는 대상 기기의 상태 조회와 명령 실행 권한이 필요합니다. 토큰은 서버의 비밀 설정에만 보관하고, 아이폰에는 보내지 않습니다. 개발용 Personal Access Token은 만료될 수 있으므로 발급 시 표시되는 만료 시간을 확인하고 교체해야 합니다. **이 버전은 삼성 계정 OAuth 로그인·자동 토큰 갱신을 구현하지 않았습니다.** 오래 운영하려면 OAuth 연동을 추가하거나 서버의 토큰을 유효하게 유지해야 합니다.

SmartThings API 기준: `GET https://api.smartthings.com/v1/devices`로 장치 ID 확인, `GET /v1/devices/{deviceId}/status`로 상태 조회, `POST /v1/devices/{deviceId}/commands`로 전원 끄기. [공식 인증 안내](https://developer.smartthings.com/docs/getting-started/authorization-and-permissions)를 확인하세요. 스마트폰의 SmartThings 앱 로그인 자체가 이 서버에 인증을 제공하지는 않습니다.

## 실행

```sh
cd server
cp .env.example .env
# 편집기에서 .env 값을 입력하세요. 채팅이나 Git에 비밀 값을 올리지 마세요.
node --env-file=.env index.mjs
```

별도 npm 설치가 필요하지 않습니다. `.env`는 Node의 `--env-file`로 읽으며, 설정 파일을 셸에서 source할 필요가 없습니다.

`.env`에 필요한 값:

| 이름 | 내용 |
| --- | --- |
| `SMARTTHINGS_TOKEN` | SmartThings 기기 조회·명령 권한이 있는 토큰 |
| `SMARTTHINGS_DEVICE_ID` | 본인의 M5 장치 ID |
| `APP_API_KEY` | 32바이트 이상 무작위 접속 키 |
| `STATE_FILE` | 영속 디스크의 타이머 상태 파일 |
| `TIMER_TIMEZONE` | 현재 iOS 앱과 동일하게 `Asia/Seoul` 사용 |

접속 키는 `openssl rand -hex 32` 등으로 로컬에서 생성해 비밀 설정에 저장하세요. 실제 값을 로그나 저장소에 남기지 마세요.

기본 바인딩은 `127.0.0.1:3000`입니다. HTTPS 역방향 프록시 뒤에서 실행하고, 외부에서 암호화되지 않은 포트에 직접 접근하지 못하도록 설정하세요. API 키를 URL에 넣지 마세요. 서버는 한 가정의 한 모니터·한 시청 시간 통장 용도입니다. 여러 서버 인스턴스를 같은 상태 파일로 실행하면 안 됩니다. 영속 상태 파일이 손상되면 초기화하지 않고 시작을 거부합니다.

Docker를 사용할 경우:

```sh
docker build -t timegarden-timer .
docker volume create timegarden-data
docker run -d --name timegarden-timer --restart unless-stopped \
  --env-file .env -p 127.0.0.1:3000:3000 \
  -v timegarden-data:/app/data timegarden-timer
```

Docker의 `.env`에서 `STATE_FILE=/app/data/timer.json`, `BIND_HOST=0.0.0.0`으로 지정하세요. Docker 실행 자체는 현재 개발 환경에서 검증하지 않았습니다. 운영 호스트의 HTTPS 프록시와 재시작 정책 설정이 별도로 필요합니다.

## 아이폰에서 연결

부모님 메뉴 → M5 자동 끄기 연결 → 서버 HTTPS 주소와 `APP_API_KEY` 입력 → 연결 확인하고 저장.

연결 확인은 SmartThings **상태 조회만** 하며 모니터를 끄지 않습니다. 먼저 사용자가 안전하게 테스트할 수 있는 때에 1분 한도로 실제 기기 테스트를 하세요. 시작 버튼은 모니터를 켜지 않습니다. 시청을 시작할 때 모니터를 직접 켜고 버튼을 누르는 방식입니다.

- **보기 시작:** 남은 시간부터 차감. 앱 종료 후에도 서버에서 계속 진행.
- **잠깐 멈춤:** 시간만 정지. 모니터는 계속 켜져 있음.
- **다 봤어요:** 타이머 정지 + M5 끄기 명령. 남은 시간 유지.
- **0초:** M5 끄기 명령. 실패하면 5초부터 최대 60초 간격으로 계속 재시도.
- **자정:** 시청 중이면 끄기를 요청하고 세션 종료. 전날 보상은 만료, 기본 시간으로 초기화.
- **보상·차감:** 서버에 총 허용량을 보내되 이미 사용한 시간은 유지. 앱이 연결되지 않으면 변경 반영이 지연됨.

화면의 ‘명령 전송됨’은 SmartThings가 명령을 수락했다는 뜻이며, 기기의 실제 전원이 꺼졌다는 확인은 아닙니다. 모니터·네트워크 장애, 토큰 만료, 서버 중지 중에는 정시 종료를 보장하지 않습니다. 서버가 재시작하면 지난 타이머를 복구하고 만료된 세션의 끄기를 재시도합니다. 서버가 꺼져 있는 동안에는 명령을 실행할 수 없습니다.

패드의 실제 YouTube 사용량과 TV 수동 타이머는 자동 합산하지 않습니다. 이 서버는 사용자가 누른 ‘시작·멈춤’을 기준으로 하는 별도 통장입니다. 여러 기기에서 같은 서버 통장을 공유할 때는 기본·보상 설정을 한 부모 기기에서 관리하세요.

## 테스트

```sh
npm test
```

테스트에는 실제 인증 정보가 필요 없고, 실제 모니터를 켜거나 끄지 않습니다.
