// Deterministic Medical & Anatomical SVG Generator Library for FlashForge
// 100% offline - 0 API credits - Authoritative medical literature (Terminologia Anatomica & Gray's Anatomy)
// Includes Norwegian and Latin anatomical terminology

export function getDeterministicSvgForTopic(topic: string, korttype: string = ''): string {
  const t = (topic + ' ' + korttype).toLowerCase();

  // =========================================================================
  // 1. HJERTE MED PILER, KAMRE, KLAFFER & BLODSTRØM (Cor / Cardia)
  // Termer: Atrium dx/sin, Ventriculus dx/sin, Valvae, Aorta, Vena cava
  // =========================================================================
  if (
    t.match(/hjerte|cor|atrium|ventrikkel|ventriculus|forkammer|hjertekammer|klaff|valva|aorta|mitral|trikuspidal|pulmonalklaff|aortaklaff|septum/)
  ) {
    return `<svg viewBox="0 0 440 340" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrow-blue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8"/>
        </marker>
        <marker id="arrow-red" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e"/>
        </marker>
        <linearGradient id="grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0369a1" stop-opacity="0.8"/>
          <stop offset="100%" stop-color="#082f49" stop-opacity="0.95"/>
        </linearGradient>
        <linearGradient id="grad-red" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#be123c" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="#4c0519" stop-opacity="0.95"/>
        </linearGradient>
      </defs>

      <rect width="440" height="340" rx="16" fill="#090d16" stroke="#1e293b"/>

      <!-- Header Title -->
      <text x="220" y="22" fill="#38bdf8" font-size="11" font-weight="900" text-anchor="middle" letter-spacing="0.05em">
        HJERTETS ANATOMI &amp; BLODSTRØM &bull; COR
      </text>
      <text x="220" y="36" fill="#94a3b8" font-size="8.5" text-anchor="middle" font-style="italic">
        Kilde: Terminologia Anatomica / Norsk Elektronisk Legehåndbok
      </text>

      <!-- Blood Vessels Top -->
      <!-- Vena Cava Superior (Blå) -->
      <path d="M 130 45 L 130 95" stroke="#38bdf8" stroke-width="14" stroke-linecap="round"/>
      <text x="105" y="60" fill="#7dd3fc" font-size="7.5" font-weight="bold" text-anchor="end">Vena cava sup.</text>
      <text x="105" y="70" fill="#94a3b8" font-size="7" text-anchor="end">(Øvre hulvene)</text>

      <!-- Aorta Ascendens & Arcus Aortae (Rød bue) -->
      <path d="M 215 90 C 215 45, 275 40, 280 85" fill="none" stroke="#f43f5e" stroke-width="16" stroke-linecap="round"/>
      <!-- Brachiocephalic, Carotid, Subclavian branches -->
      <line x1="235" y1="52" x2="230" y2="38" stroke="#f43f5e" stroke-width="6" stroke-linecap="round"/>
      <line x1="250" y1="48" x2="252" y2="36" stroke="#f43f5e" stroke-width="6" stroke-linecap="round"/>
      <line x1="265" y1="52" x2="272" y2="38" stroke="#f43f5e" stroke-width="6" stroke-linecap="round"/>
      <text x="295" y="55" fill="#fda4af" font-size="8" font-weight="bold">Aorta (Hovedpulsåre)</text>

      <!-- Truncus Pulmonalis (Lungearterie) -->
      <path d="M 195 110 L 175 75" stroke="#0284c7" stroke-width="13" stroke-linecap="round"/>
      <text x="145" y="85" fill="#38bdf8" font-size="7.5" font-weight="bold">Truncus pulm.</text>

      <!-- Main Heart Silhouette (Høyre side blå / Venstre side rød) -->
      <!-- Septum interventriculare (skillevegg) i midten -->
      <!-- Right Heart (Anatomisk høyre = venstre side på tegning) -->
      <path d="M 130 95 C 100 100, 90 140, 110 170 C 100 200, 120 260, 205 285 L 205 130 Z" fill="url(#grad-blue)" stroke="#0284c7" stroke-width="2"/>
      <!-- Left Heart (Anatomisk venstre = høyre side på tegning) -->
      <path d="M 205 130 L 205 285 C 270 270, 330 220, 315 160 C 310 130, 280 95, 250 95 Z" fill="url(#grad-red)" stroke="#e11d48" stroke-width="2"/>

      <!-- Chambers & Labels -->
      <!-- 1. Atrium dextrum (Høyre forkammer) -->
      <circle cx="150" cy="135" r="22" fill="#0c4a6e" fill-opacity="0.4" stroke="#38bdf8" stroke-dasharray="2 2"/>
      <text x="150" y="132" fill="#ffffff" font-size="8" font-weight="bold" text-anchor="middle">Atrium dx.</text>
      <text x="150" y="142" fill="#bae6fd" font-size="7" text-anchor="middle">Høyre forkammer</text>

      <!-- 2. Ventriculus dexter (Høyre hjertekammer) -->
      <circle cx="160" cy="225" r="28" fill="#0c4a6e" fill-opacity="0.4" stroke="#38bdf8" stroke-dasharray="2 2"/>
      <text x="160" y="222" fill="#ffffff" font-size="8" font-weight="bold" text-anchor="middle">Ventriculus dx.</text>
      <text x="160" y="232" fill="#bae6fd" font-size="7" text-anchor="middle">Høyre hjertekammer</text>

      <!-- 3. Atrium sinistrum (Venstre forkammer) -->
      <circle cx="265" cy="135" r="22" fill="#881337" fill-opacity="0.4" stroke="#fb7185" stroke-dasharray="2 2"/>
      <text x="265" y="132" fill="#ffffff" font-size="8" font-weight="bold" text-anchor="middle">Atrium sin.</text>
      <text x="265" y="142" fill="#fecdd3" font-size="7" text-anchor="middle">Venstre forkammer</text>

      <!-- 4. Ventriculus sinister (Venstre hjertekammer - tykk myokardvegg) -->
      <circle cx="255" cy="225" r="30" fill="#881337" fill-opacity="0.4" stroke="#fb7185" stroke-dasharray="2 2"/>
      <text x="255" y="222" fill="#ffffff" font-size="8" font-weight="bold" text-anchor="middle">Ventriculus sin.</text>
      <text x="255" y="232" fill="#fecdd3" font-size="7" text-anchor="middle">Venstre hjertekammer</text>

      <!-- Valves (Klaffer) with Callouts -->
      <!-- Trikuspidalklaff (mellom Atrium dx og Ventriculus dx) -->
      <line x1="135" y1="165" x2="165" y2="165" stroke="#facc15" stroke-width="3" stroke-linecap="round"/>
      <text x="65" y="172" fill="#fde047" font-size="7.5" font-weight="bold">Valva tricuspidalis</text>
      <text x="65" y="181" fill="#94a3b8" font-size="6.5">(Trikuspidalklaff)</text>
      <line x1="120" y1="172" x2="136" y2="167" stroke="#fde047" stroke-width="1" stroke-dasharray="2 2"/>

      <!-- Mitralklaff / Bicuspidalis (mellom Atrium sin og Ventriculus sin) -->
      <line x1="250" y1="165" x2="280" y2="165" stroke="#facc15" stroke-width="3" stroke-linecap="round"/>
      <text x="350" y="172" fill="#fde047" font-size="7.5" font-weight="bold">Valva mitralis</text>
      <text x="350" y="181" fill="#94a3b8" font-size="6.5">(Mitralklaff / bikuspidal)</text>
      <line x1="345" y1="172" x2="282" y2="167" stroke="#fde047" stroke-width="1" stroke-dasharray="2 2"/>

      <!-- Aortaklaff & Pulmonalklaff (Semilunarklaffer) -->
      <circle cx="205" cy="155" r="5" fill="#facc15"/>
      <text x="205" y="146" fill="#fef08a" font-size="7" font-weight="bold" text-anchor="middle">Semilunarklaffer</text>

      <!-- Directional Blood Flow Arrows -->
      <!-- Deoxygenated flow: Vena cava -> RA -> RV -> Pulm. trunk -->
      <path d="M 130 75 Q 140 100 150 120" fill="none" stroke="#38bdf8" stroke-width="2.5" marker-end="url(#arrow-blue)"/>
      <path d="M 152 148 Q 155 175 160 200" fill="none" stroke="#38bdf8" stroke-width="2.5" marker-end="url(#arrow-blue)"/>
      <path d="M 175 220 Q 185 170 188 120" fill="none" stroke="#38bdf8" stroke-width="2.5" marker-end="url(#arrow-blue)"/>

      <!-- Oxygenated flow: Pulmonary veins -> LA -> LV -> Aorta -->
      <path d="M 285 105 Q 275 118 268 125" fill="none" stroke="#f43f5e" stroke-width="2.5" marker-end="url(#arrow-red)"/>
      <path d="M 265 148 Q 262 175 258 200" fill="none" stroke="#f43f5e" stroke-width="2.5" marker-end="url(#arrow-red)"/>
      <path d="M 245 220 Q 225 180 220 120" fill="none" stroke="#f43f5e" stroke-width="2.5" marker-end="url(#arrow-red)"/>

      <!-- Bottom Legend -->
      <rect x="25" y="300" width="390" height="28" rx="8" fill="#0f172a" stroke="#1e293b"/>
      <circle cx="45" cy="314" r="5" fill="#38bdf8"/>
      <text x="56" y="317" fill="#cbd5e1" font-size="8">Oksygenfattig (venøst) blod</text>
      <circle cx="195" cy="314" r="5" fill="#f43f5e"/>
      <text x="206" y="317" fill="#cbd5e1" font-size="8">Oksygenrikt (arterielt) blod</text>
      <line x1="330" y1="314" x2="345" y2="314" stroke="#facc15" stroke-width="3"/>
      <text x="352" y="317" fill="#cbd5e1" font-size="8">Klaffer (valvae)</text>
    </svg>`;
  }

  // =========================================================================
  // 2. KROPP MED BLODOMØP (Circulatio Sanguinis: Systemisk & Lungekretsløp)
  // Termer: Circulatio pulmonalis, Circulatio systemica, Capillaria, Arteriae/Venae
  // =========================================================================
  if (
    t.match(/blodomløp|sirkulasjon|kretsløp|circulatio|systemkretsløp|lungekretsløp|kroppens blodomløp|blodstrøm|arterier|vener|kapillær/)
  ) {
    return `<svg viewBox="0 0 420 340" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="circ-blue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8"/>
        </marker>
        <marker id="circ-red" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e"/>
        </marker>
      </defs>

      <rect width="420" height="340" rx="16" fill="#070c14" stroke="#1e293b"/>

      <!-- Header -->
      <text x="210" y="20" fill="#38bdf8" font-size="11" font-weight="900" text-anchor="middle" letter-spacing="0.05em">
        KROPPENS BLODOMLØP &bull; CIRCULATIO SANGUINIS
      </text>
      <text x="210" y="33" fill="#94a3b8" font-size="8" text-anchor="middle">
        Det lille (lungekretsløpet) og det store (systemkretsløpet)
      </text>

      <!-- 1. Upper Capillary Network: Caput & Extremitates superiores (Hode og armer) -->
      <rect x="150" y="44" width="120" height="32" rx="10" fill="#1e1b4b" stroke="#6366f1" stroke-width="1.5"/>
      <text x="210" y="58" fill="#e0e7ff" font-size="8" font-weight="bold" text-anchor="middle">KAPILLÆRNETT I HODE / OVERKROPP</text>
      <text x="210" y="68" fill="#a5b4fc" font-size="7" text-anchor="middle">Caput et membra superiora (O2-avgivelse)</text>

      <!-- 2. Pulmonary Capillary Network (Lunger) -->
      <g transform="translate(45, 90)">
        <rect width="95" height="50" rx="12" fill="#042f2e" stroke="#14b8a6" stroke-width="1.5"/>
        <text x="47" y="22" fill="#5eead4" font-size="8" font-weight="bold" text-anchor="middle">PULMO DEXTER</text>
        <text x="47" y="32" fill="#99f6e4" font-size="7" text-anchor="middle">Høyre lunge</text>
        <text x="47" y="43" fill="#2dd4bf" font-size="6.5" text-anchor="middle">O2 tas opp &bull; CO2 skilles ut</text>
      </g>
      <g transform="translate(280, 90)">
        <rect width="95" height="50" rx="12" fill="#042f2e" stroke="#14b8a6" stroke-width="1.5"/>
        <text x="47" y="22" fill="#5eead4" font-size="8" font-weight="bold" text-anchor="middle">PULMO SINISTER</text>
        <text x="47" y="32" fill="#99f6e4" font-size="7" text-anchor="middle">Venstre lunge</text>
        <text x="47" y="43" fill="#2dd4bf" font-size="6.5" text-anchor="middle">O2 tas opp &bull; CO2 skilles ut</text>
      </g>

      <!-- 3. Heart in Center (Cor) -->
      <rect x="160" y="125" width="100" height="80" rx="16" fill="#0f172a" stroke="#cbd5e1" stroke-width="2"/>
      <!-- Internal heart divider -->
      <line x1="210" y1="125" x2="210" y2="205" stroke="#475569" stroke-width="2" stroke-dasharray="3 3"/>
      <!-- Right Atrium & Ventricle (Blue) -->
      <rect x="165" y="130" width="40" height="32" rx="6" fill="#0284c7" fill-opacity="0.3"/>
      <text x="185" y="148" fill="#7dd3fc" font-size="7.5" font-weight="bold" text-anchor="middle">Atrium dx</text>
      <rect x="165" y="167" width="40" height="32" rx="6" fill="#0284c7" fill-opacity="0.5"/>
      <text x="185" y="186" fill="#bae6fd" font-size="7.5" font-weight="bold" text-anchor="middle">Ventr. dx</text>
      <!-- Left Atrium & Ventricle (Red) -->
      <rect x="215" y="130" width="40" height="32" rx="6" fill="#e11d48" fill-opacity="0.3"/>
      <text x="235" y="148" fill="#fda4af" font-size="7.5" font-weight="bold" text-anchor="middle">Atrium sin</text>
      <rect x="215" y="167" width="40" height="32" rx="6" fill="#e11d48" fill-opacity="0.5"/>
      <text x="235" y="186" fill="#fecdd3" font-size="7.5" font-weight="bold" text-anchor="middle">Ventr. sin</text>
      <text x="210" y="218" fill="#f8fafc" font-size="8" font-weight="black" text-anchor="middle">HJERTE (COR)</text>

      <!-- 4. Lower Capillary Network: Truncus & Extremitates inferiores (Bukt, organer og bein) -->
      <rect x="140" y="235" width="140" height="42" rx="10" fill="#1e1b4b" stroke="#6366f1" stroke-width="1.5"/>
      <text x="210" y="251" fill="#e0e7ff" font-size="8" font-weight="bold" text-anchor="middle">SYSTEMISKE KAPILLÆRER</text>
      <text x="210" y="261" fill="#a5b4fc" font-size="7" text-anchor="middle">Indre organer (viscera) &amp; bena (membra inf.)</text>
      <text x="210" y="271" fill="#c7d2fe" font-size="6.5" text-anchor="middle">Oksygen avgis til cellenes metabolisme</text>

      <!-- Circulation Vessels / Paths with Directional Markers -->
      <!-- Aorta: From LV down to lower body and up to upper body -->
      <path d="M 245 199 C 270 215, 270 230, 260 235" fill="none" stroke="#f43f5e" stroke-width="3" marker-end="url(#circ-red)"/>
      <path d="M 235 125 C 245 95, 245 85, 240 76" fill="none" stroke="#f43f5e" stroke-width="3" marker-end="url(#circ-red)"/>
      <text x="280" y="222" fill="#fb7185" font-size="7" font-weight="bold">Aorta descendens</text>

      <!-- Vena Cava: From lower body & upper body back to RA -->
      <path d="M 160 235 C 145 225, 145 170, 165 152" fill="none" stroke="#38bdf8" stroke-width="3" marker-end="url(#circ-blue)"/>
      <path d="M 175 76 C 170 85, 170 115, 175 130" fill="none" stroke="#38bdf8" stroke-width="3" marker-end="url(#circ-blue)"/>
      <text x="85" y="222" fill="#7dd3fc" font-size="7" font-weight="bold">Vena cava inferior</text>

      <!-- Pulmonary Circulation loops -->
      <!-- From RV to Lungs (Deoxygenated blue) -->
      <path d="M 165 180 C 130 170, 110 160, 95 140" fill="none" stroke="#38bdf8" stroke-width="2.5" marker-end="url(#circ-blue)"/>
      <path d="M 175 167 C 220 150, 270 145, 280 135" fill="none" stroke="#38bdf8" stroke-width="2.5" marker-end="url(#circ-blue)"/>
      <!-- From Lungs to LA (Oxygenated red) -->
      <path d="M 95 110 C 115 100, 185 115, 215 135" fill="none" stroke="#f43f5e" stroke-width="2.5" marker-end="url(#circ-red)"/>
      <path d="M 320 140 C 310 155, 270 155, 255 145" fill="none" stroke="#f43f5e" stroke-width="2.5" marker-end="url(#circ-red)"/>

      <!-- Footer Info -->
      <rect x="20" y="295" width="380" height="34" rx="8" fill="#0f172a" stroke="#1e293b"/>
      <text x="210" y="309" fill="#f8fafc" font-size="7.5" font-weight="bold" text-anchor="middle">
        Lungekretsløpet: Høyre ventrikkel &rarr; Lungearterier &rarr; Lunger &rarr; Lungevener &rarr; Venstre atrium
      </text>
      <text x="210" y="321" fill="#94a3b8" font-size="7" text-anchor="middle">
        Systemkretsløpet: Venstre ventrikkel &rarr; Aorta &rarr; Kroppens kapillærer &rarr; Hulvener &rarr; Høyre atrium
      </text>
    </svg>`;
  }

  // =========================================================================
  // 3. MENNESKESKJELETTET & BEIN MED NORSKE OG LATINSKE NAVN (Skeleton Humanum)
  // Termer: Cranium, Clavicula, Scapula, Sternum, Costae, Humerus, Radius, Ulna, Pelvis, Femur, Patella, Tibia, Fibula
  // =========================================================================
  if (
    t.match(/skjelett|knokkel|bein|ben|skeleton|cranium|femur|tibia|fibula|humerus|radius|ulna|patella|clavicula|sternum|costae|pelvis|hoftebein|lårbein|kragebein|skulderblad|hodeskalle|skjelettet/)
  ) {
    return `<svg viewBox="0 0 460 380" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="460" height="380" rx="16" fill="#0b0f19" stroke="#1e293b"/>

      <!-- Title -->
      <text x="230" y="22" fill="#38bdf8" font-size="11" font-weight="900" text-anchor="middle" letter-spacing="0.05em">
        MENNESKETS SKJELETT &bull; SKELETON HUMANUM
      </text>
      <text x="230" y="35" fill="#94a3b8" font-size="8" text-anchor="middle">
        Norske og latinske fagbetegnelser (Terminologia Anatomica)
      </text>

      <!-- Center Skeleton Diagram Vector Drawing -->
      <!-- Skull (Cranium) -->
      <ellipse cx="230" cy="58" rx="14" ry="17" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
      <ellipse cx="230" cy="72" rx="9" ry="6" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1"/>
      <!-- Eyes/Nose markers -->
      <circle cx="225" cy="58" r="2.5" fill="#0f172a"/>
      <circle cx="235" cy="58" r="2.5" fill="#0f172a"/>

      <!-- Cervical Vertebrae -->
      <line x1="230" y1="78" x2="230" y2="88" stroke="#cbd5e1" stroke-width="3"/>

      <!-- Clavicula (Kragebein) -->
      <line x1="205" y1="88" x2="255" y2="88" stroke="#f8fafc" stroke-width="3" stroke-linecap="round"/>

      <!-- Sternum (Brystbein) & Costae (Ribbein) -->
      <rect x="228" y="90" width="4" height="42" rx="2" fill="#f8fafc"/>
      <!-- Ribs curves -->
      <ellipse cx="230" cy="98" rx="20" ry="7" fill="none" stroke="#e2e8f0" stroke-width="1.5"/>
      <ellipse cx="230" cy="108" rx="23" ry="8" fill="none" stroke="#e2e8f0" stroke-width="1.5"/>
      <ellipse cx="230" cy="118" rx="25" ry="9" fill="none" stroke="#e2e8f0" stroke-width="1.5"/>
      <ellipse cx="230" cy="128" rx="22" ry="8" fill="none" stroke="#e2e8f0" stroke-width="1.5"/>

      <!-- Columna vertebralis (Ryggsøyle midtlinje) -->
      <line x1="230" y1="132" x2="230" y2="165" stroke="#f8fafc" stroke-width="4" stroke-dasharray="3 1.5"/>

      <!-- Pelvis / Bekken (Os coxae & Os sacrum) -->
      <path d="M 210 165 C 195 168, 200 190, 220 190 C 230 190, 230 180, 230 175 C 230 180, 230 190, 240 190 C 260 190, 265 168, 250 165 Z" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="1.5"/>

      <!-- Upper Limbs (Armer) -->
      <!-- Humerus (Overarm) -->
      <line x1="205" y1="92" x2="185" y2="135" stroke="#f8fafc" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="255" y1="92" x2="275" y2="135" stroke="#f8fafc" stroke-width="3.5" stroke-linecap="round"/>
      <!-- Radius & Ulna (Underarm) -->
      <line x1="184" y1="137" x2="175" y2="185" stroke="#f8fafc" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="187" y1="137" x2="179" y2="185" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round"/>
      <line x1="274" y1="137" x2="282" y2="185" stroke="#f8fafc" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="276" y1="137" x2="285" y2="185" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round"/>
      <!-- Manus (Hånd) -->
      <ellipse cx="173" cy="192" rx="4" ry="7" fill="#f8fafc"/>
      <ellipse cx="287" cy="192" rx="4" ry="7" fill="#f8fafc"/>

      <!-- Lower Limbs (Bein) -->
      <!-- Femur (Lårbein) -->
      <line x1="218" y1="190" x2="212" y2="255" stroke="#f8fafc" stroke-width="4.5" stroke-linecap="round"/>
      <line x1="242" y1="190" x2="248" y2="255" stroke="#f8fafc" stroke-width="4.5" stroke-linecap="round"/>
      <!-- Patella (Kneskål) -->
      <circle cx="212" cy="258" r="4" fill="#38bdf8"/>
      <circle cx="248" cy="258" r="4" fill="#38bdf8"/>
      <!-- Tibia & Fibula (Leggbein) -->
      <line x1="212" y1="262" x2="210" y2="330" stroke="#f8fafc" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="207" y1="265" x2="205" y2="328" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round"/>
      <line x1="248" y1="262" x2="250" y2="330" stroke="#f8fafc" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="253" y1="265" x2="255" y2="328" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round"/>
      <!-- Pes (Fot) -->
      <ellipse cx="205" cy="336" rx="9" ry="4" fill="#f8fafc"/>
      <ellipse cx="255" cy="336" rx="9" ry="4" fill="#f8fafc"/>

      <!-- LATIN & NORWEGIAN CALLOUTS - LEFT SIDE -->
      <!-- 1. Cranium (Kranium) -->
      <text x="145" y="55" fill="#38bdf8" font-size="8" font-weight="bold" text-anchor="end">Cranium</text>
      <text x="145" y="65" fill="#94a3b8" font-size="7" text-anchor="end">(Hodeskalle)</text>
      <line x1="150" y1="58" x2="214" y2="58" stroke="#38bdf8" stroke-width="1" stroke-dasharray="2 2"/>

      <!-- 2. Clavicula (Kragebein) -->
      <text x="145" y="85" fill="#38bdf8" font-size="8" font-weight="bold" text-anchor="end">Clavicula</text>
      <text x="145" y="94" fill="#94a3b8" font-size="7" text-anchor="end">(Kragebein)</text>
      <line x1="150" y1="88" x2="208" y2="88" stroke="#38bdf8" stroke-width="1" stroke-dasharray="2 2"/>

      <!-- 3. Humerus (Overarmsbein) -->
      <text x="135" y="125" fill="#38bdf8" font-size="8" font-weight="bold" text-anchor="end">Humerus</text>
      <text x="135" y="134" fill="#94a3b8" font-size="7" text-anchor="end">(Overarmsbein)</text>
      <line x1="140" y1="128" x2="190" y2="120" stroke="#38bdf8" stroke-width="1" stroke-dasharray="2 2"/>

      <!-- 4. Radius & Ulna (Underarmsbein) -->
      <text x="125" y="165" fill="#38bdf8" font-size="8" font-weight="bold" text-anchor="end">Radius &amp; Ulna</text>
      <text x="125" y="174" fill="#94a3b8" font-size="7" text-anchor="end">(Spolebein &amp; albebein)</text>
      <line x1="130" y1="168" x2="178" y2="165" stroke="#38bdf8" stroke-width="1" stroke-dasharray="2 2"/>

      <!-- 5. Ossa carpi / manus (Håndrotsbein) -->
      <text x="125" y="196" fill="#38bdf8" font-size="8" font-weight="bold" text-anchor="end">Ossa manus</text>
      <text x="125" y="205" fill="#94a3b8" font-size="7" text-anchor="end">(Karpal- &amp; fingerknokler)</text>
      <line x1="130" y1="196" x2="168" y2="194" stroke="#38bdf8" stroke-width="1" stroke-dasharray="2 2"/>

      <!-- 6. Femur (Lårbein) -->
      <text x="145" y="235" fill="#38bdf8" font-size="8" font-weight="bold" text-anchor="end">Femur</text>
      <text x="145" y="244" fill="#94a3b8" font-size="7" text-anchor="end">(Lårbein - kroppens lengste)</text>
      <line x1="150" y1="238" x2="215" y2="235" stroke="#38bdf8" stroke-width="1" stroke-dasharray="2 2"/>

      <!-- 7. Tibia & Fibula (Leggbein) -->
      <text x="145" y="295" fill="#38bdf8" font-size="8" font-weight="bold" text-anchor="end">Tibia &amp; Fibula</text>
      <text x="145" y="304" fill="#94a3b8" font-size="7" text-anchor="end">(Skinnebein &amp; leggbein)</text>
      <line x1="150" y1="298" x2="208" y2="295" stroke="#38bdf8" stroke-width="1" stroke-dasharray="2 2"/>

      <!-- LATIN & NORWEGIAN CALLOUTS - RIGHT SIDE -->
      <!-- 8. Columna vertebralis -->
      <text x="315" y="70" fill="#34d399" font-size="8" font-weight="bold">Columna vertebralis</text>
      <text x="315" y="79" fill="#94a3b8" font-size="7">(Ryggsøylen - virvler)</text>
      <line x1="310" y1="74" x2="236" y2="82" stroke="#34d399" stroke-width="1" stroke-dasharray="2 2"/>

      <!-- 9. Sternum (Brystbein) -->
      <text x="315" y="105" fill="#34d399" font-size="8" font-weight="bold">Sternum</text>
      <text x="315" y="114" fill="#94a3b8" font-size="7">(Brystbein)</text>
      <line x1="310" y1="108" x2="234" y2="108" stroke="#34d399" stroke-width="1" stroke-dasharray="2 2"/>

      <!-- 10. Costae (Ribbein) -->
      <text x="315" y="132" fill="#34d399" font-size="8" font-weight="bold">Costae (1-12)</text>
      <text x="315" y="141" fill="#94a3b8" font-size="7">(Ribbein / brystkasse)</text>
      <line x1="310" y1="135" x2="254" y2="128" stroke="#34d399" stroke-width="1" stroke-dasharray="2 2"/>

      <!-- 11. Pelvis / Os coxae (Bekken) -->
      <text x="315" y="175" fill="#34d399" font-size="8" font-weight="bold">Pelvis / Os coxae</text>
      <text x="315" y="184" fill="#94a3b8" font-size="7">(Bekken / hoftebein)</text>
      <line x1="310" y1="178" x2="252" y2="178" stroke="#34d399" stroke-width="1" stroke-dasharray="2 2"/>

      <!-- 12. Patella (Kneskål) -->
      <text x="315" y="255" fill="#34d399" font-size="8" font-weight="bold">Patella</text>
      <text x="315" y="264" fill="#94a3b8" font-size="7">(Kneskål)</text>
      <line x1="310" y1="258" x2="254" y2="258" stroke="#34d399" stroke-width="1" stroke-dasharray="2 2"/>

      <!-- 13. Ossa pedis / Tarsus (Fotrotsbein) -->
      <text x="315" y="332" fill="#34d399" font-size="8" font-weight="bold">Ossa pedis / Tarsus</text>
      <text x="315" y="341" fill="#94a3b8" font-size="7">(Fotrot, mellomfot, tær)</text>
      <line x1="310" y1="336" x2="265" y2="336" stroke="#34d399" stroke-width="1" stroke-dasharray="2 2"/>

      <!-- Bottom Reference Bar -->
      <rect x="25" y="354" width="410" height="20" rx="6" fill="#0f172a" stroke="#1e293b"/>
      <text x="230" y="367" fill="#64748b" font-size="7.5" text-anchor="middle">
        Anatomisk normalstilling: Supinert håndflate &bull; 206 knokler i det voksne menneskets skjelett
      </text>
    </svg>`;
  }

  // =========================================================================
  // 4. RESPIRASJON / LUNGER (Apparatus Respiratorius)
  // Termer: Trachea, Bronchus, Pulmo, Alveoli
  // =========================================================================
  if (t.match(/lunge|pulmo|respirasjon|alveol|trachea|bronk|luftvei|gassutveksling/)) {
    return `<svg viewBox="0 0 400 300" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" rx="16" fill="#06131c" stroke="#1e293b"/>
      <text x="200" y="22" fill="#38bdf8" font-size="11" font-weight="900" text-anchor="middle">
        RESPIRASJONSSYSTEMET &bull; APPARATUS RESPIRATORIUS
      </text>
      <text x="200" y="35" fill="#94a3b8" font-size="8" text-anchor="middle">Lunger, luftveier og gassutveksling</text>

      <!-- Trachea (Lufterør) -->
      <rect x="194" y="45" width="12" height="50" rx="3" fill="#cbd5e1" stroke="#38bdf8" stroke-width="1.5"/>
      <line x1="194" y1="55" x2="206" y2="55" stroke="#0284c7" stroke-width="1.5"/>
      <line x1="194" y1="65" x2="206" y2="65" stroke="#0284c7" stroke-width="1.5"/>
      <line x1="194" y1="75" x2="206" y2="75" stroke="#0284c7" stroke-width="1.5"/>
      <line x1="194" y1="85" x2="206" y2="85" stroke="#0284c7" stroke-width="1.5"/>
      <text x="215" y="60" fill="#38bdf8" font-size="8" font-weight="bold">Trachea (Lufterør)</text>

      <!-- Bronchial Tree -->
      <path d="M 200 95 L 160 130 M 160 130 L 135 160 M 160 130 L 165 170" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
      <path d="M 200 95 L 240 130 M 240 130 L 265 160 M 240 130 L 235 170" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
      <text x="130" y="115" fill="#7dd3fc" font-size="7.5" font-weight="bold">Bronchus dx.</text>
      <text x="270" y="115" fill="#7dd3fc" font-size="7.5" font-weight="bold">Bronchus sin.</text>

      <!-- Lungs Outlines -->
      <!-- Pulmo dexter (3 lapper) -->
      <path d="M 175 105 C 130 110, 100 160, 105 230 C 130 245, 175 240, 185 220 Z" fill="#0284c7" fill-opacity="0.25" stroke="#38bdf8" stroke-width="2"/>
      <text x="145" y="200" fill="#bae6fd" font-size="9" font-weight="bold" text-anchor="middle">Pulmo dexter</text>
      <text x="145" y="212" fill="#7dd3fc" font-size="7.5" text-anchor="middle">(3 lapper / lobi)</text>

      <!-- Pulmo sinister (2 lapper / plass til cor) -->
      <path d="M 225 105 C 270 110, 300 160, 295 230 C 270 245, 235 240, 220 200 Z" fill="#0284c7" fill-opacity="0.25" stroke="#38bdf8" stroke-width="2"/>
      <text x="260" y="200" fill="#bae6fd" font-size="9" font-weight="bold" text-anchor="middle">Pulmo sinister</text>
      <text x="260" y="212" fill="#7dd3fc" font-size="7.5" text-anchor="middle">(2 lapper &amp; impressio cardiaca)</text>

      <!-- Alveoli Callout (Lungeblære med kapillærer) -->
      <circle cx="340" cy="80" r="28" fill="#0f172a" stroke="#22c55e" stroke-width="1.5"/>
      <circle cx="335" cy="75" r="7" fill="#86efac" fill-opacity="0.6"/>
      <circle cx="345" cy="85" r="7" fill="#86efac" fill-opacity="0.6"/>
      <circle cx="347" cy="73" r="6" fill="#86efac" fill-opacity="0.6"/>
      <text x="340" y="118" fill="#4ade80" font-size="7.5" font-weight="bold" text-anchor="middle">Alveoli (Lungeblærer)</text>
      <text x="340" y="128" fill="#86efac" font-size="6.5" text-anchor="middle">Diffusjon: O2 &bull; CO2</text>

      <!-- Diaphragma (Mellomgulv) -->
      <path d="M 90 260 Q 200 230 310 260" fill="none" stroke="#f59e0b" stroke-width="3" stroke-linecap="round"/>
      <text x="200" y="275" fill="#fde68a" font-size="8" font-weight="bold" text-anchor="middle">Diaphragma (Hovedåndedrettsmuskel)</text>
    </svg>`;
  }

  // =========================================================================
  // 5. ABCDE Systematic Assessment
  // =========================================================================
  if (t.includes('abcde') || t.includes('primærundersøkelse') || t.includes('triage')) {
    return `<svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="14" fill="#042f2e" stroke="#0d9488"/>
      <circle cx="50" cy="50" r="36" fill="none" stroke="#2dd4bf" stroke-width="2" stroke-dasharray="4 2"/>
      <text x="50" y="32" fill="#5eead4" font-size="10" font-weight="black" text-anchor="middle">A &bull; B</text>
      <text x="50" y="55" fill="#ffffff" font-size="14" font-weight="black" text-anchor="middle">ABCDE</text>
      <text x="50" y="74" fill="#5eead4" font-size="10" font-weight="black" text-anchor="middle">C &bull; D &bull; E</text>
    </svg>`;
  }

  // =========================================================================
  // 6. STEMI / EKG
  // =========================================================================
  if (t.includes('stemi') || t.includes('ekg') || t.includes('st-elevasjon') || t.includes('koronarsyndrom')) {
    return `<svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="14" fill="#18181b" stroke="#3f3f46"/>
      <polyline points="10,55 25,55 30,50 35,55 40,55 44,70 48,22 52,58 56,58 64,36 78,36 84,55 95,55" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <line x1="56" y1="36" x2="80" y2="36" stroke="#facc15" stroke-width="1.5" stroke-dasharray="2 2"/>
      <text x="68" y="28" fill="#facc15" font-size="8" font-weight="bold" text-anchor="middle">ST-elevasjon</text>
    </svg>`;
  }

  // =========================================================================
  // 7. Legemiddelregning: Volum = Dose / Styrke
  // =========================================================================
  if (t.includes('regning') || t.includes('dose') || t.includes('styrke') || t.includes('volum') || t.includes('infusjon')) {
    return `<svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="14" fill="#08182b" stroke="#0284c7"/>
      <text x="50" y="34" fill="#38bdf8" font-size="12" font-weight="bold" text-anchor="middle">V = D / S</text>
      <line x1="25" y1="44" x2="75" y2="44" stroke="#0284c7" stroke-width="1.5"/>
      <text x="50" y="60" fill="#ffffff" font-size="10" font-weight="medium" text-anchor="middle">Dose / Styrke</text>
      <rect x="24" y="68" width="52" height="20" rx="6" fill="#0369a1"/>
      <text x="50" y="82" fill="#ffffff" font-size="10" font-weight="bold" text-anchor="middle">= Volum (ml)</text>
    </svg>`;
  }

  // =========================================================================
  // 8. GCS Neurological Scale
  // =========================================================================
  if (t.includes('gcs') || t.includes('glasgow') || t.includes('koma') || t.includes('intubasjon') || t.includes('bevissthet')) {
    return `<svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="14" fill="#0f172a" stroke="#1e293b"/>
      <text x="50" y="24" fill="#38bdf8" font-size="9" font-weight="bold" text-anchor="middle">GCS SKÅRING (3-15)</text>
      <rect x="15" y="32" width="70" height="14" rx="4" fill="#1e293b"/>
      <text x="20" y="42" fill="#94a3b8" font-size="7">Øye (E): 1-4</text>
      <rect x="15" y="49" width="70" height="14" rx="4" fill="#1e293b"/>
      <text x="20" y="59" fill="#94a3b8" font-size="7">Verbal (V): 1-5</text>
      <rect x="15" y="66" width="70" height="14" rx="4" fill="#1e293b"/>
      <text x="20" y="76" fill="#94a3b8" font-size="7">Motorikk (M): 1-6</text>
      <text x="50" y="93" fill="#f43f5e" font-size="7.5" font-weight="bold" text-anchor="middle">GCS ≤ 8 = INTUBASJON</text>
    </svg>`;
  }

  // =========================================================================
  // 9. Nervesystem / Nevron / Hjerne
  // =========================================================================
  if (t.match(/nerve|hjerne|nevro|synapse|dopamin|refleks|signal|sans|minne|cerebrum|enceph/)) {
    return `<svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="16" fill="#0f172a" stroke="#1e293b"/>
      <circle cx="50" cy="45" r="16" fill="#6366f1" fill-opacity="0.25" stroke="#818cf8" stroke-width="2"/>
      <circle cx="50" cy="45" r="7" fill="#818cf8"/>
      <path d="M50 29 L50 14 M36 37 L20 28 M64 37 L80 28 M38 56 L24 68 M62 56 L76 68 M50 61 L50 86" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>
      <circle cx="50" cy="14" r="3" fill="#38bdf8"/>
      <circle cx="20" cy="28" r="3" fill="#38bdf8"/>
      <circle cx="80" cy="28" r="3" fill="#38bdf8"/>
      <circle cx="24" cy="68" r="3" fill="#34d399"/>
      <circle cx="76" cy="68" r="3" fill="#34d399"/>
      <circle cx="50" cy="86" r="3" fill="#a855f7"/>
      <text x="50" y="96" fill="#a5b4fc" font-size="6" font-weight="bold" text-anchor="middle">NEVRON &bull; SYNAPSE</text>
    </svg>`;
  }

  // =========================================================================
  // 10. Generell prosedyre / Algoritme
  // =========================================================================
  if (t.match(/prosedyre|trinn|flyt|algoritme|beslutning|veileder/)) {
    return `<svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" rx="16" fill="#111827" stroke="#374151"/>
      <rect x="36" y="14" width="28" height="16" rx="4" fill="#3b82f6" stroke="#60a5fa" stroke-width="1"/>
      <line x1="50" y1="30" x2="50" y2="44" stroke="#9ca3af" stroke-width="1.5"/>
      <line x1="28" y1="44" x2="72" y2="44" stroke="#9ca3af" stroke-width="1.5"/>
      <line x1="28" y1="44" x2="28" y2="56" stroke="#9ca3af" stroke-width="1.5"/>
      <line x1="72" y1="44" x2="72" y2="56" stroke="#9ca3af" stroke-width="1.5"/>
      <rect x="14" y="56" width="28" height="16" rx="4" fill="#10b981" stroke="#34d399" stroke-width="1"/>
      <rect x="58" y="56" width="28" height="16" rx="4" fill="#f59e0b" stroke="#fbbf24" stroke-width="1"/>
      <text x="50" y="25" fill="#ffffff" font-size="7" font-weight="bold" text-anchor="middle">TRINN 1</text>
      <text x="28" y="67" fill="#ffffff" font-size="6" font-weight="bold" text-anchor="middle">JA</text>
      <text x="72" y="67" fill="#ffffff" font-size="6" font-weight="bold" text-anchor="middle">NEI</text>
    </svg>`;
  }

  // Default Vitenskapelig / Faglig Illustrasjon
  return `<svg viewBox="0 0 100 100" class="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" rx="16" fill="#0f172a" stroke="#1e293b"/>
    <circle cx="50" cy="50" r="30" fill="none" stroke="#6366f1" stroke-width="2" stroke-dasharray="4 2"/>
    <circle cx="50" cy="50" r="12" fill="#4f46e5" stroke="#818cf8" stroke-width="1.5"/>
    <circle cx="50" cy="20" r="4" fill="#38bdf8"/>
    <circle cx="80" cy="50" r="4" fill="#34d399"/>
    <circle cx="50" cy="80" r="4" fill="#fbbf24"/>
    <circle cx="20" cy="50" r="4" fill="#f43f5e"/>
    <text x="50" y="54" fill="#ffffff" font-size="7" font-weight="bold" text-anchor="middle">FAGKILDE</text>
  </svg>`;
}
