# Reading action artwork

`pokemon-actions.png` is an illustrated atlas generated for this family learning app from the approved Charmander concept and existing character references. It contains no text or labels.

Rows: Charmander, Squirtle, Bulbasaur. Columns: sleep, eat, drink, walk, jump.

Bulbasaur supports its body on four legs and holds the berry with vines emerging beneath its bulb. Walking and jumping poses retain quadruped anatomy. The other two species walk on two legs.

The 1620 × 971 atlas is shown through clipped SVG viewports in `sentence-pictures.js`. Small insets exclude grid borders. The generated source image remains unchanged; the app does not assemble these actions from standing sprites and props.

`companion-actions.png` adds nine poses each for Pikachu and Eevee: sleep, eat, drink, walk, jump, ball play, sit, wave and run. Eevee keeps its quadruped anatomy; waving raises one forepaw while seated.

`activity-details.png` contains the flower-watering color variants, Eevee's three tree positions, vine-driven Bulbasaur ball play, Squirtle ball play, and Pikachu ball color/size variants. A tree branch visibly supports Eevee in the 'on' scene.

`reading-illustrations.js` records each sheet's actual dimensions, measured separator boundaries and scene keys. The generated columns are not assumed to be equal in width. Conditions select their own illustration; the renderer does not paste a colored object onto an idle Pokemon. Images are also used in paired-action sentences.
