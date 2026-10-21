# 파트너의 미션 완료 기술

151종과 메가뮤츠 X·Y에 보통 기술 4개를 제공합니다. 부모 요청에 따라 케이시는 순간이동 하나, 메타몽은 변신 하나만 제공합니다. 배틀이 아닌 미션 완료 축하와 오늘 할 일로 공개한 기술 다시 보기에 사용합니다.

한국어 기술명과 과거 세대를 포함한 습득 기록은 PokeAPI CSV에서 확인했습니다. 런타임에는 네트워크 조회 없이 `partner-moves.js`의 목록을 사용합니다.

- https://github.com/PokeAPI/pokeapi/blob/master/data/v2/csv/move_names.csv
- https://github.com/PokeAPI/pokeapi/blob/master/data/v2/csv/pokemon_moves.csv
- https://github.com/PokeAPI/pokeapi/blob/master/data/v2/csv/moves.csv
- https://github.com/PokeAPI/pokeapi/blob/master/data/v2/csv/pokemon_types.csv

여러 버전의 기술을 함께 사용하는 앱 구성으로, 특정 세대의 기술 배치나 배틀 규칙을 재현하지 않습니다. 진화 단계별로 역사적 습득 기록에서 서로 다른 보조 기술을 골라 중복을 줄였습니다. 제한된 기술을 가진 종은 일부 기술을 공유합니다.

기본 파트너는 뮤츠이고, 포획한 친구로 교체할 수 있습니다. 메가뮤츠 X·Y는 포획과 뮤츠나이트 보유 조건을 모두 충족해야 선택할 수 있습니다. 기술 미리보기에는 TV 시간이나 포획 보상이 없습니다.


2026-10-21 부모 지정 변경: 팬텀은 꿈먹기·섀도볼·길동무·최면술, 잠만보는 잠자기·잠꼬대·누르기·파괴광선입니다. 고라파덕·골덕은 에스퍼 기술을 최소 두 개 사용합니다. 고지는 압정뿌리기, 냐옹·페르시온은 고양이돈받기, 괴력몬은 지구던지기, 홍수몬은 폭발펀치, 캥카는 메가톤펀치·메가톤킥을 사용합니다.

명시적으로 요청한 앱 전용 예외: 라이츄·썬더의 100만볼트는 `million-volt`, 두두·코뿌리·왕콘치의 두번찌르기는 `double-horn`입니다. 이들은 원작 습득표를 재현한다고 주장하지 않으며 데이터에 `custom: true`로 표시했습니다. 상세 연출 기준은 [MOVE_EFFECTS.md](MOVE_EFFECTS.md)에 기록합니다.
