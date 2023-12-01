import { arcButton, arcHeading, arcHeadingBlock, arcImage, arcMarqueeLarge, arcXText, div, richText } from '../../scripts/dom-helpers.js';

export default async function decorate(block) {
  const background = block.querySelector('picture');
  background && background.parentElement.remove();
  const primaryButton = block.querySelector('.button.primary');
  primaryButton && primaryButton.remove();
  const secondaryButton = block.querySelector('.button.secondary');
  secondaryButton && secondaryButton.remove();

  const header = block.querySelector('h1');
  const subheader = block.querySelector('p:not(.button-container)');

  block.innerHTML = '';

  block.append(
    div({ class: 'arc-marquee-large' },
      arcMarqueeLarge(
        { 
          class: 'arc-ds-component',
          surface: 'dark',
          layout: 'asset-right',
          appearance: 'full-width',
          background: 'white',
          accent: 'backdrop',
          'text-background': '',
        },
        arcHeadingBlock(
          {
            surface: 'dark',
            alignment: 'left',
            orientation: 'vertical',
            'heading-level': '1',
            slot: 'content',
          },
          arcHeading({ 'heading-level': "1", surface: 'dark', slot: 'heading' },
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
              surface: 'dark',
              'account-id': '5703385908001',
              'video-id': '6320941653112',
              'player-id': 'default',
              autoplay: '',
              slot: 'button-primary',
            },
            arcXText({ slot: 'label-text' }, primaryButton.textContent),
          ),
          arcButton(
            {
              behavior: 'default',
              appearance: 'inline',
              mode: 'link',
              size: 'regular',
              label: 'icon-trailing',
              href: '/lpdem/demonow-all.html',
              target: '_self',
              surface: 'dark',
              slot: 'button-secondary'
            },
            arcXText({ slot: 'label-text' }, secondaryButton.textContent),
          ),
        ),
        arcImage(
          {
            slot: 'asset',
            alt: background.querySelector('img').alt,
            position: 'top',
            fit: 'cover', 
            srcset: background.querySelector('img').src, // TODO get all src set.
          },
        ),
      ),
    ),
  );
}