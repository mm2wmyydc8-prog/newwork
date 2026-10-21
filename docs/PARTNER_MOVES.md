# 파트너의 미션 완료 기술

151종과 메가뮤츠 X·Y에 각각 기술 4개를 제공합니다. 배틀이 아닌 미션 완료 축하와 보상 없는 기술 미리보기에 사용합니다.

한국어 기술명과 과거 세대를 포함한 습득 기록은 PokeAPI CSV에서 확인했습니다. 런타임에는 네트워크 조회 없이 `partner-moves.js`의 목록을 사용합니다.

- https://github.com/PokeAPI/pokeapi/blob/master/data/v2/csv/move_names.csv
- https://github.com/PokeAPI/pokeapi/blob/master/data/v2/csv/pokemon_moves.csv
- https://github.com/PokeAPI/pokeapi/blob/master/data/v2/csv/moves.csv
- https://github.com/PokeAPI/pokeapi/blob/master/data/v2/csv/pokemon_types.csv

여러 버전의 기술을 함께 사용하는 앱 구성으로, 특정 세대의 기술 배치나 배틀 규칙을 재현하지 않습니다. 메타몽은 고유 기술이 변신 하나이므로 나머지 세 칸은 변신 후 복사한 기술 연출임을 이름에 표시합니다.

기본 파트너는 뮤츠이고, 포획한 친구로 교체할 수 있습니다. 메가뮤츠 X·Y는 포획과 뮤츠나이트 보유 조건을 모두 충족해야 선택할 수 있습니다. 기술 미리보기에는 TV 시간이나 포획 보상이 없습니다.
