# 캐릭터 아트워크 출처

뮤(Mew, #151), 뮤츠(Mewtwo, #150) 그림은 PokeAPI sprites 공개 저장소의 `official-artwork` 파일을 앱의 Asset Catalog에 포함했습니다.

- 뮤: https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/151.png
- 뮤츠: https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png
- 저장소: https://github.com/PokeAPI/sprites

웹 도감의 추가 149종도 같은 저장소 `sprites/pokemon/other/official-artwork/{dex}.png`에서 가져왔습니다. 종별 도감 번호(`dex`)와 이름은 `docs/collection.js`의 `POKEMON` 목록에 기록했습니다. 이미지 파일은 `docs/assets/`에 포함합니다.

Pokémon 및 해당 캐릭터의 권리는 각 권리자(Nintendo / Creatures / GAME FREAK 등)에게 있습니다. 이 앱은 공식 Pokémon 제품이 아닙니다. 이미지의 공개 접근 가능 여부가 별도의 상업적 사용 허가를 의미하지는 않습니다.

마스터볼 모티프 장식은 SwiftUI 도형으로 그려집니다. 게임의 실제 자산 파일을 추출하거나 앱에서 게임 데이터를 사용하지 않습니다.

1세대 151종의 한국어 이름과 전설·환상 구분은 PokeAPI 데이터 CSV `pokemon_species_names.csv`(언어 ID 3)와 `pokemon_species.csv`를 참조했습니다.

이로치 151종은 같은 sprites 저장소의 `sprites/pokemon/other/official-artwork/shiny/{dex}.png`를 사용합니다. 색상 필터로 임의 변색하지 않고 제공된 이로치 아트워크를 `docs/assets/shiny/`에 포함했습니다.

메가뮤츠 X·Y는 같은 저장소 official-artwork의 `10043.png`, `10044.png`와 shiny 하위 경로의 이로치 그림을 사용합니다. 기존 151종에 추가된 별도 모습이며, 도감 번호는 둘 다 150입니다.
