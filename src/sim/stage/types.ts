/* Description d'un stage : géométrie (en pixels du monde, x = 0 au centre, y = 0 au sol principal,
   y vers le bas), zones d'éjection, points d'apparition et habillage. */

export interface PlatformDef {
  /** Coin haut gauche. */
  x: number;
  y: number;
  w: number;
  /** Épaisseur (dessin, et murs des plateformes pleines). */
  h: number;
  /** Pleine : on ne la traverse pas (murs, rebords). Sinon, plateforme fine qu'on traverse par en dessous. */
  solid: boolean;
  /** Rebords qu'on peut saisir aux deux bouts (plateformes pleines). */
  ledges?: boolean;
  /** Dessin : île flottante (dessous en pointe, par défaut) ou bloc droit (pilier, mur, tour, pont). */
  shape?: 'island' | 'block';
  /** Mouvement de va-et-vient (sinusoïde) : amplitude et période en images. */
  move?: { dx: number; dy: number; period: number; phase?: number };
  /** Ce que la plateforme représente (dessin) ; absent : déduit de la matière du stage. */
  look?: PlatformLook;
}

/** Ce que représente une plateforme : le rendu la dessine en conséquence. */
export type PlatformLook =
  | 'earth'
  | 'rock'
  | 'house'
  | 'castle'
  | 'wood'
  | 'metal'
  | 'hull'
  | 'sand'
  | 'ice'
  | 'neon'
  | 'basalt'
  | 'plank'
  | 'branch'
  | 'awning'
  | 'cloud'
  | 'girder';

/** Décor sans collision, dessiné derrière (ou devant) les combattants. */
export interface SceneryDef {
  kind:
    | 'tree'
    | 'palm'
    | 'posts'
    | 'tower'
    | 'ruins'
    | 'chimney'
    | 'fence'
    | 'lamp'
    | 'flag'
    | 'engine'
    | 'vines';
  x: number;
  y: number;
  w: number;
  h: number;
  front?: boolean;
}

/** Étendue d'eau (on y tombe) ou de lave (elle brûle et projette en l'air), à cette hauteur. */
export interface Liquid {
  kind: 'water' | 'lava';
  y: number;
}

/** Ambiance animée par le rendu : vitesse (vol), braises, feuilles, poussière d'étoiles. */
export type Ambience = 'speed' | 'embers' | 'leaves' | 'sparkles';

export type Material = 'pierre' | 'metal' | 'bois' | 'neon' | 'sable' | 'herbe' | 'glace';

export interface Theme {
  material: Material;
  /** Dessus de la plateforme, side, shade, et glow des plateformes fines. */
  top: string;
  side: string;
  shade: string;
  glow: string;
  /** Teinte posée sur le décor de fond (assombrit pour faire ressortir les combattants). */
  tint: string;
}

export interface StageDef {
  id: string;
  name: string;
  subtitle: string;
  /** Personnage de la banque dont le décor (`stage.webp`) sert de fond. */
  backdrop: string;
  platforms: PlatformDef[];
  /** Au-delà de ces limites, c'est l'éjection. */
  blast: { left: number; right: number; top: number; bottom: number };
  /** Ce que la caméra peut montrer au plus large. */
  camera: { left: number; right: number; top: number; bottom: number };
  spawns: { x: number; y: number }[];
  respawn: { x: number; y: number };
  theme: Theme;
  scenery?: SceneryDef[];
  liquid?: Liquid;
  ambience?: Ambience;
  /** Adhérence du sol (1 = normale ; la glace glisse). */
  traction?: number;
}
