import { arcHeading, arcHeadingBlock, arcMarqueeLarge, arcXText, div, richText } from "../../scripts/dom-helpers";

export default async function decorate(block) {
  const background = block.querySelector('picture');
  const primaryButton = block.querySelector('.button.primary');
  const secondaryButton = block.querySelector('.button.secondary');

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
          )
        ),
      ),
    ),
  );
}