function Pine({ x, y, scale = 1, light = false }: { x: number; y: number; scale?: number; light?: boolean }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse cx="4" cy="4" rx="25" ry="8" fill="#284a59" opacity=".35"/>
    <path d="M-3 2v-19h7V2z" fill="#996770"/>
    <path d="m-25-11 12-17h-5l12-16h-3L1-59l13 17h-4l13 17h-5l10 14c-15 10-35 11-53 0Z" fill={light ? '#629d8a' : '#427a76'}/>
    <path d="m1-59 13 17h-4l13 17h-5l10 14c-8 6-17 7-26 7 7-10 6-29-1-55Z" fill={light ? '#4e897f' : '#376868'}/>
    <path d="m-8-29 4-3m-12 15 6-4m8 4 5-4" stroke={light ? '#91b997' : '#70a291'} strokeWidth="2" strokeLinecap="round"/>
  </g>
}

function Shrub({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse cx="0" cy="3" rx="22" ry="6" fill="#405e64" opacity=".5"/>
    <path d="M-20 0c-6-8 3-17 11-13 2-11 14-11 17-2 8-4 17 4 13 12C12 5-6 6-20 0Z" fill="#50897c"/>
    <path d="M-19-2c-3-6 3-10 8-8 1-8 12-10 15-3 4-2 9 0 12 5-9 5-24 8-35 6Z" fill="#80ab88"/>
    <circle cx="-11" cy="-5" r="2" fill="#ffd594"/><circle cx="1" cy="-11" r="2.3" fill="#ec9d9b"/><circle cx="10" cy="-7" r="1.7" fill="#ffd594"/>
  </g>
}

function Lamp({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <circle cy="-31" r="20" fill="#ffe49b" opacity=".14"/>
    <path d="M-7 0H7M0-1v-23" stroke="#40415d" strokeWidth="4" strokeLinecap="round"/>
    <rect x="-6" y="-36" width="12" height="13" rx="3" fill="#ffe3a1" stroke="#b58767" strokeWidth="2"/>
    <path d="m-8-36 8-6 8 6" fill="#4e4761"/>
    <path d="M-3-32v5" stroke="#fff8d5" strokeWidth="2" strokeLinecap="round"/>
  </g>
}

const grass = [[173,203],[210,265],[265,199],[290,272],[370,177],[393,288],[305,344],[576,320],[638,217],[677,249],[721,255],[752,296],[648,354],[520,402],[455,420],[203,324],[690,317],[585,192],[542,169],[112,282],[755,210],[325,237],[484,251]]
const stars = [[44,113,1.7],[100,65,1.5],[203,54,2],[262,92,1.4],[312,42,1.7],[369,74,2.1],[443,41,1.3],[492,111,1.8],[548,56,1.2],[634,57,1.4],[694,105,1.7],[748,52,1.7],[823,80,1.5],[883,145,1.7],[811,194,1.4],[170,133,1.3],[67,204,1.5],[848,301,1.4],[39,348,1.4],[100,425,1.8],[828,405,1.5],[755,456,1.7],[197,454,1.3],[595,91,1.3]]

export function TownScenery() {
  return <svg className="town-scenery" aria-hidden="true" viewBox="0 0 900 520" preserveAspectRatio="none">
    <defs>
      <radialGradient id="moon-glow"><stop stopColor="#ffe5aa" stopOpacity=".2"/><stop offset="1" stopColor="#ffe5aa" stopOpacity="0"/></radialGradient>
      <linearGradient id="town-earth" x2="0" y2="1"><stop stopColor="#777299"/><stop offset="1" stopColor="#4b496f"/></linearGradient>
      <linearGradient id="town-grass" x2=".8" y2="1"><stop stopColor="#76a98d"/><stop offset="1" stopColor="#5a8d80"/></linearGradient>
      <linearGradient id="town-pond" x2="1" y2="1"><stop stopColor="#6bc6bf"/><stop offset="1" stopColor="#529fae"/></linearGradient>
      <pattern id="world-dots" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M2 3h1m15 11h1m-9 6h1" stroke="#deecbd" strokeWidth="2" opacity=".22" strokeLinecap="round"/></pattern>
    </defs>
    <circle cx="118" cy="106" r="94" fill="url(#moon-glow)"/>
    <path d="M128 71a35 35 0 1 0 27 54c-19 5-36-7-41-23-3-12 3-24 14-31Z" fill="#ffe2a1"/>
    <path d="M105 91c-9 14-7 28 3 37" fill="none" stroke="#fff0be" strokeWidth="3" strokeLinecap="round"/>
    {stars.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill={i % 4 === 0 ? '#ffd694' : '#b6b3ed'} opacity={i % 3 === 0 ? '.75' : '.4'}/>)}
    <path d="M235 85q1 9 10 10-9 1-10 10-1-9-10-10 9-1 10-10Zm533 28q1 7 8 8-7 1-8 8-1-7-8-8 7-1 8-8ZM47 262q1 7 8 8-7 1-8 8-1-7-8-8 7-1 8-8Z" fill="#ffe1a2" opacity=".8"/>
    <path d="M16 191q24-13 47-6 20-13 46-4m615-23q21-12 45-6 24-14 53-5l22 2M60 376q20-6 40-1m676 33q23-8 44 2" fill="none" stroke="#9486bc" strokeWidth="2.5" strokeLinecap="round" opacity=".26"/>
    <ellipse cx="453" cy="393" rx="352" ry="85" fill="#131429" opacity=".46"/>
    <path d="M96 267c9-28 68-61 133-81l188-66c26-9 51-13 82-6l220 56c51 13 94 37 99 62l5 49c4 31-25 49-70 70L535 455c-48 23-104 25-145 12L147 385c-39-12-61-29-61-52Z" fill="url(#town-earth)" stroke="#2a2b4b" strokeWidth="4"/>
    <path d="M90 309c3 22 29 43 66 55l242 84c42 14 88 9 134-12l214-101c44-22 70-39 73-64" fill="none" stroke="#a39ac1" strokeWidth="3.5" opacity=".46"/>
    <path d="M139 367l23 8m36 15 11 3m65 22 30 10m60 20 12 4m85 9 30-5m72-28 29-13m23-10 16-8m52-24 24-12m72-40 14-12" stroke="#b4a9c9" strokeWidth="4" strokeLinecap="round" opacity=".36"/>
    <path d="M90 270c5-27 59-62 132-86l196-67c27-9 55-13 80-6l218 56c54 13 98 37 102 65 5 29-20 52-73 77L533 413c-51 23-96 27-137 13L151 345c-43-14-72-41-61-75Z" fill="#83a98e" stroke="#547d77" strokeWidth="4"/>
    <path d="M96 264c10-27 59-56 129-80l197-67c26-8 54-10 78-4l213 55c48 13 90 34 96 59 5 23-20 46-70 69L527 399c-46 23-89 25-129 12l-239-78c-42-13-73-39-63-69Z" fill="url(#town-grass)"/>
    <path d="M96 264c10-27 59-56 129-80l197-67c26-8 54-10 78-4l213 55c48 13 90 34 96 59 5 23-20 46-70 69L527 399c-46 23-89 25-129 12l-239-78c-42-13-73-39-63-69Z" fill="url(#world-dots)"/>
    <path d="M144 290C257 252 320 239 418 230c80-8 202 14 335 39M412 230c30 42 27 93 24 169m7-133c45 2 79 18 113 60" stroke="#557a73" strokeWidth="29" fill="none" strokeLinecap="round" opacity=".5"/>
    <path d="M144 286C257 248 320 235 418 226c80-8 202 14 335 39M412 226c30 42 27 93 24 169m7-133c45 2 79 18 113 60" stroke="#d4bb9a" strokeWidth="23" fill="none" strokeLinecap="round"/>
    <path d="M144 286C257 248 320 235 418 226c80-8 202 14 335 39M412 226c30 42 27 93 24 169m7-133c45 2 79 18 113 60" stroke="#f4d3aa" strokeWidth="2" strokeDasharray="3 8" fill="none" strokeLinecap="round" opacity=".65"/>
    <path d="M504 141c19-14 70-11 97 2 18 9 22 21 2 31-24 12-37 2-57 11-26 12-64-1-65-16-1-10 10-19 23-28Z" fill="#3e727b" />
    <path d="M505 146c21-14 71-12 94 0 16 8 21 16 2 24-23 11-37 2-56 10-24 10-57 0-58-11-1-9 8-16 18-23Z" fill="url(#town-pond)" />
    <path d="M512 153h13m11 14h18m17-17h16m-68 23h8" stroke="#b3e9cb" strokeWidth="2" strokeLinecap="round" opacity=".82"/>
    <path d="m583 163 6-2 7 3-8 2Z" fill="#a3c688"/><path d="m588 162 1-4 3 4" fill="#f6a9ac"/>
    {grass.map(([x, y], i) => <path key={i} d={`M${x-5} ${y+2}l4-4 2 4 4-6 2 2`} fill="none" stroke={i % 3 ? '#a1ba95' : '#efd391'} strokeWidth="1.7" opacity=".65" strokeLinecap="round"/>)}
    <Pine x={473} y={136} scale={.79} light/><Pine x={450} y={132} scale={.62}/>
    <Pine x={247} y={183} scale={.77} light/><Pine x={270} y={176} scale={.59}/>
    <Pine x={693} y={191} scale={.86} light/><Pine x={722} y={201} scale={.98}/><Pine x={750} y={212} scale={.74} light/>
    <Pine x={164} y={239} scale={1.07}/><Pine x={132} y={251} scale={.75} light/>
    <Pine x={562} y={373} scale={1.07}/><Pine x={597} y={361} scale={.74} light/>
    <Pine x={354} y={377} scale={.82} light/><Pine x={378} y={389} scale={.95}/>
    <Shrub x={281} y={326} scale={1.1}/><Shrub x={226} y={308}/><Shrub x={312} y={197} scale={.78}/>
    <Shrub x={781} y={261}/><Shrub x={743} y={287}/><Shrub x={625} y={203}/><Shrub x={469} y={387} scale={.83}/><Shrub x={641} y={335} scale={1.07}/>
    <Lamp x={216} y={264}/><Lamp x={504} y={246} scale={.91}/><Lamp x={469} y={303} scale={.88}/><Lamp x={686} y={281} scale={.94}/><Lamp x={452} y={387} scale={.75}/>
    <path d="m303 288 22 7m-28-4 22 7m-20-2-4 6m23 0-3 7" stroke="#8d656a" strokeWidth="3.6" strokeLinecap="round"/>
    <path d="m654 279-19 8m22-6-19 9m2 1 2 6m14-10 4 6" stroke="#835f68" strokeWidth="3.6" strokeLinecap="round"/>
  </svg>
}
