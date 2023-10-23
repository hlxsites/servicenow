export default async function decorate(block) {
  const rows = Array.from(block.children);
  // title
  const titleContainer = rows[0];
  titleContainer.classList.add('article-title');
  // byLine
  const authorContainer = rows[1];
  authorContainer.classList.add('article-byline');
}
