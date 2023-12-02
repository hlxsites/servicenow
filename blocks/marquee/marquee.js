import {
  arcButton, arcHeading, arcHeadingBlock, arcImage, arcMarqueeLarge, arcXText, div, richText,
} from '../../scripts/dom-helpers.js';

function parseBrightcoveUrl(brightcoveUrl) {
  const url = new URL(brightcoveUrl);
  const videoId = url.searchParams.get('videoId');
  const pathnameParts = url.pathname.split('/');
  const accountId = pathnameParts[1];
  const player = pathnameParts[2].split('_')[0];

  return {
    'account-id': accountId,
    'video-id': videoId,
    'player-id': player,
  }
}

export default async function decorate(block) {
  const background = block.querySelector('picture');
  background && background.parentElement.remove();
  const primaryButton = block.querySelector('.button.primary');
  const primaryButtonIcon = primaryButton.querySelector('i');
  primaryButtonIcon.classList.add('fa-light');
  primaryButtonIcon.slot = 'label-icon';
  primaryButton.remove();

  const secondaryButton = block.querySelector('.button.secondary');
  const secondaryButtonIcon = secondaryButton.querySelector('i');
  secondaryButtonIcon.slot = 'label-icon';
  secondaryButtonIcon.classList.add('fa-light');
  secondaryButton.remove();

  const header = block.querySelector('h1');
  const subheader = block.querySelector('p:not(.button-container)');

  block.innerHTML = '';

  let surface = 'dark';
  const surfaceVariant = [...block.classList].find((clazz) => clazz.startsWith('surface-'));
  if (surfaceVariant) {
    surface = surfaceVariant.split('-')[1];
  }

  block.append(
    div({ class: 'arc-marquee-large' },
      arcMarqueeLarge(
        { 
          class: 'arc-ds-component',
          surface,
          layout: 'asset-right',
          appearance: 'full-width',
          background: 'white',
          accent: 'backdrop',
          'text-background': '',
        },
        arcHeadingBlock(
          {
            surface,
            alignment: 'left',
            orientation: 'vertical',
            'heading-level': '1',
            slot: 'content',
          },
          arcHeading({ 'heading-level': "1", surface, slot: 'heading' },
            header.textContent.toUpperCase(),
          ),
          arcXText({ slot: 'description' },
            richText(subheader.textContent),
          ),
          arcButton(
            {
              behavior: 'brightcove-modal',
              appearance: 'solid',
              mode: 'button',
              size: 'regular',
              label: 'icon-leading',
              surface,
              ...parseBrightcoveUrl(primaryButton.href),
              autoplay: '',
              slot: 'button-primary',
            },
            primaryButtonIcon,
            arcXText({ slot: 'label-text' }, primaryButton.textContent),
          ),
          arcButton(
            {
              behavior: 'default',
              appearance: 'inline',
              mode: 'link',
              size: 'regular',
              label: 'icon-trailing',
              href: secondaryButton.href,
              target: '_self',
              surface,
              slot: 'button-secondary'
            },
            secondaryButtonIcon,
            arcXText({ slot: 'label-text' }, secondaryButton.textContent),
          ),
        ),
        arcImage(
          {
            slot: 'asset',
            alt: background.querySelector('img').alt,
            position: 'top',
            fit: 'cover',
            srcset: background.querySelector('img').currentSrc,
          },
        ),
      ),
    ),
  );
}