# 연우의 포켓 타임 · TimeGarden

연우가 좋아하는 뮤·뮤츠 그림과 보라색 마스터볼 모티프의 모험 테마를 적용했습니다. 캐릭터 그림은 앱에 포함되어 오프라인에서도 표시됩니다. iPhone과 iPad 공용이며, iPad에서는 미션을 두 열로 표시합니다. **기본 틀부터 실행하려면 [Mac 시작 안내](MAC_START.md)를 따라 `project-basic.yml`을 사용하세요.** 기본 버전에는 Screen Time 확장·App Group entitlement가 없어 시뮬레이터와 개인 기기에서 먼저 화면과 타이머를 확인할 수 있습니다. [그림 출처](ARTWORK.md).

아이의 약속 실천에 따라 부모가 YouTube 허용 시간을 늘리거나 줄이는 **iPhone / iPad 네이티브 앱**입니다. SwiftUI와 Apple Screen Time API를 사용하며 iOS / iPadOS 18 이상을 대상으로 합니다.

## 구현한 기능

- 아이가 바로 볼 수 있는 큰 총시간 표시(예: 1시간 30분 / 총 90분), 기본 시간과 오늘의 보상·차감 합계 및 기록
- 기본 30분, 부모가 기본 시간 변경 가능
- 한글 공부 +30분, 매일 패드로 하는 북클럽 학습 +30분, 책읽기 +30분, 약속 미준수 −5분 및 사유 직접 입력
- 부모 메뉴에서 미션 추가·수정·삭제, 미션별 보상 1~120분 조정 및 5·10·15·30분 빠른 선택. 설정은 기기에 저장하고 아이 화면에도 반영하며, 기존 보상 기록은 수정·삭제하지 않음.
- 오늘만 적용되는 보상·차감, 0~240분 제한
- 부모 메뉴 6자리 비밀번호, Keychain에 salt와 해시 저장, 5회 실패 시 1분 잠금
- FamilyActivityPicker로 제한할 앱 / 카테고리 / 웹사이트 선택
- DeviceActivity 모니터 확장에서 한도 도달 시 ManagedSettings 차단
- 앱과 확장이 App Group을 통해 설정 공유
- 서버 없이 기기에 기록 저장

## M5 자동 끄기와 시청 타이머

**기본 틀 먼저 사용하기:** 서버 설정 없이 앱을 열면 기기 내 연습 타이머가 표시됩니다. 부모가 보상을 반영하면 총시간과 남은 시간이 늘어나며, 아이가 `보기 시작 / 잠깐 멈춤 / 다 봤어요`로 직접 조작할 수 있습니다. 경과 시간은 시작 시각 기준으로 계산하고 기기에 저장합니다. TV 전원을 끄거나 실제 재생 여부를 감지하지 않습니다. TV 연결 설정은 부모 메뉴에서 접힌 상태로 표시됩니다.

별도 서버를 추가하면 아이 화면에서 `보기 시작 / 잠깐 멈춤 / 다 봤어요`를 누르고 남은 시간을 큰 숫자로 볼 수 있습니다. 앱을 닫아도 서버가 시간을 계산하며, 0초에 SmartThings를 통해 M5 끄기 명령을 보냅니다. 보상 기록은 로컬에, 시청 타이머는 서버 영속 저장소에 보관합니다. 기존 패드 Screen Time 제한과 이 수동 타이머의 사용량은 자동으로 합산하지 않습니다.

인증 정보와 상시 서버가 필요하며 현재 실제 M5 연결은 미검증입니다. [서버 설치 및 연결 안내](server/README.md)를 참고하세요. SmartThings 토큰을 앱에 넣거나 채팅으로 보내지 마세요.

현재 버전은 **아이 기기에 설치해 부모가 직접 관리하는 방식**입니다. 부모 기기에서 원격으로 시간을 변경하는 기능은 포함하지 않습니다. YouTube만 관리하려면 선택 화면에서 YouTube와 관련 웹사이트를 직접 선택하세요. 여러 앱을 선택하면 사용 시간이 합산됩니다. 홈의 숫자는 실제 남은 시간이 아닌 **오늘의 총 허용량**입니다.

## Mac에서 빌드

필요: Xcode 16 이상, XcodeGen, Apple 개발 서명 팀, iOS 18 이상 실제 기기.

```sh
brew install xcodegen
cd /path/to/newwork
xcodegen generate
open TimeGarden.xcodeproj
```

1. `project.yml`의 `com.example.timegarden` 번들 식별자와 `group.com.example.timegarden` App Group을 본인 계정의 고유 식별자로 바꾸세요. `Shared/Allowance.swift`의 `SharedStore.group`도 같은 App Group으로 변경해야 합니다.
2. 앱과 `TimeMonitor` 확장 양쪽에 같은 Development Team을 지정하고 Family Controls 및 App Groups 권한을 프로비저닝하세요.
3. 실제 기기를 선택해 `TimeGarden` 스킴을 실행하세요. Apple 배포 / TestFlight에는 앱과 확장에 대한 Family Controls 배포 entitlement 승인이 필요합니다.
4. 부모가 처음 앱을 열어 비밀번호를 만들고, 부모 메뉴에서 스크린 타임 승인 및 YouTube 선택을 진행하세요.

이 버전은 `.individual` 승인을 사용합니다. 앱의 비밀번호는 앱 내 부모 메뉴만 보호합니다. 기기 소유자는 시스템 설정에서 승인을 해제하거나 앱을 삭제할 수 있으므로 삭제 방지나 우회 방지를 보장하지 않습니다. 자녀 계정에 대한 `.child` 승인, Family Sharing 및 원격 부모 관리는 후속 개발 범위입니다.

## 검증

Mac에서 프로젝트 생성 후:

```sh
xcodebuild -project TimeGarden.xcodeproj -scheme TimeGarden \
  -destination 'platform=iOS Simulator,name=iPhone 16' test
```

시뮬레이터 이름은 `xcodebuild -showdestinations -scheme TimeGarden -project TimeGarden.xcodeproj` 결과에 맞추세요. `AllowanceTests`는 보상·차감 합산, 상하한 및 실제 반영량, 날짜 경계 초기화, 저장 형식 왕복을 검증합니다.

실제 기기에서 반드시 확인할 시나리오:

1. 승인 거부 / 승인 허용, 앱 선택 / 해제.
2. 기본 0분에서 즉시 차단, 기본 5분에서 사용 한도 도달 후 차단.
3. 이미 시청한 상태에서 보상 / 차감: `includesPastActivity`로 오늘의 기존 사용량을 포함해 다시 평가되는지 확인.
4. 앱을 닫아도 모니터 확장의 차단이 동작하는지 확인.
5. 자정에 전날 보상·차감이 만료되고 기본 한도로 돌아오는지 확인.
6. 앱 재실행 후 기록 유지, 부모 비밀번호 오류 및 잠금.
7. 기기 재시작, 시간대 변경, 권한 철회 이후 상태 표시와 제한 동작.

DeviceActivity 임계값 콜백은 OS가 전달하므로 즉각적인 초 단위 차단을 보장하지 않습니다. 특히 한도 변경 및 자정 전환 시 실제 기기 검증이 필요합니다. 이 저장소를 작성한 Linux 환경에는 Xcode / Apple SDK가 없어 **iOS 컴파일, XCTest 실행 및 기기 차단 동작은 아직 검증하지 못했습니다**.
