/* Écran titre : logo animé, combattants qui défilent, « appuie pour jouer ». */
import type { Screen } from '../../app/screen';
import { characterIds, characterInfo, portraitUrl } from '../../assets/loader';
import { h } from '../dom';

export function titleScreen(onStart: () => void): Screen {
  const strip = h('div.title-strip');
  const el = h(
    'div.screen.title-screen',
    { onclick: () => onStart() },
    h('div.title-rays'),
    strip,
    h('div.logo', {}, h('span.logo-smash', {}, 'SMASH'), h('span.logo-friends', {}, 'FRIENDS')),
    h('div.press', { 'data-nav': true, tabindex: 0, 'data-autofocus': true }, 'APPUIE POUR JOUER'),
    h('div.title-foot', {}, 'Combat de potes · jusqu’à 4 joueurs'),
  );
  void characterIds().then(async (ids) => {
    for (const id of [...ids, ...ids]) {
      const info = await characterInfo(id);
      strip.append(h('img', { src: portraitUrl(info), alt: info.name, style: `--c:${info.color}` }));
    }
  });
  return {
    el,
    nav: (a) => {
      if (a === 'ok' || a === 'start') onStart();
      return true;
    },
  };
}
