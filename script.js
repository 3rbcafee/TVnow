(async function () {
    const allowedDomains = ['laky-saydatii.blogspot.com', 'qanwatlive.com']; // ✏️ دوميناتك فقط
    const currentURL = window.location.href;
    const referrerURL = document.referrer;

    const isAllowed = allowedDomains.some(domain =>
        currentURL.includes(domain) || referrerURL.includes(domain)
    );

    if (!isAllowed) {
        document.write(JSON.stringify({ error: 'غير مصرح لك باستخدام هذا المصدر' }));
        return;
    }

    async function fetchTVGuideData() {
        const apiUrl = 'https://api.allorigins.win/raw?url=https://elcinema.com/tvguide/';
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Failed to fetch TV guide');
        return await response.text();
    }

    function extractShowInfo(slot) {
        const listItems = slot.querySelectorAll('ul li');
        if (listItems.length < 1) return null;
        const nameElement = listItems[0].querySelector('a');
        return { name: nameElement ? nameElement.textContent.trim() : listItems[0].textContent.trim() };
    }

    function parseTVShows(htmlContent) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const tvLines = doc.querySelectorAll('.tv-line');
        const shows = [];

        tvLines.forEach(tvLine => {
            try {
                const channelDiv = tvLine.querySelector('.channel .columns.small-12.large-6:not(.hide)');
                if (!channelDiv) return;

                const channelLink = channelDiv.querySelector('a[title]');
                if (!channelLink) return;

                const channelName = channelLink.getAttribute('title');
                const logoImg = channelLink.querySelector('img');
                const channelLogo = logoImg ? logoImg.getAttribute('data-src') || logoImg.src : '';

                const slots = tvLine.querySelectorAll('.tv-slot');
                if (slots.length === 0) return;

                const showInfo = extractShowInfo(slots[0]);
                if (showInfo) {
                    shows.push({
                        channelName,
                        channelLogo,
                        showName: showInfo.name
                    });
                }
            } catch (error) {}
        });

        const result = {
            timestamp: new Date().toISOString(),
            totalChannels: shows.length,
            shows
        };

        document.write(JSON.stringify(result));
    }

    try {
        const htmlContent = await fetchTVGuideData();
        parseTVShows(htmlContent);
    } catch (err) {
        document.write(JSON.stringify({ error: err.message }));
    }
})();
