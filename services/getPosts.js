// services/getPosts.js
async function getPostLinks(page, username, limit = 5) {
  const profileUrl = `https://www.instagram.com/${username}/`;
  await page.goto(profileUrl, { waitUntil: 'networkidle2' });

  // Scroll and collect links
  const postLinks = new Set();

  while (postLinks.size < limit) {
    const links = await page.$$eval('a', anchors =>
      anchors
        .map(a => a.href)
        .filter(href => href.includes('/p/')) // only post URLs
    );

    links.forEach(link => postLinks.add(link));

    await page.evaluate(() => window.scrollBy(0, 1000));
    await new Promise(res => setTimeout(res, 1000));
  }

  console.log(`📸 Collected ${postLinks.size} post URLs.`);
  return [...postLinks].slice(0, limit);
}

module.exports = { getPostLinks };
