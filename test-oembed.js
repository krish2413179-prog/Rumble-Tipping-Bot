fetch('https://rumble.com/api/Media/oembed.json?url=https://rumble.com/v60552h-newsmax2-live-real-news-for-real-people.html')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
