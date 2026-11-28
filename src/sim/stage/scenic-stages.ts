/* Les stages « décor » : des plateformes qui représentent quelque chose (toits, remparts, carlingue,
   ponton, masses de terre, branches), des décors autour, et parfois de l'eau ou de la lave. */
import { block, ground, thin } from './builders';
import type { PlatformDef, StageDef } from './types';

const as = (p: PlatformDef, look: PlatformDef['look']): PlatformDef => ({ ...p, look });

const VILLAGE: StageDef = {
  id: 'village',
  name: 'Village Perché',
  subtitle: 'Toits et rue sans bord',
  backdrop: 'jbg',
  platforms: [
    as(block(-1700, 0, 3400, 160), 'rock'),
    as(block(-640, -230, 300, 230, true), 'house'),
    as(block(330, -300, 300, 300, true), 'house'),
    as(thin(-230, -150, 200), 'awning'),
    as(thin(60, -250, 170), 'awning'),
  ],
  scenery: [
    { kind: 'chimney', x: 560, y: -370, w: 36, h: 70 },
    { kind: 'lamp', x: -60, y: -190, w: 24, h: 190 },
    { kind: 'fence', x: 700, y: -40, w: 220, h: 40 },
    { kind: 'flag', x: -360, y: -330, w: 60, h: 100 },
  ],
  blast: { left: -1400, right: 1400, top: -1300, bottom: 700 },
  camera: { left: -1150, right: 1150, top: -820, bottom: 400 },
  spawns: [
    { x: -490, y: -230 },
    { x: 480, y: -300 },
    { x: -120, y: 0 },
    { x: 160, y: 0 },
  ],
  respawn: { x: 0, y: -520 },
  theme: {
    material: 'pierre',
    top: '#c8402a',
    side: '#efe0c4',
    shade: '#3a2418',
    glow: '#ffd23f',
    tint: 'rgba(10,10,30,0.12)',
  },
};

const ARCHIPEL: StageDef = {
  id: 'archipel',
  name: 'Archipel',
  subtitle: 'Masses de terre flottantes',
  backdrop: 'roulian',
  platforms: [
    as(ground(-540, 540, 160, 0), 'earth'),
    as(ground(130, 380, 130, -90), 'earth'),
    as(ground(-230, 240, 100, -320), 'earth'),
    as(thin(-30, -60, 170), 'plank'),
  ],
  scenery: [
    { kind: 'ruins', x: -480, y: -150, w: 200, h: 150 },
    { kind: 'tree', x: 230, y: -360, w: 220, h: 270 },
    { kind: 'vines', x: -420, y: 150, w: 240, h: 110 },
  ],
  blast: { left: -1300, right: 1300, top: -1150, bottom: 700 },
  camera: { left: -1050, right: 1050, top: -820, bottom: 420 },
  spawns: [
    { x: -420, y: 0 },
    { x: 330, y: -90 },
    { x: -110, y: -320 },
    { x: -200, y: 0 },
  ],
  respawn: { x: 0, y: -560 },
  ambience: 'sparkles',
  theme: {
    material: 'herbe',
    top: '#6cc04a',
    side: '#8a5a32',
    shade: '#2e1a0e',
    glow: '#ffe08a',
    tint: 'rgba(0,10,30,0.1)',
  },
};

const FORTERESSE: StageDef = {
  id: 'forteresse',
  name: 'Forteresse du Lac',
  subtitle: 'Remparts, tours et douves',
  backdrop: 'roulie',
  platforms: [
    as(block(-480, 0, 960, 220, true), 'castle'),
    as(block(-480, -220, 140, 220, true), 'castle'),
    as(block(340, -220, 140, 220, true), 'castle'),
    as(thin(-210, -160, 170), 'plank'),
    as(thin(40, -160, 170), 'plank'),
    as(thin(-90, -320, 180), 'plank'),
  ],
  scenery: [
    { kind: 'tower', x: -500, y: -400, w: 180, h: 190 },
    { kind: 'tower', x: 320, y: -400, w: 180, h: 190 },
    { kind: 'flag', x: -20, y: -460, w: 60, h: 120 },
  ],
  liquid: { kind: 'water', y: 150 },
  blast: { left: -1250, right: 1250, top: -1150, bottom: 560 },
  camera: { left: -1000, right: 1000, top: -820, bottom: 380 },
  spawns: [
    { x: -410, y: -220 },
    { x: 410, y: -220 },
    { x: -150, y: 0 },
    { x: 150, y: 0 },
  ],
  respawn: { x: 0, y: -560 },
  theme: {
    material: 'pierre',
    top: '#b8402e',
    side: '#b8b0a0',
    shade: '#2a2430',
    glow: '#ffd36b',
    tint: 'rgba(10,10,40,0.15)',
  },
};

const CARGO: StageDef = {
  id: 'cargo',
  name: 'Cargo Volant',
  subtitle: 'Sur la carlingue, en plein vol',
  backdrop: 'jbm',
  platforms: [
    as({ ...block(-520, 0, 1040, 120, true), move: { dx: 0, dy: 16, period: 300 } }, 'hull'),
    as({ ...block(390, -170, 80, 170, true), move: { dx: 0, dy: 16, period: 300 } }, 'metal'),
    as({ ...thin(-170, -150, 320), move: { dx: 0, dy: 16, period: 300 } }, 'girder'),
  ],
  scenery: [
    { kind: 'engine', x: -330, y: 120, w: 170, h: 54 },
    { kind: 'engine', x: 140, y: 120, w: 170, h: 54 },
  ],
  ambience: 'speed',
  blast: { left: -1150, right: 1150, top: -1000, bottom: 640 },
  camera: { left: -950, right: 950, top: -700, bottom: 380 },
  spawns: [
    { x: -350, y: 0 },
    { x: 250, y: 0 },
    { x: -80, y: -150 },
    { x: 100, y: -150 },
  ],
  respawn: { x: 0, y: -420 },
  theme: {
    material: 'metal',
    top: '#e8ecf2',
    side: '#b8c0cc',
    shade: '#2a3040',
    glow: '#e8402a',
    tint: 'rgba(10,20,50,0.25)',
  },
};

const LAGUNE: StageDef = {
  id: 'lagune',
  name: 'Lagune',
  subtitle: 'Ponton sur pilotis, radeau, îlot',
  backdrop: 'soso',
  platforms: [
    as(block(-580, -60, 430, 50, true), 'wood'),
    as(ground(230, 330, 110, -20), 'sand'),
    as(thin(-110, 30, 190, { dx: 120, dy: 6, period: 420 }), 'plank'),
    as(thin(-500, -210, 170), 'awning'),
  ],
  scenery: [
    { kind: 'posts', x: -580, y: -10, w: 430, h: 220 },
    { kind: 'palm', x: 330, y: -300, w: 170, h: 280 },
  ],
  liquid: { kind: 'water', y: 70 },
  blast: { left: -1250, right: 1250, top: -1100, bottom: 520 },
  camera: { left: -1000, right: 1000, top: -760, bottom: 380 },
  spawns: [
    { x: -460, y: -60 },
    { x: 300, y: -20 },
    { x: -260, y: -60 },
    { x: 470, y: -20 },
  ],
  respawn: { x: 0, y: -460 },
  theme: {
    material: 'bois',
    top: '#e0b070',
    side: '#a06a3a',
    shade: '#3a2010',
    glow: '#ffffff',
    tint: 'rgba(0,20,40,0.1)',
  },
};

const CALDEIRA: StageDef = {
  id: 'caldeira',
  name: 'Caldeira',
  subtitle: 'Lave brûlante, boules de feu',
  backdrop: 'indianne',
  platforms: [
    as(ground(-580, 340, 130, 0), 'basalt'),
    as(ground(240, 340, 130, 0), 'basalt'),
    as({ ...ground(-130, 260, 90, -190), move: { dx: 0, dy: 40, period: 400 } }, 'basalt'),
    as(ground(-70, 140, 70, 110), 'basalt'),
  ],
  liquid: { kind: 'lava', y: 220 },
  ambience: 'embers',
  blast: { left: -1250, right: 1250, top: -1100, bottom: 720 },
  camera: { left: -1000, right: 1000, top: -760, bottom: 420 },
  spawns: [
    { x: -450, y: 0 },
    { x: 410, y: 0 },
    { x: -300, y: 0 },
    { x: 300, y: 0 },
  ],
  respawn: { x: 0, y: -460 },
  theme: {
    material: 'pierre',
    top: '#5a4a48',
    side: '#2e2626',
    shade: '#120a0a',
    glow: '#ff7a1a',
    tint: 'rgba(120,20,0,0.35)',
  },
};

const ARBRE: StageDef = {
  id: 'arbre',
  name: 'Arbre Millénaire',
  subtitle: 'Une île, un grand arbre et ses branches',
  backdrop: 'clem',
  platforms: [
    as(ground(-480, 960, 150), 'earth'),
    as(thin(-340, -170, 210), 'branch'),
    as(thin(130, -170, 210), 'branch'),
    as(thin(-105, -330, 210), 'branch'),
  ],
  scenery: [
    { kind: 'tree', x: -280, y: -560, w: 560, h: 560 },
    { kind: 'fence', x: -460, y: -36, w: 150, h: 36 },
    { kind: 'fence', x: 310, y: -36, w: 150, h: 36 },
  ],
  ambience: 'leaves',
  blast: { left: -1200, right: 1200, top: -1100, bottom: 660 },
  camera: { left: -950, right: 950, top: -780, bottom: 400 },
  spawns: [
    { x: -330, y: 0 },
    { x: 330, y: 0 },
    { x: -110, y: 0 },
    { x: 110, y: 0 },
  ],
  respawn: { x: 0, y: -520 },
  theme: {
    material: 'herbe',
    top: '#7cc84a',
    side: '#9a6a3a',
    shade: '#2e1a0e',
    glow: '#ffe08a',
    tint: 'rgba(30,15,0,0.1)',
  },
};

export const SCENIC_STAGES: readonly StageDef[] = [
  VILLAGE,
  ARCHIPEL,
  FORTERESSE,
  CARGO,
  LAGUNE,
  CALDEIRA,
  ARBRE,
];
