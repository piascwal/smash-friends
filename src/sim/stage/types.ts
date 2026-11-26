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
  /** Mouvement de va-et-vient (sinusoïde) : amplitude et période en images. */
  move?: { dx: number; dy: number; period: number; phase?: number };
}

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
  /** Adhérence du sol (1 = normale ; la glace glisse). */
  traction?: number;
}
